import { ClaudeClient, MODELS } from "../claude-client.js";
import { EDITOR_SYSTEM_PROMPT } from "../prompts/editor-system.js";
import { ArticleDraft, TopicBrief, EditResult } from "../types.js";
import { parseJsonResponse } from "../utils/json-parse.js";

export async function polishArticle(
  client: ClaudeClient,
  draft: ArticleDraft,
  brief: TopicBrief,
  managerFeedback?: string[]
): Promise<EditResult> {
  console.log(`[Editor Agent] Polishing "${draft.frontmatter.title}"...`);

  let userMessage = `Edit and polish this article for publication.

TOPIC BRIEF:
- Title: ${brief.suggestedTitle}
- Focus Keyword: ${brief.focusKeyword}
- Category: ${brief.category}

CURRENT ARTICLE FRONTMATTER:
${JSON.stringify(draft.frontmatter, null, 2)}

CURRENT ARTICLE BODY:
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
    EDITOR_SYSTEM_PROMPT,
    userMessage,
    8192,
    "Editor Agent"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = parseJsonResponse(response) as any;

  const editedArticle: ArticleDraft = {
    slug: draft.slug,
    frontmatter: json.frontmatter,
    bodyMarkdown: json.bodyMarkdown,
    fullMdx: buildMdx(json.frontmatter, json.bodyMarkdown),
  };

  const result: EditResult = {
    article: editedArticle,
    changesMade: json.changesMade || [],
  };

  console.log(
    `[Editor Agent] Made ${result.changesMade.length} change(s): ${result.changesMade.slice(0, 3).join("; ")}${result.changesMade.length > 3 ? "..." : ""}`
  );
  return result;
}

function buildMdx(frontmatter: ArticleDraft["frontmatter"], body: string): string {
  const yaml = [
    "---",
    `title: "${esc(frontmatter.title)}"`,
    `description: "${esc(frontmatter.description)}"`,
    `date: "${frontmatter.date}"`,
    `category: "${frontmatter.category}"`,
    `tags: [${frontmatter.tags.map((t) => `"${t}"`).join(", ")}]`,
    `readingTime: ${frontmatter.readingTime}`,
    `featured: ${frontmatter.featured}`,
    `books:`,
    ...frontmatter.books.flatMap((b) => [
      `  - title: "${esc(b.title)}"`,
      `    author: "${esc(b.author)}"`,
      `    amazonUrl: "${b.amazonUrl}"`,
      `    flipkartUrl: "${b.flipkartUrl}"`,
      `    amazonPrice: ${b.amazonPrice ?? "null"}`,
      `    flipkartPrice: ${b.flipkartPrice ?? "null"}`,
      `    imageUrl: "${b.imageUrl}"`,
      `    rating: ${b.rating}`,
      `    summary: "${esc(b.summary)}"`,
    ]),
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

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}
