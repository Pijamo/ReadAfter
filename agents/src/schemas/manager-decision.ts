import { z } from "zod";

export const managerDecisionSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(1).max(10),
  feedback: z.array(z.string()),
  scores: z.object({
    seoOptimization: z.number().min(1).max(10),
    contentQuality: z.number().min(1).max(10),
    affiliatePlacement: z.number().min(1).max(10),
    readability: z.number().min(1).max(10),
    factualAccuracy: z.number().min(1).max(10),
    compliance: z.number().min(1).max(10),
  }),
});
