import { z } from "zod";

export const REVIEW_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "C#",
  "PHP",
  "Ruby",
  "SQL",
] as const;

export const REVIEW_CATEGORIES = [
  "Security",
  "Bugs",
  "Performance",
  "Readability",
  "Maintainability",
  "Best Practices",
] as const;

export const REVIEW_SEVERITIES = ["Low", "Medium", "High"] as const;

export const generateReviewSchema = z.object({
  code: z
    .string()
    .trim()
    .min(10, "Paste at least 10 characters of code to review.")
    .max(100_000, "Keep the code under 100,000 characters."),
  language: z.enum(REVIEW_LANGUAGES),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .default("snippet.txt"),
});

export type GenerateReviewInput = z.infer<typeof generateReviewSchema>;
export type ReviewLanguage = (typeof REVIEW_LANGUAGES)[number];
export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];
export type ReviewSeverity = (typeof REVIEW_SEVERITIES)[number];
