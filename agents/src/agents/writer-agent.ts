import { ClaudeClient, MODELS } from "../claude-client.js";
import { WRITER_SYSTEM_PROMPT } from "../prompts/writer-system.js";
import { TopicBrief, ArticleDraft } from "../types.js";
import { parseJsonResponse } from "../utils/json-parse.js";

export async function draftArticle(
  client: ClaudeClient,
  brief: TopicBrief
): Promise<ArticleDraft> {
  console.log(`[Writer Agent] Drafting "${brief.suggestedTitle}"...`);

  const userMessage = `Write a book recommendation article based on this topic brief:

Title: ${brief.suggestedTitle}
Slug: ${brief.slug}
Category: ${brief.category}
Focus Keyword: ${brief.focusKeyword}
Secondary Keywords: ${brief.secondaryKeywords.join(", ")}
Target Word Count: ${brief.targetWordCount}
Search Intent: ${brief.searchIntent}

Books to cover:
${brief.books.map((b, i) => `${i + 1}. "${b.title}" by ${b.author} — ${b.whyRecommend}`).join("\n")}

Article outline (H2 sections):
${brief.outline.map((h) => `- ${h}`).join("\n")}

Current date: ${new Date().toISOString().split("T")[0]}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.quality,
    WRITER_SYSTEM_PROMPT,
    userMessage,
    8192,
    "Writer Agent"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = parseJsonResponse(response) as any;

  const article: ArticleDraft = {
    slug: brief.slug,
    frontmatter: json.frontmatter,
    bodyMarkdown: json.bodyMarkdown,
    fullMdx: buildMdx(json.frontmatter, json.bodyMarkdown),
  };

  const wordCount = article.bodyMarkdown.split(/\s+/).length;
  console.log(
    `[Writer Agent] Draft complete: ${wordCount} words, ${article.frontmatter.books.length} books`
  );
  return article;
}

function buildMdx(frontmatter: ArticleDraft["frontmatter"], body: string): string {
  const yaml = [
    "---",
    `title: "${escapeyaml(frontmatter.title)}"`,
    `description: "${escapeyaml(frontmatter.description)}"`,
    `date: "${frontmatter.date}"`,
    `category: "${frontmatter.category}"`,
    `tags: [${frontmatter.tags.map((t) => `"${t}"`).join(", ")}]`,
    `readingTime: ${frontmatter.readingTime}`,
    `featured: ${frontmatter.featured}`,
    `books:`,
    ...frontmatter.books.flatMap((b) => [
      `  - title: "${escapeyaml(b.title)}"`,
      `    author: "${escapeyaml(b.author)}"`,
      `    amazonUrl: "${b.amazonUrl}"`,
      `    flipkartUrl: "${b.flipkartUrl}"`,
      `    amazonPrice: ${b.amazonPrice ?? "null"}`,
      `    flipkartPrice: ${b.flipkartPrice ?? "null"}`,
      `    imageUrl: "${b.imageUrl}"`,
      `    rating: ${b.rating}`,
      `    summary: "${escapeyaml(b.summary)}"`,
    ]),
    `seo:`,
    `  focusKeyword: "${escapeyaml(frontmatter.seo.focusKeyword)}"`,
    `  metaTitle: "${escapeyaml(frontmatter.seo.metaTitle)}"`,
    `  metaDescription: "${escapeyaml(frontmatter.seo.metaDescription)}"`,
    "---",
    "",
    body,
  ];
  return yaml.join("\n");
}

function escapeyaml(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ");
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}
