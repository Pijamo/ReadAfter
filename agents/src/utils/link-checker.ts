/**
 * Check broken links and images across all content.
 * Makes real HTTP requests to verify Amazon affiliate links
 * and Open Library book cover images are accessible.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ---------- Types ----------

export interface LinkCheckResult {
  slug: string;
  title: string;
  type: "book" | "article";
  amazonUrl: UrlCheckResult;
  coverImage: CoverCheckResult;
  internalLinks: InternalLinkCheck[];
  checkedAt: string;
}

export interface UrlCheckResult {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
}

export interface CoverCheckResult {
  url: string;
  isbn: string;
  ok: boolean;
  error?: string;
}

export interface InternalLinkCheck {
  slug: string;
  exists: boolean;
}

export interface LinkCheckReport {
  checkedAt: string;
  totalChecked: number;
  brokenAmazonLinks: number;
  brokenCoverImages: number;
  missingInternalLinks: number;
  results: LinkCheckResult[];
}

// ---------- HTTP checkers ----------

/**
 * Check if an Amazon affiliate URL returns a valid response.
 * Uses GET with redirect follow — Amazon returns 200 even for product pages
 * that redirect, so we check for the final response status.
 */
async function checkAmazonUrl(url: string): Promise<UrlCheckResult> {
  if (!url || url.includes("PLACEHOLDER")) {
    return { url, status: null, ok: false, error: "Placeholder URL" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ReadAfter LinkChecker/1.0)",
      },
    });

    clearTimeout(timeout);

    // Amazon returns 200 for valid products, 404 for invalid
    // Some products redirect to search — status is still 200 but that's OK
    const ok = response.status >= 200 && response.status < 400;
    return { url, status: response.status, ok };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { url, status: null, ok: false, error: message };
  }
}

/**
 * Check if an Open Library cover image is available.
 * Uses HEAD request with ?default=false to detect missing covers.
 */
async function checkCoverImage(isbn: string): Promise<CoverCheckResult> {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

  if (!isbn) {
    return { url: "", isbn, ok: false, error: "No ISBN provided" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return { url, isbn, ok: response.ok };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { url, isbn, ok: false, error: message };
  }
}

/**
 * Check if internal link slugs exist as actual content files.
 */
function checkInternalLinks(
  relatedSlugs: string[],
  allBookSlugs: Set<string>,
  allArticleSlugs: Set<string>
): InternalLinkCheck[] {
  return relatedSlugs.map((slug) => ({
    slug,
    exists: allBookSlugs.has(slug) || allArticleSlugs.has(slug),
  }));
}

// ---------- Content loading ----------

interface BookContent {
  slug: string;
  title: string;
  isbn: string;
  amazonUrl: string;
  relatedBooks: string[];
}

interface ArticleBook {
  title: string;
  amazonUrl: string;
}

interface ArticleContent {
  slug: string;
  title: string;
  books: ArticleBook[];
}

function loadBookContent(booksDir: string): BookContent[] {
  if (!fs.existsSync(booksDir)) return [];

  return fs
    .readdirSync(booksDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(booksDir, f), "utf-8");
      const { data } = matter(raw);
      return {
        slug: f.replace(/\.mdx$/, ""),
        title: (data.title as string) || f,
        isbn: (data.isbn as string) || "",
        amazonUrl: (data.amazonUrl as string) || "",
        relatedBooks: (data.relatedBooks as string[]) || [],
      };
    });
}

function loadArticleContent(articlesDir: string): ArticleContent[] {
  if (!fs.existsSync(articlesDir)) return [];

  return fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(articlesDir, f), "utf-8");
      const { data } = matter(raw);
      return {
        slug: f.replace(/\.mdx$/, ""),
        title: (data.title as string) || f,
        books: ((data.books as ArticleBook[]) || []).map((b) => ({
          title: b.title || "",
          amazonUrl: b.amazonUrl || "",
        })),
      };
    });
}

// ---------- Main checker ----------

/**
 * Check all content for broken links and images.
 * Processes sequentially to avoid rate-limiting.
 */
