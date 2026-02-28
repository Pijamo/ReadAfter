import { z } from "zod";

export const bookReviewBriefSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().min(10).max(13),
  slug: z.string().min(3),
  category: z.string(),
  focusKeyword: z.string().min(3),
  secondaryKeywords: z.array(z.string()).min(1),
  targetWordCount: z.number().min(400).max(1000),
  angle: z.string().min(10),
  searchIntent: z.string(),
});

export const bookSeoOutputSchema = z.object({
  books: z.array(bookReviewBriefSchema).min(1),
});
