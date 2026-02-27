import { z } from "zod";

export const freshnessOutputSchema = z.object({
  needsUpdate: z.boolean(),
  urgency: z.enum(["low", "medium", "high"]),
  updates: z.array(
    z.object({
      type: z.enum(["title", "content", "books", "prices", "seo"]),
      description: z.string(),
      currentContent: z.string(),
      suggestedChange: z.string(),
    })
  ),
  summary: z.string(),
});
