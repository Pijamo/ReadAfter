import { ClaudeClient, MODELS } from "../claude-client.js";
import { SEO_SYSTEM_PROMPT } from "../prompts/seo-system.js";
import { seoOutputSchema } from "../schemas/seo-output.js";
import { TopicBrief } from "../types.js";

export async function researchTopics(
  client: ClaudeClient,
  category: string,
  count: number,
  existingSlugs: string[]
): Promise<TopicBrief[]> {
  console.log(`[SEO Agent] Researching ${count} topics for "${category}"...`);

  const userMessage = `Generate ${count} topic brief(s) for the "${category}" category.

These article slugs already exist (avoid duplicates):
${existingSlugs.length > 0 ? existingSlugs.map((s) => `- ${s}`).join("\n") : "- (none yet)"}

Current date: ${new Date().toISOString().split("T")[0]}
Current year: ${new Date().getFullYear()}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.fast,
    SEO_SYSTEM_PROMPT,
    userMessage,
    4096,
    "SEO Agent"
  );

  const json = JSON.parse(extractJson(response));
  const parsed = seoOutputSchema.parse(json);

  // Override category to ensure consistency
  const topics = parsed.topics.slice(0, count).map((t) => ({
    ...t,
    category,
  }));

  console.log(
    `[SEO Agent] Generated ${topics.length} topic(s): ${topics.map((t) => t.slug).join(", ")}`
  );
  return topics;
}

function extractJson(text: string): string {
  // Try to extract JSON from markdown code blocks or raw text
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}
