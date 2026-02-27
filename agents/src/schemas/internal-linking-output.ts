import { z } from "zod";

const linkSuggestionSchema = z.object({
  fromSlug: z.string().optional(),
  toSlug: z.string().optional(),
  fromTitle: z.string().optional(),
  toTitle: z.string().optional(),
  anchorText: z.string(),
  insertContext: z.string(),
  relevanceReason: z.string(),
});

export const internalLinkingOutputSchema = z.object({
  linksToNewArticle: z.array(linkSuggestionSchema),
  linksFromNewArticle: z.array(linkSuggestionSchema),
  summary: z.string(),
});
