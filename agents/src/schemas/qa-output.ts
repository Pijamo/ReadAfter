import { z } from "zod";

export const qaIssueSchema = z.object({
  bookIndex: z.number(),
  bookTitle: z.string(),
  severity: z.enum(["error", "warning"]),
  issue: z.string(),
  suggestion: z.string(),
});

export const qaOutputSchema = z.object({
  passed: z.boolean(),
  issues: z.array(qaIssueSchema),
  overallNotes: z.string(),
});
