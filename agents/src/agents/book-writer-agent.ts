import { ClaudeClient, MODELS } from "../claude-client.js";
import { BOOK_WRITER_SYSTEM_PROMPT } from "../prompts/book-writer-system.js";
import { BookReviewBrief, BookReviewDraft } from "../types.js";
import { parseJsonResponse } from "../utils/json-parse.js";

export async function draftBookReview(
  client: ClaudeClient,
  brief: BookReviewBrief
): Promise<BookReviewDraft> {
  console.log(
    `[Book Writer Agent] Drafting review for "${brief.title}" by ${brief.author}...`
  );

  const userMessage = `Write a standalone book review based on this brief:

Book: "${brief.title}" by ${brief.author}
ISBN: ${brief.isbn}
Slug: ${brief.slug}
Category: ${brief.category}
Focus Keyword: ${brief.focusKeyword}
Secondary Keywords: ${brief.secondaryKeywords.join(", ")}
Target Word Count: ${brief.targetWordCount}
Review Angle: ${brief.angle}
Search Intent: ${brief.searchIntent}

Current date: ${new Date().toISOString().split("T")[0]}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.quality,
    BOOK_WRITER_SYSTEM_PROMPT,
    userMessage,
    6144,
    "Book Writer Agent"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = parseJsonResponse(response) as any;

  const review: BookReviewDraft = {
    slug: brief.slug,
    frontmatter: json.frontmatter,
    bodyMarkdown: json.bodyMarkdown,
    fullMdx: buildBookMdx(json.frontmatter, json.bodyMarkdown),
  };

  const wordCount = review.bodyMarkdown.split(/\s+/).length;
  console.log(
    `[Book Writer Agent] Review complete: ${wordCount} words, rating: ${review.frontmatter.rating}/5`
  );
  return review;
}

function buildBookMdx(
  frontmatter: BookReviewDraft["frontmatter"],
  body: string
): string {
  const yaml = [
    "---",
    `title: "${esc(frontmatter.title)}"`,
    `author: "${esc(frontmatter.author)}"`,
    `isbn: "${frontmatter.isbn}"`,
    `category: "${frontmatter.category}"`,
    `rating: ${frontmatter.rating}`,
    `summary: "${esc(frontmatter.summary)}"`,
    `amazonUrl: "${frontmatter.amazonUrl}"`,
    `flipkartUrl: "${frontmatter.flipkartUrl}"`,
    `amazonPrice: ${frontmatter.amazonPrice ?? "null"}`,
    `flipkartPrice: ${frontmatter.flipkartPrice ?? "null"}`,
    `tags: [${frontmatter.tags.map((t) => `"${t}"`).join(", ")}]`,
    `date: "${frontmatter.date}"`,
    `featured: ${frontmatter.featured}`,
    `relatedBooks: [${frontmatter.relatedBooks.map((r) => `"${r}"`).join(", ")}]`,
    `seo:`,
    `  focusKeyword: "${esc(frontmatter.seo.focusKeyword)}"`,
    `  metaTitle: "${esc(frontmatter.seo.metaTitle)}"`,
    `  metaDescription: "${esc(frontmatter.seo.metaDescription)}"`,
    "---",
    "",
    body,
  ];
  return yaml.join("\n");
}

function esc(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ");
}
