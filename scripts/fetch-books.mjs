/**
 * Fetch books from Google Books API and generate markdown files.
 *
 * Usage:
 *   node scripts/fetch-books.mjs
 *
 * Set GOOGLE_BOOKS_API_KEY in .env for higher rate limits (optional — works without it).
 */

import fs from 'fs';
import path from 'path';

const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG || 'readafter-21';
const FLIPKART_ID = process.env.FLIPKART_AFFILIATE_ID || 'readafter';
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || '';
const BOOKS_DIR = path.resolve('src/content/books');
const DATA_FILE = path.resolve('src/data/books.json');

const CATEGORIES = [
  { query: 'subject:fiction indian authors', genre: 'fiction', tag: 'indian-authors' },
  { query: 'subject:self-help bestsellers', genre: 'self-help', tag: 'bestseller' },
  { query: 'subject:business entrepreneurship', genre: 'business', tag: 'business' },
  { query: 'subject:technology programming', genre: 'technology', tag: 'technology' },
  { query: 'indian mythology hindu', genre: 'mythology', tag: 'indian-authors' },
  { query: 'subject:science popular science', genre: 'non-fiction', tag: 'science' },
  { query: 'UPSC preparation books India', genre: 'exam-prep', tag: 'exam-prep' },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function buildAmazonUrl(title, isbn) {
  const searchTerm = isbn || title;
  return `https://www.amazon.in/s?k=${encodeURIComponent(searchTerm)}&tag=${AMAZON_TAG}`;
}

function buildFlipkartUrl(title) {
  return `https://www.flipkart.com/search?q=${encodeURIComponent(title)}&affid=${FLIPKART_ID}`;
}

async function fetchBooksForCategory(category) {
  const params = new URLSearchParams({
    q: category.query,
    maxResults: '10',
    orderBy: 'relevance',
    langRestrict: 'en',
    printType: 'books',
  });
  if (API_KEY) params.set('key', API_KEY);

  const url = `https://www.googleapis.com/books/v1/volumes?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch for "${category.query}": ${res.status}`);
    return [];
  }

  const data = await res.json();
  if (!data.items) return [];

  return data.items
    .filter((item) => {
      const info = item.volumeInfo;
      return info.title && info.authors?.length && info.imageLinks?.thumbnail;
    })
    .map((item) => {
      const info = item.volumeInfo;
      const isbn = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier
        || info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier
        || '';

      return {
        slug: slugify(info.title),
        title: info.title,
        subtitle: info.subtitle || '',
        author: info.authors.join(', '),
        coverImage: info.imageLinks.thumbnail.replace('http://', 'https://'),
        isbn,
        publisher: info.publisher || '',
        publishedDate: info.publishedDate || '',
        pages: info.pageCount || 0,
        language: info.language || 'en',
        genres: [category.genre],
        rating: info.averageRating || 4.0,
        ratingsCount: info.ratingsCount || 0,
        amazonUrl: buildAmazonUrl(info.title, isbn),
        flipkartUrl: buildFlipkartUrl(info.title),
        featured: false,
        dateAdded: new Date().toISOString().split('T')[0],
        tags: [category.tag],
        description: info.description || `${info.title} by ${info.authors.join(', ')}.`,
      };
    });
}

function bookToMarkdown(book) {
  const frontmatter = {
    title: book.title,
    ...(book.subtitle && { subtitle: book.subtitle }),
    author: book.author,
    coverImage: book.coverImage,
    ...(book.isbn && { isbn: book.isbn }),
    ...(book.publisher && { publisher: book.publisher }),
    ...(book.publishedDate && { publishedDate: book.publishedDate }),
    ...(book.pages && { pages: book.pages }),
    language: book.language,
    genres: book.genres,
    rating: book.rating,
    ...(book.ratingsCount && { ratingsCount: book.ratingsCount }),
    amazonUrl: book.amazonUrl,
    flipkartUrl: book.flipkartUrl,
    featured: book.featured,
    dateAdded: book.dateAdded,
    tags: book.tags,
  };

  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map((v) => `  - "${v}"`).join('\n')}`;
      }
      if (typeof value === 'string') return `${key}: "${value}"`;
      return `${key}: ${value}`;
    })
    .join('\n');

  const desc = book.description.slice(0, 500);

  return `---
${yaml}
---

${desc}

## Why Indian Readers Love This Book

${book.title} by ${book.author} continues to be one of the most recommended books in the ${book.genres[0]} category among Indian readers. Whether you're a student, professional, or avid reader, this book offers valuable insights that resonate with readers across India.

## Who Should Read This

- Readers interested in ${book.genres[0]}
- Anyone looking for a highly-rated book recommendation
- Book lovers in India looking for their next great read
`;
}

async function main() {
  // Ensure directories exist
  fs.mkdirSync(BOOKS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

  // Load existing books
  let existingBooks = [];
  if (fs.existsSync(DATA_FILE)) {
    existingBooks = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  const existingSlugs = new Set(existingBooks.map((b) => b.slug));

  console.log(`Found ${existingBooks.length} existing books.`);

  let newBooks = [];

  for (const category of CATEGORIES) {
    console.log(`Fetching: ${category.query}...`);
    const books = await fetchBooksForCategory(category);
    console.log(`  Got ${books.length} books.`);

    for (const book of books) {
      if (existingSlugs.has(book.slug)) {
        console.log(`  Skipping duplicate: ${book.title}`);
        continue;
      }
      existingSlugs.add(book.slug);
      newBooks.push(book);
    }

    // Rate limit courtesy
    await new Promise((r) => setTimeout(r, 500));
  }

  // Mark first 6 as featured
  newBooks.slice(0, 6).forEach((b) => (b.featured = true));

  // Write markdown files
  for (const book of newBooks) {
    const filePath = path.join(BOOKS_DIR, `${book.slug}.md`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, bookToMarkdown(book));
      console.log(`Created: ${book.slug}.md`);
    }
  }

  // Update master JSON
  const allBooks = [...existingBooks, ...newBooks];
  fs.writeFileSync(DATA_FILE, JSON.stringify(allBooks, null, 2));
  console.log(`\nTotal books: ${allBooks.length} (${newBooks.length} new)`);
}

main().catch(console.error);
