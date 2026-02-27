import { z } from "zod";

export const bookBriefSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  whyRecommend: z.string().min(10),
});

export const topicBriefSchema = z.object({
  suggestedTitle: z.string().min(10),
  slug: z.string().min(5),
  focusKeyword: z.string().min(3),
  secondaryKeywords: z.array(z.string()).min(1),
  category: z.string(),
  targetWordCount: z.number().min(800).max(3000),
  books: z.array(bookBriefSchema).min(3).max(10),
  outline: z.array(z.string()).min(3),
  searchIntent: z.string(),
});

export const seoOutputSchema = z.object({
  topics: z.array(topicBriefSchema).min(1),
});
