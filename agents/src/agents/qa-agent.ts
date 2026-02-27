import { ClaudeClient, MODELS } from "../claude-client.js";
import { QA_SYSTEM_PROMPT } from "../prompts/qa-system.js";
import { qaOutputSchema } from "../schemas/qa-output.js";
import { ArticleDraft } from "../types.js";
import { z } from "zod";

export type QAResult = z.infer<typeof qaOutputSchema>;

export async function checkListingQuality(
  client: ClaudeClient,
  article: ArticleDraft
): Promise<QAResult> {
  console.log(
    `[QA Agent] Checking listing quality for "${article.frontmatter.title}"...`
  );

  const booksJson = JSON.stringify(article.frontmatter.books, null, 2);

  const userMessage = `Review the quality of these book listings:

ARTICLE: ${article.frontmatter.title}
CATEGORY: ${article.frontmatter.category}

BOOKS:
${booksJson}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.fast,
    QA_SYSTEM_PROMPT,
    userMessage,
    2048,
    "QA Agent"
  );

  const json = JSON.parse(extractJson(response));
  const result = qaOutputSchema.parse(json);

  const errors = result.issues.filter((i) => i.severity === "error").length;
  const warnings = result.issues.filter((i) => i.severity === "warning").length;
  console.log(
    `[QA Agent] ${result.passed ? "PASSED" : "FAILED"} — ${errors} error(s), ${warnings} warning(s)`
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
