import { ClaudeClient, MODELS } from "../claude-client.js";
import { BOOK_EDITOR_SYSTEM_PROMPT } from "../prompts/book-editor-system.js";
import { BookReviewBrief, BookReviewDraft, BookEditResult } from "../types.js";
import { parseJsonResponse } from "../utils/json-parse.js";

export async function polishBookReview(
  client: ClaudeClient,
  draft: BookReviewDraft,
  brief: BookReviewBrief,
  managerFeedback?: string[]
): Promise<BookEditResult> {
  console.log(
    `[Book Editor Agent] Polishing review for "${draft.frontmatter.title}"...`
  );

  let userMessage = `Edit and polish this book review for publication.

BOOK BRIEF:
- Title: "${brief.title}" by ${brief.author}
- ISBN: ${brief.isbn}
- Focus Keyword: ${brief.focusKeyword}
- Category: ${brief.category}
- Review Angle: ${brief.angle}

CURRENT REVIEW FRONTMATTER:
${JSON.stringify(draft.frontmatter, null, 2)}

CURRENT REVIEW BODY:
${draft.bodyMarkdown}`;

  if (managerFeedback && managerFeedback.length > 0) {
    userMessage += `

MANAGER FEEDBACK (address each point):
${managerFeedback.map((f, i) => `${i + 1}. ${f}`).join("\n")}`;
  }

  userMessage += `

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.quality,
    BOOK_EDITOR_SYSTEM_PROMPT,
    userMessage,
    6144,
    "Book Editor Agent"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = parseJsonResponse(response) as any;

  const editedReview: BookReviewDraft = {
    slug: draft.slug,
    frontmatter: json.frontmatter,
    bodyMarkdown: json.bodyMarkdown,
    fullMdx: buildBookMdx(json.frontmatter, json.bodyMarkdown),
  };

  const result: BookEditResult = {
    review: editedReview,
    changesMade: json.changesMade || [],
  };

  console.log(
    `[Book Editor Agent] Made ${result.changesMade.length} change(s): ${result.changesMade.slice(0, 3).join("; ")}${result.changesMade.length > 3 ? "..." : ""}`
  );
  return result;
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
    `amazonPrice: ${frontmatter.amazonPrice ?? "null"}`,
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
