/**
 * Verify and correct ISBNs using the Open Library API.
 * LLMs frequently hallucinate ISBNs, so we verify every ISBN
 * before using it in the pipeline.
 */

interface OpenLibrarySearchResult {
  docs: Array<{
    title: string;
    author_name?: string[];
    isbn?: string[];
    cover_i?: number;
  }>;
}

interface ISBNVerification {
  originalIsbn: string;
  verifiedIsbn: string | null;
  coverAvailable: boolean;
  method: "original-valid" | "search-corrected" | "no-isbn-found";
}

/**
 * Check if an ISBN returns a valid cover (not a 1x1 placeholder) on Open Library.
 */
async function checkCoverExists(isbn: string): Promise<boolean> {
  try {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg?default=false`;
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    // Open Library returns 404 with ?default=false if no cover
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Verify an ISBN matches the expected book by checking Open Library's ISBN endpoint.
 */
async function verifyIsbnMatchesBook(
  isbn: string,
  expectedTitle: string
): Promise<boolean> {
  try {
    const url = `https://openlibrary.org/isbn/${isbn}.json`;
    const response = await fetch(url);
    if (!response.ok) return false;

    const data = (await response.json()) as { title?: string };
    if (!data.title) return false;

    // Fuzzy match: check if significant words overlap
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const expectedWords = normalize(expectedTitle);
    const actualWords = normalize(data.title);

    const matchCount = expectedWords.filter((w) =>
      actualWords.some((aw) => aw.includes(w) || w.includes(aw))
    ).length;

    // At least half the significant words should match
    return matchCount >= Math.max(1, Math.ceil(expectedWords.length / 2));
  } catch {
    return false;
  }
}

/**
 * Search Open Library for a book by title and author, return the best ISBN with a cover.
 */
async function searchForIsbn(
  title: string,
  author: string
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const url = `https://openlibrary.org/search.json?q=${query}&limit=5&fields=title,author_name,isbn,cover_i`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as OpenLibrarySearchResult;
    if (!data.docs || data.docs.length === 0) return null;

    // Find the best match that has a cover
    for (const doc of data.docs) {
      // Check title similarity
      const titleLower = title.toLowerCase();
      const docTitleLower = (doc.title || "").toLowerCase();
      if (
        !docTitleLower.includes(titleLower) &&
        !titleLower.includes(docTitleLower)
      ) {
        // Try word matching
        const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 2);
        const docWords = docTitleLower.split(/\s+/).filter((w) => w.length > 2);
        const overlap = titleWords.filter((w) => docWords.includes(w)).length;
        if (overlap < Math.max(1, Math.ceil(titleWords.length / 2))) {
          continue;
        }
      }

      // Has a cover on Open Library?
      if (!doc.cover_i) continue;

      // Try ISBNs from this doc — prefer ISBN-13
      if (doc.isbn && doc.isbn.length > 0) {
        // Sort: ISBN-13 first, then ISBN-10
        const sorted = [...doc.isbn].sort((a, b) => b.length - a.length);

        for (const isbn of sorted.slice(0, 5)) {
          const hasCover = await checkCoverExists(isbn);
          if (hasCover) {
            return isbn;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Verify an ISBN for a book. If the ISBN is wrong or has no cover,
 * search Open Library for the correct one.
 */
export async function verifyIsbn(
  isbn: string,
  title: string,
  author: string
): Promise<ISBNVerification> {
  console.log(`  [ISBN] Verifying ISBN ${isbn} for "${title}"...`);

  // Step 1: Check if the original ISBN matches the book and has a cover
  const [isbnMatches, hasCover] = await Promise.all([
    verifyIsbnMatchesBook(isbn, title),
    checkCoverExists(isbn),
  ]);

  if (isbnMatches && hasCover) {
    console.log(`  [ISBN] ✓ Original ISBN verified: ${isbn}`);
    return {
      originalIsbn: isbn,
      verifiedIsbn: isbn,
      coverAvailable: true,
      method: "original-valid",
    };
  }

  if (isbnMatches && !hasCover) {
    console.log(
      `  [ISBN] ISBN matches but no cover. Searching for edition with cover...`
    );
  } else {
    console.log(
      `  [ISBN] ✗ ISBN doesn't match "${title}". Searching for correct ISBN...`
    );
  }

  // Step 2: Search for the correct ISBN
  const correctedIsbn = await searchForIsbn(title, author);

  if (correctedIsbn) {
    console.log(`  [ISBN] ✓ Found correct ISBN: ${correctedIsbn}`);
    return {
      originalIsbn: isbn,
      verifiedIsbn: correctedIsbn,
      coverAvailable: true,
      method: "search-corrected",
    };
  }

  console.log(`  [ISBN] ✗ Could not find a valid ISBN with cover for "${title}"`);
  return {
    originalIsbn: isbn,
    verifiedIsbn: null,
    coverAvailable: false,
    method: "no-isbn-found",
  };
}

/**
 * Verify ISBNs for a batch of books. Returns a map of slug -> verified ISBN.
 */
export async function verifyBookIsbns(
  books: Array<{ slug: string; title: string; author: string; isbn: string }>
): Promise<Map<string, ISBNVerification>> {
  console.log(`\n[ISBN Verification] Checking ${books.length} book(s)...\n`);

  const results = new Map<string, ISBNVerification>();

  // Process sequentially to avoid rate-limiting Open Library
  for (const book of books) {
    const result = await verifyIsbn(book.isbn, book.title, book.author);
    results.set(book.slug, result);
  }

  const verified = [...results.values()].filter((r) => r.verifiedIsbn).length;
  const corrected = [...results.values()].filter(
    (r) => r.method === "search-corrected"
  ).length;
  const failed = [...results.values()].filter((r) => !r.verifiedIsbn).length;

  console.log(
    `\n[ISBN Verification] Done: ${verified} verified (${corrected} corrected), ${failed} failed\n`
  );

  return results;
}
