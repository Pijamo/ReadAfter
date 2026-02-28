#!/usr/bin/env npx tsx
/**
 * Standalone CLI for checking broken links and images across all content.
 *
 * Usage:
 *   npx tsx agents/src/check-links.ts
 *
 * Outputs a JSON report to agents/output/link-check-report.json
 */

import path from "path";
import fs from "fs";
import { checkAllLinks } from "./utils/link-checker.js";

async function main() {
  const contentRoot = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "content"
  );

  console.log(`\n========================================`);
  console.log(`ReadAfter Link Checker`);
  console.log(`Content directory: ${contentRoot}`);
  console.log(`========================================\n`);

  const report = await checkAllLinks(contentRoot);

  // Write report
  const outputDir = path.resolve(import.meta.dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, "link-check-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Report saved to: ${reportPath}`);

  // Exit with error code if any broken links found
  const hasIssues =
    report.brokenAmazonLinks > 0 ||
    report.brokenCoverImages > 0 ||
    report.missingInternalLinks > 0;

  if (hasIssues) {
    console.log(
      `\n⚠️  Found issues — review the report for details.\n`
    );
    process.exit(1);
  } else {
    console.log(`\n✅ All links and images are healthy!\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Link checker failed:", err);
  process.exit(1);
});
