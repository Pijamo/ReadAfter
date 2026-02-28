/**
 * Lightweight link checker for admin API routes.
 * Checks Amazon URLs and Open Library cover images via HTTP requests.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface LinkCheckResult {
  slug: string;
  title: string;
  type: "book" | "article";
  amazonUrl: { url: string; status: number | null; ok: boolean; error?: string };
  coverImage: { url: string; isbn: string; ok: boolean; error?: string };
  internalLinks: { slug: string; exists: boolean }[];
  checkedAt: string;
}

export interface LinkCheckReport {
  checkedAt: string;
  totalChecked: number;
  brokenAmazonLinks: number;
  brokenCoverImages: number;
  missingInternalLinks: number;
  results: LinkCheckResult[];
}

async function checkUrl(url: string): Promise<{ status: number | null; ok: boolean; error?: string }> {
  if (!url || url.includes("PLACEHOLDER")) {
    return { status: null, ok: false, error: "Placeholder URL" };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ReadAfter/1.0)" },
    });
    clearTimeout(timeout);
    return { status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (err) {
    return { status: null, ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

async function checkCover(isbn: string): Promise<{ url: string; isbn: string; ok: boolean; error?: string }> {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  if (!isbn) return { url: "", isbn, ok: false, error: "No ISBN" };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    return { url, isbn, ok: res.ok };
  } catch (err) {
    return { url, isbn, ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function runLinkCheck(contentRoot: string): Promise<LinkCheckReport> {
  const booksDir = path.join(contentRoot, "books");
  const results: LinkCheckResult[] = [];

  if (!fs.existsSync(booksDir)) {
    return { checkedAt: new Date().toISOString(), totalChecked: 0, brokenAmazonLinks: 0, brokenCoverImages: 0, missingInternalLinks: 0, results: [] };
  }

  const files = fs.readdirSync(booksDir).filter((f) => f.endsWith(".mdx"));
  const allSlugs = new Set(files.map((f) => f.replace(/\.mdx$/, "")));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(booksDir, file), "utf-8");
    const { data } = matter(raw);
    const slug = file.replace(/\.mdx$/, "");

    const [amazonResult, coverResult] = await Promise.all([
      checkUrl(data.amazonUrl || ""),
      checkCover(data.isbn || ""),
    ]);

    const relatedBooks = (data.relatedBooks as string[]) || [];
    const internalLinks = relatedBooks.map((s) => ({ slug: s, exists: allSlugs.has(s) }));

    results.push({
      slug,
      title: data.title || slug,
      type: "book",
      amazonUrl: { url: data.amazonUrl || "", ...amazonResult },
      coverImage: coverResult,
      internalLinks,
      checkedAt: new Date().toISOString(),
    });

    // Small delay to avoid rate-limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  return {
    checkedAt: new Date().toISOString(),
    totalChecked: results.length,
    brokenAmazonLinks: results.filter((r) => !r.amazonUrl.ok).length,
    brokenCoverImages: results.filter((r) => !r.coverImage.ok).length,
    missingInternalLinks: results.reduce((sum, r) => sum + r.internalLinks.filter((l) => !l.exists).length, 0),
    results,
  };
}
