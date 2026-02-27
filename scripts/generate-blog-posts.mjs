/**
 * Auto-generate blog posts from book data.
 *
 * Usage:
 *   node scripts/generate-blog-posts.mjs
 *
 * Generates curated list posts based on book categories.
 */

import fs from 'fs';
import path from 'path';

const BOOKS_DIR = path.resolve('src/content/books');
const BLOG_DIR = path.resolve('src/content/blog');
const DATA_FILE = path.resolve('src/data/books.json');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function loadBooks() {
  // Try JSON data file first, then scan markdown files
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }

  // Fallback: parse frontmatter from markdown files
  const files = fs.readdirSync(BOOKS_DIR).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(BOOKS_DIR, file), 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const parseField = (name) => {
      const m = frontmatter.match(new RegExp(`^${name}:\\s*"?(.+?)"?$`, 'm'));
      return m ? m[1] : '';
    };
    const parseArray = (name) => {
      const lines = frontmatter.split('\n');
      const idx = lines.findIndex((l) => l.startsWith(`${name}:`));
      if (idx === -1) return [];
      const items = [];
      for (let i = idx + 1; i < lines.length; i++) {
        const m = lines[i].match(/^\s+-\s+"?(.+?)"?$/);
        if (m) items.push(m[1]);
        else break;
      }
      return items;
    };

    return {
      slug: file.replace('.md', ''),
      title: parseField('title'),
      author: parseField('author'),
      genres: parseArray('genres'),
      rating: parseFloat(parseField('rating')) || 4.0,
      amazonUrl: parseField('amazonUrl'),
      tags: parseArray('tags'),
    };
  }).filter(Boolean);
}

function generateCategoryPost(genre, books, year) {
  const displayGenre = genre.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const title = `Best ${displayGenre} Books to Read in ${year}`;
  const slug = slugify(title);
  const sortedBooks = [...books].sort((a, b) => b.rating - a.rating).slice(0, 10);

  const bookList = sortedBooks
    .map((b, i) => `### ${i + 1}. ${b.title} by ${b.author}

**Rating:** ${'★'.repeat(Math.round(b.rating))}${'☆'.repeat(5 - Math.round(b.rating))} (${b.rating}/5)

A highly recommended ${displayGenre.toLowerCase()} book that Indian readers love. [Read our full review](/books/${b.slug}/) or [buy on Amazon](${b.amazonUrl}).

---`)
    .join('\n\n');

  return {
    slug,
    content: `---
title: "${title}"
description: "Our curated list of the best ${displayGenre.toLowerCase()} books recommended for Indian readers in ${year}. Find reviews and the best prices."
publishDate: "${year}-01-15"
tags:
  - "${genre}"
  - "best-books"
  - "${year}"
featured: true
---

Looking for the best ${displayGenre.toLowerCase()} books to read? We've curated this list of top-rated books that Indian readers love. Each book has been selected based on reader ratings, critical acclaim, and relevance to readers in India.

Whether you're looking for your next weekend read or building a reading list for the year, these ${displayGenre.toLowerCase()} books are a great place to start.

${bookList}

## How We Pick Our Recommendations

Our recommendations are based on a combination of reader ratings from major platforms, critical reviews, and feedback from the Indian reading community. We update this list regularly to include new releases and timeless classics.

All books listed here are available for purchase on Amazon India and Flipkart at competitive prices. Click through to find the best deal available today.
`,
  };
}

function generateNewReleasesPost(books, year, month) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1];
  const title = `New Book Recommendations - ${monthName} ${year}`;
  const slug = slugify(title);

  const recentBooks = books.slice(0, 10);
  const bookList = recentBooks
    .map((b, i) => `### ${i + 1}. ${b.title} by ${b.author}

**Genre:** ${b.genres?.join(', ') || 'General'} | **Rating:** ${b.rating}/5

[Read our full review](/books/${b.slug}/) | [Buy on Amazon](${b.amazonUrl})

---`)
    .join('\n\n');

  return {
    slug,
    content: `---
title: "${title}"
description: "Check out our latest book recommendations for ${monthName} ${year}. New additions across fiction, non-fiction, self-help, and more."
publishDate: "${year}-${String(month).padStart(2, '0')}-01"
tags:
  - "new-releases"
  - "monthly-picks"
  - "${year}"
featured: false
---

Here are our top book picks added to ReadAfter this month. From fiction to self-help to business, there's something for every reader.

${bookList}

## Stay Updated

We add new book recommendations every week. Subscribe to our [RSS feed](/rss.xml) to stay updated with the latest additions.
`,
  };
}

function generateIndianAuthorsPost(books, year) {
  const title = `Top Books by Indian Authors You Must Read in ${year}`;
  const slug = slugify(title);

  const indianBooks = books.filter((b) =>
    b.tags?.includes('indian-authors') || b.genres?.includes('mythology')
  ).slice(0, 10);

  const bookList = indianBooks
    .map((b, i) => `### ${i + 1}. ${b.title} by ${b.author}

**Rating:** ${b.rating}/5

A must-read from one of India's finest authors. [Read our full review](/books/${b.slug}/) or [buy on Amazon](${b.amazonUrl}).

---`)
    .join('\n\n');

  return {
    slug,
    content: `---
title: "${title}"
description: "Discover the best books by Indian authors in ${year}. From mythology to contemporary fiction, these Indian writers will captivate you."
publishDate: "${year}-02-01"
tags:
  - "indian-authors"
  - "must-read"
  - "${year}"
featured: true
---

India has a rich literary tradition, and contemporary Indian authors continue to produce world-class literature. Here are the best books by Indian authors that every reader in India should have on their bookshelf.

From Amish Tripathi's mythological epics to Arundhati Roy's literary masterpieces, these books showcase the best of Indian writing.

${bookList}

## The Rise of Indian Literature

Indian authors have gained global recognition in recent decades. Whether writing in English or translating from regional languages, Indian writers bring unique perspectives that resonate deeply with readers both in India and worldwide.

We regularly update this list with new releases from Indian authors. Check back often for the latest additions.
`,
  };
}

async function main() {
  fs.mkdirSync(BLOG_DIR, { recursive: true });

  const books = loadBooks();
  if (books.length === 0) {
    console.log('No books found. Run fetch-books.mjs first.');
    return;
  }

  console.log(`Loaded ${books.length} books.`);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const posts = [];

  // Generate category posts
  const genreGroups = {};
  for (const book of books) {
    for (const genre of (book.genres || [])) {
      if (!genreGroups[genre]) genreGroups[genre] = [];
      genreGroups[genre].push(book);
    }
  }

  for (const [genre, genreBooks] of Object.entries(genreGroups)) {
    if (genreBooks.length >= 3) {
      posts.push(generateCategoryPost(genre, genreBooks, year));
    }
  }

  // Generate monthly new releases post
  posts.push(generateNewReleasesPost(books, year, month));

  // Generate Indian authors post
  posts.push(generateIndianAuthorsPost(books, year));

  // Write posts
  let created = 0;
  for (const post of posts) {
    const filePath = path.join(BLOG_DIR, `${post.slug}.md`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, post.content);
      console.log(`Created: ${post.slug}.md`);
      created++;
    } else {
      console.log(`Exists: ${post.slug}.md`);
    }
  }

  console.log(`\nDone. Created ${created} new blog posts.`);
}

main().catch(console.error);
