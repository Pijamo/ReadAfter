import { ClaudeClient, MODELS } from "../claude-client.js";
import { FRESHNESS_SYSTEM_PROMPT } from "../prompts/freshness-system.js";
import { freshnessOutputSchema } from "../schemas/freshness-output.js";
import { z } from "zod";

export type FreshnessResult = z.infer<typeof freshnessOutputSchema>;

export async function checkFreshness(
  client: ClaudeClient,
  articleTitle: string,
  articleSlug: string,
  frontmatterJson: string,
  bodyExcerpt: string
): Promise<FreshnessResult> {
  console.log(`[Freshness Agent] Checking freshness of "${articleTitle}"...`);

  const userMessage = `Review this article for freshness and identify any content that needs updating.

ARTICLE: ${articleTitle}
SLUG: ${articleSlug}
CURRENT DATE: ${new Date().toISOString().split("T")[0]}

FRONTMATTER:
${frontmatterJson}

ARTICLE BODY (first 2000 chars):
${bodyExcerpt}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.fast,
    FRESHNESS_SYSTEM_PROMPT,
    userMessage,
    2048,
    "Freshness Agent"
  );

  const json = JSON.parse(extractJson(response));
  const result = freshnessOutputSchema.parse(json);

  console.log(
    `[Freshness Agent] ${result.needsUpdate ? `NEEDS UPDATE (${result.urgency})` : "FRESH"} — ${result.updates.length} update(s) suggested`
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
