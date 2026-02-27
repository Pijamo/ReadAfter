import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { ArticleFrontmatter, ArticleMeta, Category } from "@/types/content";

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

function parseFrontmatter(slug: string, fileContent: string): ArticleFrontmatter {
  const { data } = matter(fileContent);
  const { content } = matter(fileContent);
  const stats = readingTime(content);

  return {
    title: data.title,
    description: data.description,
    date: data.date,
    category: data.category,
    tags: data.tags || [],
    readingTime: Math.ceil(stats.minutes),
    featured: data.featured || false,
    books: data.books || [],
    seo: data.seo || {
      focusKeyword: "",
      metaTitle: data.title,
      metaDescription: data.description,
    },
  };
}

export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  const articles = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const filePath = path.join(CONTENT_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const frontmatter = parseFrontmatter(slug, fileContent);
    return { slug, frontmatter };
  });

  return articles.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export function getArticlesByCategory(category: Category): ArticleMeta[] {
  return getAllArticles().filter((a) => a.frontmatter.category === category);
}

export function getFeaturedArticles(limit = 3): ArticleMeta[] {
  const featured = getAllArticles().filter((a) => a.frontmatter.featured);
  return featured.length > 0 ? featured.slice(0, limit) : getAllArticles().slice(0, limit);
}

export function getArticleRawContent(slug: string): string | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function getArticleFrontmatter(slug: string): ArticleFrontmatter | null {
  const raw = getArticleRawContent(slug);
  if (!raw) return null;
  return parseFrontmatter(slug, raw);
}

export function getArticleBody(slug: string): string | null {
  const raw = getArticleRawContent(slug);
  if (!raw) return null;
  const { content } = matter(raw);
  return content;
}

export function getAllSlugs(): string[] {
  return getAllArticles().map((a) => a.slug);
}
