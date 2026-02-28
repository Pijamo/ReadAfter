import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env"), override: true });

import minimist from "minimist";
import { runPipeline } from "./pipeline.js";
import { runBookPipeline } from "./book-pipeline.js";
import { runFreshnessCheck } from "./freshness-check.js";
import { getExistingSlugs, getExistingBookSlugs } from "./utils/file-io.js";

const VALID_CATEGORIES = [
  "entrepreneurship",
  "productivity",
  "personal-finance",
  "leadership",
  "self-help",
  "career-growth",
];

function printUsage() {
  console.log(`
ReadAfter Content Pipeline

Usage:
  npx tsx src/index.ts [options]

Commands:
  generate (default)    Generate new content
  freshness             Check existing articles for staleness

Options:
  --type=<type>         Content type: "article" (default) or "book"
  --category=<cat>      Category to target (or "auto" for random)
  --count=<n>           Number of items to generate (1-5, default: 2)
  --dry-run             Skip writing MDX files
  --help                Show this help message

Examples:
  npx tsx src/index.ts --category=productivity --count=1
  npx tsx src/index.ts --type=book --category=personal-finance --count=3
  npx tsx src/index.ts --type=book --category=auto --dry-run
  npx tsx src/index.ts --category=auto --dry-run
  npx tsx src/index.ts freshness
`);
}

async function main() {
  const args = minimist(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const command = args._[0] || "generate";

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "ANTHROPIC_API_KEY environment variable is required.\n" +
        "Set it with: export ANTHROPIC_API_KEY=sk-ant-..."
    );
    process.exit(1);
  }

  if (command === "freshness") {
    await runFreshnessCheck();
    return;
  }

  // Default: generate
  const contentType = args.type || "article";
  const category = args.category || "auto";
  const count = parseInt(args.count || "2", 10);
  const dryRun = args["dry-run"] || false;

  if (!["article", "book"].includes(contentType)) {
    console.error(
      `Invalid type: "${contentType}". Valid types: article, book`
    );
    process.exit(1);
  }

  const selectedCategory =
    category === "auto"
      ? VALID_CATEGORIES[Math.floor(Math.random() * VALID_CATEGORIES.length)]
      : category;

  if (!VALID_CATEGORIES.includes(selectedCategory)) {
    console.error(
      `Invalid category: "${selectedCategory}". Valid: ${VALID_CATEGORIES.join(", ")}`
    );
    process.exit(1);
  }

  if (count < 1 || count > 5) {
    console.error("Count must be between 1 and 5");
    process.exit(1);
  }

  try {
    if (contentType === "book") {
      // Book review pipeline
      const existingSlugs = getExistingBookSlugs();
      console.log(`Found ${existingSlugs.length} existing book review(s)`);

      const results = await runBookPipeline({
        category: selectedCategory,
        count,
        existingSlugs,
        dryRun,
      });

      console.log(`\nPipeline complete!`);
      console.log(`Generated ${results.length} book review(s):`);
      for (const r of results) {
        console.log(
          `  - "${r.review.frontmatter.title}" by ${r.review.frontmatter.author} (score: ${r.managerScore}/10, rating: ${r.review.frontmatter.rating}/5)`
        );
        if (r.qaIssues.length > 0) {
          console.log(
            `    QA: ${r.qaIssues.filter((i) => i.severity === "error").length} errors, ${r.qaIssues.filter((i) => i.severity === "warning").length} warnings`
          );
        }
        if (r.linkWarnings.length > 0) {
          console.log(`    Link issues: ${r.linkWarnings.join("; ")}`);
        }
      }
    } else {
      // Article pipeline (existing)
      const existingSlugs = getExistingSlugs();
      console.log(`Found ${existingSlugs.length} existing article(s)`);

      const results = await runPipeline({
        category: selectedCategory,
        count,
        existingSlugs,
        dryRun,
      });

      console.log(`\nPipeline complete!`);
      console.log(`Generated ${results.length} article(s):`);
      for (const r of results) {
        console.log(
          `  - ${r.article.frontmatter.title} (score: ${r.managerScore}/10, revisions: ${r.revisionCycles})`
        );
        if (r.qaIssues.length > 0) {
          console.log(
            `    QA: ${r.qaIssues.filter((i) => i.severity === "error").length} errors, ${r.qaIssues.filter((i) => i.severity === "warning").length} warnings`
          );
        }
        if (r.linkWarnings.length > 0) {
          console.log(`    Link issues: ${r.linkWarnings.join("; ")}`);
        }
        if (r.internalLinkSuggestions > 0) {
          console.log(
            `    Internal linking: ${r.internalLinkSuggestions} link suggestion(s)`
          );
        }
      }
    }
  } catch (error) {
    console.error("\nPipeline failed:", error);
    process.exit(1);
  }
}

main();
