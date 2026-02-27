import { z } from "zod";

const urlResultSchema = z.object({
  valid: z.boolean(),
  isPlaceholder: z.boolean(),
  hasAffiliateTag: z.boolean().optional(),
  issue: z.string().nullable(),
});

export const linkValidatorOutputSchema = z.object({
  allValid: z.boolean(),
  results: z.array(
    z.object({
      bookIndex: z.number(),
      bookTitle: z.string(),
      amazonUrl: urlResultSchema,
      flipkartUrl: urlResultSchema,
    })
  ),
  summary: z.string(),
});
