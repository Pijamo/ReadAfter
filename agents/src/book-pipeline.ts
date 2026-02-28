import { ClaudeClient } from "./claude-client.js";
import { researchBooks } from "./agents/book-seo-agent.js";
import { draftBookReview } from "./agents/book-writer-agent.js";
import { polishBookReview } from "./agents/book-editor-agent.js";
import { reviewArticle } from "./agents/manager-agent.js";
import { generateMarketing } from "./agents/marketing-agent.js";
import { checkListingQuality } from "./agents/qa-agent.js";
import { validateLinks } from "./agents/link-validator-agent.js";
import { suggestInternalLinks } from "./agents/internal-linking-agent.js";
import {
  saveIntermediate,
  writeBookMdxFile,
  getExistingBookSlugs,
} from "./utils/file-io.js";
import {
  BookPipelineConfig,
  BookPipelineResult,
  BookReviewDraft,
  ArticleDraft,
} from "./types.js";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const MAX_REVISION_CYCLES = 2;

/**
 * Adapts a BookReviewDraft to look like an ArticleDraft so we can reuse
 * the Manager, QA, Link Validator, Marketing, and Internal Linking agents.
 */
function bookToArticleAdapter(review: BookReviewDraft): ArticleDraft {
  return {
    slug: review.slug,
    frontmatter: {
      title: `${review.frontmatter.title} by ${review.frontmatter.author}`,
      description: review.frontmatter.summary,
      date: review.frontmatter.date,
      category: review.frontmatter.category,
      tags: review.frontmatter.tags,
      readingTime: Math.ceil(
        review.bodyMarkdown.split(/\s+/).length / 200
      ),
      featured: review.frontmatter.featured,
      books: [
        {
          title: review.frontmatter.title,
          author: review.frontmatter.author,
          amazonUrl: review.frontmatter.amazonUrl,
          flipkartUrl: review.frontmatter.flipkartUrl,
          amazonPrice: review.frontmatter.amazonPrice,
          flipkartPrice: review.frontmatter.flipkartPrice,
          imageUrl: `https://covers.openlibrary.org/b/isbn/${review.frontmatter.isbn}-L.jpg`,
          rating: review.frontmatter.rating,
          summary: review.frontmatter.summary,
        },
      ],
      seo: review.frontmatter.seo,
    },
    bodyMarkdown: review.bodyMarkdown,
    fullMdx: review.fullMdx,
  };
}

