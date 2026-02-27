import { ClaudeClient, MODELS } from "../claude-client.js";
import { LINK_VALIDATOR_SYSTEM_PROMPT } from "../prompts/link-validator-system.js";
import { linkValidatorOutputSchema } from "../schemas/link-validator-output.js";
import { ArticleDraft } from "../types.js";
import { z } from "zod";

export type LinkValidationResult = z.infer<typeof linkValidatorOutputSchema>;

export async function validateLinks(
  client: ClaudeClient,
  article: ArticleDraft
): Promise<LinkValidationResult> {
  console.log(
    `[Link Validator] Checking links for "${article.frontmatter.title}"...`
  );

  const booksJson = article.frontmatter.books.map((b, i) => ({
    index: i,
    title: b.title,
    author: b.author,
    amazonUrl: b.amazonUrl,
    flipkartUrl: b.flipkartUrl,
  }));

  const userMessage = `Validate the affiliate links in these book listings:

${JSON.stringify(booksJson, null, 2)}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.fast,
    LINK_VALIDATOR_SYSTEM_PROMPT,
    userMessage,
    2048,
    "Link Validator"
  );

  const json = JSON.parse(extractJson(response));
  const result = linkValidatorOutputSchema.parse(json);

  const placeholders = result.results.filter(
    (r) => r.amazonUrl.isPlaceholder || r.flipkartUrl.isPlaceholder
  ).length;
  console.log(
    `[Link Validator] ${result.allValid ? "ALL VALID" : "ISSUES FOUND"} — ${placeholders} placeholder link(s)`
  );

  return result;
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}
