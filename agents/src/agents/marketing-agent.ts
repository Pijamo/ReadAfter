import { ClaudeClient, MODELS } from "../claude-client.js";
import { MARKETING_SYSTEM_PROMPT } from "../prompts/marketing-system.js";
import { marketingOutputSchema } from "../schemas/marketing-output.js";
import { ArticleDraft, MarketingAssets } from "../types.js";

export async function generateMarketing(
  client: ClaudeClient,
  article: ArticleDraft
): Promise<MarketingAssets> {
  console.log(
    `[Marketing Agent] Creating social posts for "${article.frontmatter.title}"...`
  );

  const bookList = article.frontmatter.books
    .map((b) => `- "${b.title}" by ${b.author}`)
    .join("\n");

  const userMessage = `Create marketing assets for this published article.

ARTICLE TITLE: ${article.frontmatter.title}
CATEGORY: ${article.frontmatter.category}
DESCRIPTION: ${article.frontmatter.description}
URL SLUG: ${article.slug}

BOOKS COVERED:
${bookList}

ARTICLE EXCERPT (first 500 chars):
${article.bodyMarkdown.slice(0, 500)}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.fast,
    MARKETING_SYSTEM_PROMPT,
    userMessage,
    2048,
    "Marketing Agent"
  );

  const json = JSON.parse(extractJson(response));
  const assets = marketingOutputSchema.parse(json);

  console.log(
    `[Marketing Agent] Created: Twitter (${assets.twitterPost.length} chars), LinkedIn, Instagram, ${assets.hashtags.length} hashtags`
  );
  return assets;
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}
