import { z } from "zod";

export const DOC_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "SQL",
  "Prisma",
  "Auto-detect",
] as const;

export const DOC_SCOPES = [
  "Full Project",
  "API Focus",
  "Database Focus",
  "Components & Hooks",
  "Architecture",
] as const;

export const generateDocsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(10, "Add at least 10 characters of source or project context.")
    .max(120_000, "Keep the input under 120,000 characters."),
  language: z.enum(DOC_LANGUAGES).default("Auto-detect"),
  scope: z.enum(DOC_SCOPES).default("Full Project"),
  projectName: z.string().trim().min(1).max(120).optional(),
  fileName: z.string().trim().min(1).max(255).optional().default("source.ts"),
  repositoryHint: z.string().trim().max(255).optional(),
});

export type GenerateDocsInput = z.infer<typeof generateDocsSchema>;
export type DocLanguage = (typeof DOC_LANGUAGES)[number];
export type DocScope = (typeof DOC_SCOPES)[number];
