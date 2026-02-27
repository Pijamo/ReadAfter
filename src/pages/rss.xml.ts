import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const books = await getCollection('books');
  const blog = await getCollection('blog');

  const bookItems = books.map((book) => ({
    title: `${book.data.title} by ${book.data.author}`,
    description: `New book recommendation: ${book.data.title} by ${book.data.author}. ${book.data.genres.join(', ')}.`,
    link: `/books/${book.id}/`,
    pubDate: new Date(book.data.dateAdded),
  }));

  const blogItems = blog.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    link: `/blog/${post.id}/`,
    pubDate: new Date(post.data.publishDate),
  }));

  const allItems = [...bookItems, ...blogItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
  );

  return rss({
    title: 'ReadAfter - Book Recommendations for India',
    description: 'Curated book recommendations for Indian readers. New books and reading lists updated weekly.',
    site: context.site!,
    items: allItems.slice(0, 50),
  });
}
