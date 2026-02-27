import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT_DIR, "..", "content", "articles");
const OUTPUT_DIR = path.join(ROOT_DIR, "output");

export function saveIntermediate(
  stage: string,
  slug: string,
  data: unknown
): void {
  const dir = path.join(OUTPUT_DIR, stage);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  [save] ${stage}/${slug}.json`);
}

export function writeMdxFile(slug: string, mdxContent: string): void {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  fs.writeFileSync(filePath, mdxContent);
  console.log(`  [write] content/articles/${slug}.mdx`);
}

export function getExistingSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
