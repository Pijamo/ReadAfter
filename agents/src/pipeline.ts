import { ClaudeClient } from "./claude-client.js";
import { researchTopics } from "./agents/seo-agent.js";
import { draftArticle } from "./agents/writer-agent.js";
import { polishArticle } from "./agents/editor-agent.js";
import { reviewArticle } from "./agents/manager-agent.js";
import { generateMarketing } from "./agents/marketing-agent.js";
import { checkListingQuality } from "./agents/qa-agent.js";
import { validateLinks } from "./agents/link-validator-agent.js";
import { suggestInternalLinks } from "./agents/internal-linking-agent.js";
import {
  saveIntermediate,
  writeMdxFile,
  getExistingSlugs,
} from "./utils/file-io.js";
import { PipelineConfig, PipelineResult, ArticleDraft } from "./types.js";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const MAX_REVISION_CYCLES = 2;

export async function runPipeline(
  config: PipelineConfig
): Promise<PipelineResult[]> {
  const client = new ClaudeClient();
  const results: PipelineResult[] = [];

  console.log(`\n========================================`);
  console.log(`ReadAfter Content Pipeline (9 agents)`);
  console.log(`Category: ${config.category}`);
  console.log(`Count: ${config.count}`);
  console.log(`Dry run: ${config.dryRun}`);
  console.log(`========================================\n`);

  // Step 1: SEO Research
  const topicBriefs = await researchTopics(
    client,
    config.category,
    config.count,
    config.existingSlugs
  );

  // Load existing articles for internal linking
  const existingArticles = loadExistingArticleMeta();

  for (const brief of topicBriefs) {
    saveIntermediate("seo", brief.slug, brief);

    console.log(`\n--- Processing: ${brief.suggestedTitle} ---\n`);

    // Step 2: Write Draft
    let article: ArticleDraft = await draftArticle(client, brief);
    saveIntermediate("drafts", brief.slug, {
      frontmatter: article.frontmatter,
      bodyMarkdown: article.bodyMarkdown,
    });

    // Step 3-4: Edit <-> Review loop
    let revisionCycle = 0;
    let approved = false;
    let managerScore = 0;
    let managerFeedback: string[] | undefined;

    while (!approved && revisionCycle < MAX_REVISION_CYCLES) {
      // Edit
      const editResult = await polishArticle(
        client,
        article,
        brief,
        managerFeedback
      );
      article = editResult.article;
      saveIntermediate("edits", `${brief.slug}-v${revisionCycle + 1}`, {
        frontmatter: article.frontmatter,
        bodyMarkdown: article.bodyMarkdown,
        changesMade: editResult.changesMade,
      });

      // Review
      const decision = await reviewArticle(
        client,
        article,
        brief,
        revisionCycle + 1
      );
      managerScore = decision.score;

      if (decision.approved) {
        approved = true;
        console.log(
          `\n[Pipeline] Article APPROVED with score ${decision.score}/10`
        );
      } else {
        revisionCycle++;
        managerFeedback = decision.feedback;
        console.log(
          `\n[Pipeline] Article REJECTED (score: ${decision.score}/10), revision ${revisionCycle}/${MAX_REVISION_CYCLES}`
        );
        if (revisionCycle >= MAX_REVISION_CYCLES) {
          console.log(
            `[Pipeline] Max revisions reached — force approving with warnings`
          );
          approved = true;
        }
      }
    }

    // Step 5: Post-approval quality checks (run in parallel conceptually)
    console.log(`\n[Pipeline] Running post-approval checks...\n`);

    // 5a: QA — check listing quality
    const qaResult = await checkListingQuality(client, article);
    saveIntermediate("qa", brief.slug, qaResult);

    // 5b: Link validation
    const linkResult = await validateLinks(client, article);
    saveIntermediate("links", brief.slug, linkResult);

    // 5c: Internal linking suggestions
    const linkingSuggestions = await suggestInternalLinks(
      client,
      article,
      existingArticles
    );
    saveIntermediate("internal-links", brief.slug, linkingSuggestions);

    // Step 6: Marketing
    const marketing = await generateMarketing(client, article);
    saveIntermediate("marketing", brief.slug, marketing);

    // Step 7: Write final MDX
    if (!config.dryRun) {
      writeMdxFile(brief.slug, article.fullMdx);
    } else {
      console.log(
        `\n[Pipeline] DRY RUN — skipping MDX write for ${brief.slug}`
      );
    }

    // Collect warnings
    const linkWarnings = linkResult.results
      .filter((r) => !r.amazonUrl.valid)
      .map(
        (r) =>
          `${r.bookTitle}: ${r.amazonUrl.issue || ""}`.trim()
      );

    const totalLinkSuggestions =
      linkingSuggestions.linksToNewArticle.length +
      linkingSuggestions.linksFromNewArticle.length;

    results.push({
      article,
      marketing,
      managerScore,
      revisionCycles: revisionCycle,
      costUsd: 0,
      qaIssues: qaResult.issues,
      linkWarnings,
      internalLinkSuggestions: totalLinkSuggestions,
    });

    // Add this article to existing articles for next iteration's internal linking
    existingArticles.push({
      slug: brief.slug,
      title: article.frontmatter.title,
      category: article.frontmatter.category,
    });
  }

  // Print cost summary
  const totalCost = client.costTracker.getTotalCost();
  console.log(`\n========================================`);
  console.log(client.costTracker.getSummary());
  console.log(`\nArticle Summary:`);
  for (const r of results) {
    console.log(`  ${r.article.frontmatter.title}`);
    console.log(
      `    Score: ${r.managerScore}/10 | Revisions: ${r.revisionCycles}`
    );
    console.log(
      `    QA issues: ${r.qaIssues.length} | Link warnings: ${r.linkWarnings.length}`
    );
    console.log(`    Internal link suggestions: ${r.internalLinkSuggestions}`);
  }
  console.log(`========================================\n`);

  // Update cost in results
  const costPerArticle = totalCost / results.length;
  results.forEach((r) => (r.costUsd = costPerArticle));

  return results;
}

function loadExistingArticleMeta(): {
  slug: string;
  title: string;
  category: string;
}[] {
  const contentDir = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "content",
    "articles"
  );

  if (!fs.existsSync(contentDir)) return [];

  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(contentDir, f), "utf-8");
      const { data } = matter(raw);
      return {
        slug: f.replace(/\.mdx$/, ""),
        title: (data.title as string) || f,
        category: (data.category as string) || "unknown",
      };
    });
}
