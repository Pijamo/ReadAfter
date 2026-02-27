import { ClaudeClient, MODELS } from "../claude-client.js";
import { MANAGER_SYSTEM_PROMPT } from "../prompts/manager-system.js";
import { managerDecisionSchema } from "../schemas/manager-decision.js";
import { ArticleDraft, TopicBrief, ManagerDecision } from "../types.js";

export async function reviewArticle(
  client: ClaudeClient,
  article: ArticleDraft,
  brief: TopicBrief,
  revisionCycle: number
): Promise<ManagerDecision> {
  console.log(
    `[Manager Agent] Reviewing "${article.frontmatter.title}" (revision ${revisionCycle})...`
  );

  const userMessage = `Review this article for publication readiness.

REVISION CYCLE: ${revisionCycle} of 2 maximum
${revisionCycle >= 2 ? "NOTE: This is the final revision cycle. Approve with warnings unless critically flawed." : ""}

ORIGINAL TOPIC BRIEF:
- Focus Keyword: ${brief.focusKeyword}
- Target Word Count: ${brief.targetWordCount}
- Category: ${brief.category}

ARTICLE FRONTMATTER:
${JSON.stringify(article.frontmatter, null, 2)}

ARTICLE BODY:
${article.bodyMarkdown}

WORD COUNT: ${article.bodyMarkdown.split(/\s+/).length}

Remember: respond with ONLY valid JSON.`;

  const response = await client.chat(
    MODELS.fast,
    MANAGER_SYSTEM_PROMPT,
    userMessage,
    2048,
    "Manager Agent"
  );

  const json = JSON.parse(extractJson(response));
  const decision = managerDecisionSchema.parse(json);

  const status = decision.approved ? "APPROVED" : "REJECTED";
  console.log(
    `[Manager Agent] ${status} (score: ${decision.score}/10) — ${decision.feedback.length} feedback item(s)`
  );

  return decision;
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}
