import { ClaudeClient, MODELS } from "../claude-client.js";
import { BOOK_SEO_SYSTEM_PROMPT } from "../prompts/book-seo-system.js";
import { bookSeoOutputSchema } from "../schemas/book-seo-output.js";
import { BookReviewBrief } from "../types.js";

export async function researchBooks(
  client: ClaudeClient,
  category: string,
  count: number,
  existingSlugs: string[]
): Promise<BookReviewBrief[]> {
  console.log(
    `[Book SEO Agent] Researching ${count} book(s) for "${category}"...`
  );

  const userMessage = `Suggest ${count} individual book(s) to review for the "${category}" category.

These book slugs already exist on ReadAfter (avoid duplicates):
${existingSlugs.length > 0 ? existingSlugs.map((s) => `- ${s}`).join("\n") : "- (none yet)"}

Current date: ${new Date().toISOString().split("T")[0]}
Current year: ${new Date().getFullYear()}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.fast,
    BOOK_SEO_SYSTEM_PROMPT,
    userMessage,
    4096,
    "Book SEO Agent"
  );

  const json = JSON.parse(extractJson(response));
  const parsed = bookSeoOutputSchema.parse(json);

  // Override category to ensure consistency
  const books = parsed.books.slice(0, count).map((b) => ({
    ...b,
    category,
  }));

  console.log(
    `[Book SEO Agent] Suggested ${books.length} book(s): ${books.map((b) => b.slug).join(", ")}`
  );
  return books;
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}
