/**
 * Robustly parse JSON from LLM responses.
 * Handles: code blocks, unescaped newlines in strings, trailing commas.
 */
export function parseJsonResponse(text: string): unknown {
  // Step 1: Extract JSON from code blocks if present
  let jsonStr = extractJson(text);

  // Step 2: Try direct parse first
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Continue to repairs
  }

  // Step 3: Try to extract frontmatter and body separately
  // The bodyMarkdown field often breaks JSON because it contains unescaped
  // newlines, quotes, and backslashes. We'll extract it separately.
  const bodyMatch = jsonStr.match(/"bodyMarkdown"\s*:\s*"([\s\S]*?)"\s*\}/);
  if (bodyMatch) {
    // Replace the problematic bodyMarkdown value with a placeholder
    const bodyContent = bodyMatch[1];
    const placeholder = "__BODY_PLACEHOLDER__";
    const cleanedJson = jsonStr.replace(
      /"bodyMarkdown"\s*:\s*"[\s\S]*?"\s*\}/,
      `"bodyMarkdown": "${placeholder}"}`
    );

    try {
      const parsed = JSON.parse(cleanedJson) as Record<string, unknown>;
      // Restore the body content, unescaping what we can
      (parsed as Record<string, unknown>).bodyMarkdown = unescapeBody(bodyContent);
      return parsed;
    } catch {
      // Continue to more aggressive repair
    }
  }

  // Step 4: Try to split into frontmatter JSON + body markdown
  const frontmatterEnd = jsonStr.indexOf('"bodyMarkdown"');
  if (frontmatterEnd !== -1) {
    // Find where the bodyMarkdown value starts
    const valueStart = jsonStr.indexOf(":", frontmatterEnd) + 1;
    const quoteStart = jsonStr.indexOf('"', valueStart);

    if (quoteStart !== -1) {
      // Find the last closing brace and quote before it
      const lastBrace = jsonStr.lastIndexOf("}");
      const lastQuote = jsonStr.lastIndexOf('"', lastBrace);

      if (lastQuote > quoteStart) {
        const frontmatterPart = jsonStr.slice(0, frontmatterEnd);
        const bodyRaw = jsonStr.slice(quoteStart + 1, lastQuote);

        // Build a clean JSON object
        const cleanFrontmatter = frontmatterPart + '"bodyMarkdown": ""}';
        try {
          const parsed = JSON.parse(cleanFrontmatter) as Record<string, unknown>;
          (parsed as Record<string, unknown>).bodyMarkdown = unescapeBody(bodyRaw);
          return parsed;
        } catch {
          // Last resort
        }
      }
    }
  }

  // Step 5: Aggressive cleanup — fix common JSON issues
  jsonStr = jsonStr
    .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
    .replace(/\n/g, "\\n") // Escape literal newlines
    .replace(/\t/g, "\\t"); // Escape literal tabs

  return JSON.parse(jsonStr);
}

function extractJson(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

function unescapeBody(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}
