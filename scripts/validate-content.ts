import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

const VALID_CATEGORIES = [
  "entrepreneurship",
  "productivity",
  "personal-finance",
  "leadership",
  "self-help",
  "career-growth",
];

interface ValidationError {
  file: string;
  errors: string[];
}

function validateArticle(filename: string): string[] {
  const errors: string[] = [];
  const filePath = path.join(CONTENT_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");

  let data: Record<string, unknown>;
  try {
    const parsed = matter(raw);
    data = parsed.data;
  } catch {
    return [`Failed to parse frontmatter`];
  }

  // Required fields
  if (!data.title || typeof data.title !== "string") {
    errors.push("Missing or invalid 'title'");
  }
  if (!data.description || typeof data.description !== "string") {
    errors.push("Missing or invalid 'description'");
  }
  if (!data.date || typeof data.date !== "string") {
    errors.push("Missing or invalid 'date'");
  }
  if (!data.category || !VALID_CATEGORIES.includes(data.category as string)) {
    errors.push(
      `Invalid 'category': "${data.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  // Books array
  if (!Array.isArray(data.books) || data.books.length === 0) {
    errors.push("Missing or empty 'books' array");
  } else {
    for (let i = 0; i < data.books.length; i++) {
      const book = data.books[i] as Record<string, unknown>;
      if (!book.title) errors.push(`books[${i}]: missing 'title'`);
      if (!book.author) errors.push(`books[${i}]: missing 'author'`);
      if (!book.amazonUrl) errors.push(`books[${i}]: missing 'amazonUrl'`);
    }
  }

  // Content length check
  const { content } = matter(raw);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < 200) {
    errors.push(`Content too short: ${wordCount} words (minimum 200)`);
  }

  return errors;
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("No content directory found. Skipping validation.");
    process.exit(0);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  if (files.length === 0) {
    console.log("No MDX files found. Skipping validation.");
    process.exit(0);
  }

  console.log(`Validating ${files.length} article(s)...\n`);

  const failures: ValidationError[] = [];

  for (const file of files) {
    const errors = validateArticle(file);
    if (errors.length > 0) {
      failures.push({ file, errors });
      console.log(`FAIL  ${file}`);
      errors.forEach((e) => console.log(`       - ${e}`));
    } else {
      console.log(`OK    ${file}`);
    }
  }

  console.log(`\n${files.length} files checked, ${failures.length} failed.`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
