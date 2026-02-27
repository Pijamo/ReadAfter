import { ClaudeClient, MODELS } from "../claude-client.js";
import { INTERNAL_LINKING_SYSTEM_PROMPT } from "../prompts/internal-linking-system.js";
import { internalLinkingOutputSchema } from "../schemas/internal-linking-output.js";
import { ArticleDraft } from "../types.js";
import { z } from "zod";

export type InternalLinkingResult = z.infer<typeof internalLinkingOutputSchema>;

interface ExistingArticle {
  slug: string;
  title: string;
  category: string;
}

export async function suggestInternalLinks(
  client: ClaudeClient,
  newArticle: ArticleDraft,
  existingArticles: ExistingArticle[]
): Promise<InternalLinkingResult> {
  console.log(
    `[Internal Linking] Analyzing links for "${newArticle.frontmatter.title}"...`
  );

  if (existingArticles.length === 0) {
    console.log(
      `[Internal Linking] No existing articles to link to. Skipping.`
    );
    return {
      linksToNewArticle: [],
      linksFromNewArticle: [],
      summary: "No existing articles available for internal linking.",
    };
  }

  const existingList = existingArticles
    .map((a) => `- "${a.title}" (/${a.category}/${a.slug})`)
    .join("\n");

  const userMessage = `Suggest internal links for this newly published article.

NEW ARTICLE:
- Title: ${newArticle.frontmatter.title}
- Category: ${newArticle.frontmatter.category}
- Slug: ${newArticle.slug}
- URL: /${newArticle.frontmatter.category}/${newArticle.slug}
- Description: ${newArticle.frontmatter.description}

ARTICLE BODY (first 1500 chars):
${newArticle.bodyMarkdown.slice(0, 1500)}

EXISTING ARTICLES:
${existingList}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.fast,
    INTERNAL_LINKING_SYSTEM_PROMPT,
    userMessage,
    2048,
    "Internal Linking Agent"
  );

  const json = JSON.parse(extractJson(response));
  const result = internalLinkingOutputSchema.parse(json);

  const totalLinks =
    result.linksToNewArticle.length + result.linksFromNewArticle.length;
  console.log(
    `[Internal Linking] Suggested ${totalLinks} link(s): ${result.linksToNewArticle.length} inbound, ${result.linksFromNewArticle.length} outbound`
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
