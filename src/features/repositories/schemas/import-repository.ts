import { z } from "zod";

export const importRepositorySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Repository URL is required.")
    .max(500),
});

export type ImportRepositoryInput = z.infer<typeof importRepositorySchema>;

export const GITHUB_URL_PATTERN =
  /^https?:\/\/(www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/i;