export async function checkAllLinks(
  contentRoot: string
): Promise<LinkCheckReport> {
  const booksDir = path.join(contentRoot, "books");
  const articlesDir = path.join(contentRoot, "articles");

  const books = loadBookContent(booksDir);
  const articles = loadArticleContent(articlesDir);

  const allBookSlugs = new Set(books.map((b) => b.slug));
  const allArticleSlugs = new Set(articles.map((a) => a.slug));

  const results: LinkCheckResult[] = [];

  console.log(
    `\n[Link Checker] Checking ${books.length} book(s) and ${articles.length} article(s)...\n`
  );

  // Check books
  for (const book of books) {
    console.log(`  Checking book: "${book.title}"...`);

    const [amazonResult, coverResult] = await Promise.all([
      checkAmazonUrl(book.amazonUrl),
      checkCoverImage(book.isbn),
    ]);

    const internalLinks = checkInternalLinks(
      book.relatedBooks,
      allBookSlugs,
      allArticleSlugs
    );

    const result: LinkCheckResult = {
      slug: book.slug,
      title: book.title,
      type: "book",
      amazonUrl: amazonResult,
      coverImage: coverResult,
      internalLinks,
      checkedAt: new Date().toISOString(),
    };

    // Log issues
    if (!amazonResult.ok) {
      console.log(
        `    ❌ Amazon link broken: ${amazonResult.error || `status ${amazonResult.status}`}`
      );
    }
    if (!coverResult.ok) {
      console.log(
        `    ❌ Cover image missing: ${coverResult.error || "not found on Open Library"}`
      );
    }
    const missingInternal = internalLinks.filter((l) => !l.exists);
    if (missingInternal.length > 0) {
      console.log(
        `    ⚠️  Missing internal links: ${missingInternal.map((l) => l.slug).join(", ")}`
      );
    }
    if (amazonResult.ok && coverResult.ok && missingInternal.length === 0) {
      console.log(`    ✅ All links OK`);
    }

    results.push(result);

    // Small delay between books to avoid rate-limiting
    await sleep(500);
  }

  // Check articles (each article has multiple books)
  for (const article of articles) {
    console.log(`  Checking article: "${article.title}"...`);

    let hasIssues = false;

    for (const book of article.books) {
      const amazonResult = await checkAmazonUrl(book.amazonUrl);

      if (!amazonResult.ok) {
        console.log(
          `    ❌ "${book.title}" Amazon link broken: ${amazonResult.error || `status ${amazonResult.status}`}`
        );
        hasIssues = true;
      }

      await sleep(300);
    }

    // Articles don't have ISBN covers or relatedBooks, so simpler check
    const firstBook = article.books[0];
    const articleResult: LinkCheckResult = {
      slug: article.slug,
      title: article.title,
      type: "article",
      amazonUrl: firstBook
        ? await checkAmazonUrl(firstBook.amazonUrl)
        : { url: "", status: null, ok: true },
      coverImage: { url: "", isbn: "", ok: true }, // Articles don't have ISBN covers
      internalLinks: [],
      checkedAt: new Date().toISOString(),
    };

    if (!hasIssues) {
      console.log(`    ✅ All links OK`);
    }

    results.push(articleResult);
  }

  // Summary
  const brokenAmazonLinks = results.filter((r) => !r.amazonUrl.ok).length;
  const brokenCoverImages = results.filter(
    (r) => r.type === "book" && !r.coverImage.ok
  ).length;
  const missingInternalLinks = results.reduce(
    (sum, r) => sum + r.internalLinks.filter((l) => !l.exists).length,
    0
  );

  const report: LinkCheckReport = {
    checkedAt: new Date().toISOString(),
    totalChecked: results.length,
    brokenAmazonLinks,
    brokenCoverImages,
    missingInternalLinks,
    results,
  };

  console.log(`\n[Link Checker] Summary:`);
  console.log(`  Total checked: ${results.length}`);
  console.log(`  Broken Amazon links: ${brokenAmazonLinks}`);
  console.log(`  Broken cover images: ${brokenCoverImages}`);
  console.log(`  Missing internal links: ${missingInternalLinks}`);
  console.log();

  return report;
}

/**
 * Check links for a single book review (used in pipeline).
 */
export async function checkBookLinks(book: {
  slug: string;
  title: string;
  isbn: string;
  amazonUrl: string;
  relatedBooks: string[];
  allBookSlugs: Set<string>;
  allArticleSlugs: Set<string>;
}): Promise<LinkCheckResult> {
  const [amazonResult, coverResult] = await Promise.all([
    checkAmazonUrl(book.amazonUrl),
    checkCoverImage(book.isbn),
  ]);

  const internalLinks = checkInternalLinks(
    book.relatedBooks,
    book.allBookSlugs,
    book.allArticleSlugs
  );

  return {
    slug: book.slug,
    title: book.title,
    type: "book",
    amazonUrl: amazonResult,
    coverImage: coverResult,
    internalLinks,
    checkedAt: new Date().toISOString(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
