import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ClaudeClient } from "./claude-client.js";
import { checkFreshness } from "./agents/freshness-agent.js";
import { saveIntermediate } from "./utils/file-io.js";

const CONTENT_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "content",
  "articles"
);

export async function runFreshnessCheck() {
  const client = new ClaudeClient();

  console.log(`\n========================================`);
  console.log(`ReadAfter Freshness Check`);
  console.log(`========================================\n`);

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("No content directory found.");
    return;
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  console.log(`Checking ${files.length} article(s) for freshness...\n`);

  const needsUpdate: { file: string; urgency: string; updates: number }[] = [];

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    const result = await checkFreshness(
      client,
      data.title as string,
      slug,
      JSON.stringify(data, null, 2),
      content.slice(0, 2000)
    );

    saveIntermediate("freshness", slug, result);

    if (result.needsUpdate) {
      needsUpdate.push({
        file,
        urgency: result.urgency,
        updates: result.updates.length,
      });
    }
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`Freshness Summary:`);
  if (needsUpdate.length === 0) {
    console.log(`  All ${files.length} articles are fresh!`);
  } else {
    console.log(
      `  ${needsUpdate.length} of ${files.length} articles need updates:`
    );
    for (const item of needsUpdate) {
      console.log(
        `    - ${item.file} (${item.urgency} urgency, ${item.updates} changes)`
      );
    }
  }
  console.log(`\n${client.costTracker.getSummary()}`);
  console.log(`========================================\n`);
}
