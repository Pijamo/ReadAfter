import { z } from "zod";

export const marketingOutputSchema = z.object({
  twitterPost: z.string().max(280),
  linkedinPost: z.string().min(50),
  instagramCaption: z.string().min(20),
  hashtags: z.array(z.string()).min(3).max(10),
  emailSnippet: z.string().min(20),
});
