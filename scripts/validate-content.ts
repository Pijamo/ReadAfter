import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const BOOKS_DIR = path.join(process.cwd(), "content", "books");

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
  const filePath = path.join(ARTICLES_DIR, filename);
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

function validateBook(filename: string): string[] {
  const errors: string[] = [];
  const filePath = path.join(BOOKS_DIR, filename);
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
  if (!data.author || typeof data.author !== "string") {
    errors.push("Missing or invalid 'author'");
  }
  if (!data.isbn || typeof data.isbn !== "string") {
    errors.push("Missing or invalid 'isbn'");
  } else {
    const isbn = data.isbn as string;
    if (isbn.length < 10 || isbn.length > 13) {
      errors.push(
        `Invalid 'isbn' length: ${isbn.length} (must be 10 or 13 characters)`
      );
    }
  }
  if (!data.category || !VALID_CATEGORIES.includes(data.category as string)) {
    errors.push(
      `Invalid 'category': "${data.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
  }
  if (typeof data.rating !== "number" || data.rating < 1 || data.rating > 5) {
    errors.push(
      `Invalid 'rating': ${data.rating}. Must be a number between 1.0 and 5.0`
    );
  }
  if (!data.summary || typeof data.summary !== "string") {
    errors.push("Missing or invalid 'summary'");
  }
  if (!data.amazonUrl || typeof data.amazonUrl !== "string") {
    errors.push("Missing or invalid 'amazonUrl'");
  } else if (!(data.amazonUrl as string).includes("amazon.in")) {
    errors.push("'amazonUrl' should contain 'amazon.in'");
  }
  if (!data.date || typeof data.date !== "string") {
    errors.push("Missing or invalid 'date'");
  }

  // Tags
  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    errors.push("Missing or empty 'tags' array");
  }

  // SEO
  if (data.seo && typeof data.seo === "object") {
    const seo = data.seo as Record<string, unknown>;
    if (!seo.focusKeyword) errors.push("seo: missing 'focusKeyword'");
    if (!seo.metaTitle) errors.push("seo: missing 'metaTitle'");
    if (!seo.metaDescription) errors.push("seo: missing 'metaDescription'");
  } else {
    errors.push("Missing 'seo' object");
  }

  // Content length check
  const { content } = matter(raw);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < 150) {
    errors.push(`Content too short: ${wordCount} words (minimum 150)`);
  }

  return errors;
}

function main() {
  let totalFiles = 0;
  const failures: ValidationError[] = [];

  // Validate articles
  if (fs.existsSync(ARTICLES_DIR)) {
    const articleFiles = fs
      .readdirSync(ARTICLES_DIR)
      .filter((f) => f.endsWith(".mdx"));

    if (articleFiles.length > 0) {
      console.log(`Validating ${articleFiles.length} article(s)...\n`);
      for (const file of articleFiles) {
        const errors = validateArticle(file);
        totalFiles++;
        if (errors.length > 0) {
          failures.push({ file: `articles/${file}`, errors });
          console.log(`FAIL  articles/${file}`);
          errors.forEach((e) => console.log(`       - ${e}`));
        } else {
          console.log(`OK    articles/${file}`);
        }
      }
    }
  }

  // Validate books
  if (fs.existsSync(BOOKS_DIR)) {
    const bookFiles = fs
      .readdirSync(BOOKS_DIR)
      .filter((f) => f.endsWith(".mdx"));

    if (bookFiles.length > 0) {
      console.log(`\nValidating ${bookFiles.length} book review(s)...\n`);
      for (const file of bookFiles) {
        const errors = validateBook(file);
        totalFiles++;
        if (errors.length > 0) {
          failures.push({ file: `books/${file}`, errors });
          console.log(`FAIL  books/${file}`);
          errors.forEach((e) => console.log(`       - ${e}`));
        } else {
          console.log(`OK    books/${file}`);
        }
      }
    }
  }

  if (totalFiles === 0) {
    console.log("No content files found. Skipping validation.");
    process.exit(0);
  }

  console.log(
    `\n${totalFiles} files checked, ${failures.length} failed.`
  );

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