export async function runBookPipeline(
  config: BookPipelineConfig
): Promise<BookPipelineResult[]> {
  const client = new ClaudeClient();
  const results: BookPipelineResult[] = [];

  console.log(`\n========================================`);
  console.log(`ReadAfter Book Review Pipeline (9 agents)`);
  console.log(`Category: ${config.category}`);
  console.log(`Count: ${config.count}`);
  console.log(`Dry run: ${config.dryRun}`);
  console.log(`========================================\n`);

  // Step 1: Book SEO Research — find books worth reviewing
  const bookBriefs = await researchBooks(
    client,
    config.category,
    config.count,
    config.existingSlugs
  );

  // Load existing content for internal linking
  const existingContent = loadExistingContentMeta();

  for (const brief of bookBriefs) {
    saveIntermediate("book-seo", brief.slug, brief);

    console.log(
      `\n--- Processing: "${brief.title}" by ${brief.author} ---\n`
    );

    // Step 2: Write Book Review Draft
    let review: BookReviewDraft = await draftBookReview(client, brief);
    saveIntermediate("book-drafts", brief.slug, {
      frontmatter: review.frontmatter,
      bodyMarkdown: review.bodyMarkdown,
    });

    // Step 3-4: Edit <-> Review loop (reuse Manager via adapter)
    let revisionCycle = 0;
    let approved = false;
    let managerScore = 0;
    let managerFeedback: string[] | undefined;

    // Create a fake TopicBrief for the manager agent
    const fakeBrief = {
      suggestedTitle: `${brief.title} — Book Review`,
      slug: brief.slug,
      focusKeyword: brief.focusKeyword,
      secondaryKeywords: brief.secondaryKeywords,
      category: brief.category,
      targetWordCount: brief.targetWordCount,
      books: [
        {
          title: brief.title,
          author: brief.author,
          whyRecommend: brief.angle,
        },
      ],
      outline: [],
      searchIntent: brief.searchIntent,
    };

    while (!approved && revisionCycle < MAX_REVISION_CYCLES) {
      // Edit
      const editResult = await polishBookReview(
        client,
        review,
        brief,
        managerFeedback
      );
      review = editResult.review;
      saveIntermediate(
        "book-edits",
        `${brief.slug}-v${revisionCycle + 1}`,
        {
          frontmatter: review.frontmatter,
          bodyMarkdown: review.bodyMarkdown,
          changesMade: editResult.changesMade,
        }
      );

      // Review — use the article adapter for the manager
      const articleAdapter = bookToArticleAdapter(review);
      const decision = await reviewArticle(
        client,
        articleAdapter,
        fakeBrief,
        revisionCycle + 1
      );
      managerScore = decision.score;

      if (decision.approved) {
        approved = true;
        console.log(
          `\n[Pipeline] Book review APPROVED with score ${decision.score}/10`
        );
      } else {
        revisionCycle++;
        managerFeedback = decision.feedback;
        console.log(
          `\n[Pipeline] Book review REJECTED (score: ${decision.score}/10), revision ${revisionCycle}/${MAX_REVISION_CYCLES}`
        );
        if (revisionCycle >= MAX_REVISION_CYCLES) {
          console.log(
            `[Pipeline] Max revisions reached — force approving with warnings`
          );
          approved = true;
        }
      }
    }

    // Step 5: Post-approval quality checks (via adapter)
    console.log(`\n[Pipeline] Running post-approval checks...\n`);
    const articleAdapter = bookToArticleAdapter(review);

    // 5a: QA — check listing quality
    const qaResult = await checkListingQuality(client, articleAdapter);
    saveIntermediate("book-qa", brief.slug, qaResult);

    // 5b: Link validation
    const linkResult = await validateLinks(client, articleAdapter);
    saveIntermediate("book-links", brief.slug, linkResult);

    // 5c: Internal linking suggestions
    const linkingSuggestions = await suggestInternalLinks(
      client,
      articleAdapter,
      existingContent
    );
    saveIntermediate("book-internal-links", brief.slug, linkingSuggestions);

    // Step 6: Marketing
    const marketing = await generateMarketing(client, articleAdapter);
    saveIntermediate("book-marketing", brief.slug, marketing);

    // Step 7: Write final MDX to content/books/
    if (!config.dryRun) {
      writeBookMdxFile(brief.slug, review.fullMdx);
    } else {
      console.log(
        `\n[Pipeline] DRY RUN — skipping MDX write for ${brief.slug}`
      );
    }

    // Collect warnings
    const linkWarnings = linkResult.results
      .filter((r) => !r.amazonUrl.valid || !r.flipkartUrl.valid)
      .map(
        (r) =>
          `${r.bookTitle}: ${r.amazonUrl.issue || ""} ${r.flipkartUrl.issue || ""}`.trim()
      );

    const totalLinkSuggestions =
      linkingSuggestions.linksToNewArticle.length +
      linkingSuggestions.linksFromNewArticle.length;

    results.push({
      review,
      marketing,
      managerScore,
      revisionCycles: revisionCycle,
      costUsd: 0,
      qaIssues: qaResult.issues,
      linkWarnings,
      internalLinkSuggestions: totalLinkSuggestions,
    });

    // Add this book to existing content for next iteration's internal linking
    existingContent.push({
      slug: brief.slug,
      title: review.frontmatter.title,
      category: review.frontmatter.category,
    });
  }

  // Print cost summary
  const totalCost = client.costTracker.getTotalCost();
  console.log(`\n========================================`);
  console.log(client.costTracker.getSummary());
  console.log(`\nBook Review Summary:`);
  for (const r of results) {
    console.log(
      `  "${r.review.frontmatter.title}" by ${r.review.frontmatter.author}`
    );
    console.log(
      `    Score: ${r.managerScore}/10 | Revisions: ${r.revisionCycles} | Rating: ${r.review.frontmatter.rating}/5`
    );
    console.log(
      `    QA issues: ${r.qaIssues.length} | Link warnings: ${r.linkWarnings.length}`
    );
    console.log(
      `    Internal link suggestions: ${r.internalLinkSuggestions}`
    );
  }
  console.log(`========================================\n`);

  // Update cost in results
  if (results.length > 0) {
    const costPerReview = totalCost / results.length;
    results.forEach((r) => (r.costUsd = costPerReview));
  }

  return results;
}

/**
 * Load existing articles AND books for internal linking.
 */
function loadExistingContentMeta(): {
  slug: string;
  title: string;
  category: string;
}[] {
  const results: { slug: string; title: string; category: string }[] = [];

  // Load articles
  const articlesDir = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "content",
    "articles"
  );
  if (fs.existsSync(articlesDir)) {
    const articles = fs
      .readdirSync(articlesDir)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => {
        const raw = fs.readFileSync(path.join(articlesDir, f), "utf-8");
        const { data } = matter(raw);
        return {
          slug: f.replace(/\.mdx$/, ""),
          title: (data.title as string) || f,
          category: (data.category as string) || "unknown",
        };
      });
    results.push(...articles);
  }

  // Load books
  const booksDir = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "content",
    "books"
  );
  if (fs.existsSync(booksDir)) {
    const books = fs
      .readdirSync(booksDir)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => {
        const raw = fs.readFileSync(path.join(booksDir, f), "utf-8");
        const { data } = matter(raw);
        return {
          slug: f.replace(/\.mdx$/, ""),
          title: (data.title as string) || f,
          category: (data.category as string) || "unknown",
        };
      });
    results.push(...books);
  }

  return results;
}
