import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BookFrontmatter, BookMeta, Category } from "@/types/content";

const BOOKS_DIR = path.join(process.cwd(), "content", "books");

/** Extract ASIN from an Amazon URL like /dp/B08N5WRWNW?tag=... */
function extractAsin(url: string): string {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/i);
  return match ? match[1] : "";
}

function parseBookFrontmatter(fileContent: string): BookFrontmatter {
  const { data } = matter(fileContent);

  return {
    title: data.title,
    author: data.author,
    isbn: data.isbn || "",
    category: data.category,
    rating: data.rating,
    summary: data.summary || "",
    amazonUrl: data.amazonUrl || "",
    amazonPrice: data.amazonPrice ?? null,
    asin: data.asin || extractAsin(data.amazonUrl || ""),
    coverImage: data.coverImage || "",
    tags: data.tags || [],
    date: data.date,
    featured: data.featured || false,
    relatedBooks: data.relatedBooks || [],
    seo: data.seo || {
      focusKeyword: "",
      metaTitle: data.title,
      metaDescription: data.summary || "",
    },
  };
}

export function getAllBooks(): BookMeta[] {
  if (!fs.existsSync(BOOKS_DIR)) return [];

  const files = fs.readdirSync(BOOKS_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const filePath = path.join(BOOKS_DIR, filename);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const frontmatter = parseBookFrontmatter(fileContent);
      return { slug, frontmatter };
    })
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    );
}

export function getBooksByCategory(category: Category): BookMeta[] {
  return getAllBooks().filter((b) => b.frontmatter.category === category);
}

export function getFeaturedBooks(limit = 8): BookMeta[] {
  const featured = getAllBooks().filter((b) => b.frontmatter.featured);
  return featured.length > 0
    ? featured.slice(0, limit)
    : getAllBooks().slice(0, limit);
}

export function getBookBySlug(slug: string): BookMeta | null {
  const filePath = path.join(BOOKS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const frontmatter = parseBookFrontmatter(fileContent);
  return { slug, frontmatter };
}

export function getBookRawContent(slug: string): string | null {
  const filePath = path.join(BOOKS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function getBookBody(slug: string): string | null {
  const raw = getBookRawContent(slug);
  if (!raw) return null;
  const { content } = matter(raw);
  return content;
}

export function getAllBookSlugs(): string[] {
  return getAllBooks().map((b) => b.slug);
}

export function getBookCoverUrl(
  isbn: string,
  size: "S" | "M" | "L" = "L"
): string {
  if (!isbn) return "";
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`;
}

export function getRelatedBooks(book: BookMeta, limit = 4): BookMeta[] {
  const all = getAllBooks();

  // First try explicit relatedBooks slugs
  if (book.frontmatter.relatedBooks && book.frontmatter.relatedBooks.length > 0) {
    const related = book.frontmatter.relatedBooks
      .map((slug) => all.find((b) => b.slug === slug))
      .filter(Boolean) as BookMeta[];
    if (related.length >= limit) return related.slice(0, limit);
    // Pad with same-category books if not enough explicit ones
    const remaining = all.filter(
      (b) =>
        b.slug !== book.slug &&
        !related.some((r) => r.slug === b.slug) &&
        b.frontmatter.category === book.frontmatter.category
    );
    return [...related, ...remaining].slice(0, limit);
  }

  // Fallback: same category, excluding self
  return all
    .filter(
      (b) =>
        b.slug !== book.slug &&
        b.frontmatter.category === book.frontmatter.category
    )
    .slice(0, limit);
}
