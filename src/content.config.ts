import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    author: z.string(),
    coverImage: z.string(),
    isbn: z.string().optional(),
    publisher: z.string().optional(),
    publishedDate: z.string().optional(),
    pages: z.number().optional(),
    language: z.string().default('en'),
    genres: z.array(z.string()),
    rating: z.number().min(0).max(5),
    ratingsCount: z.number().optional(),
    priceINR: z.number().optional(),
    amazonUrl: z.string(),
    flipkartUrl: z.string().optional(),
    featured: z.boolean().default(false),
    dateAdded: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    updatedDate: z.string().optional(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { books, blog };
