import { z } from "zod";

export const README_TEMPLATES = [
  "Professional",
  "Open Source",
  "Startup",
  "Enterprise",
  "Library",
  "API",
  "CLI Tool",
  "Portfolio",
] as const;

/** Kept for backward-compatible UI hints; detection is preferred. */
export const TECH_STACKS = [
  "Next.js",
  "React",
  "Node.js",
  "Python",
  "Rust",
  "Go",
  "TypeScript Library",
  "Full-stack SaaS",
] as const;

export const generateReadmeSchema = z.object({
  description: z
    .string()
    .trim()
    .min(20, "Add at least 20 characters of project context.")
    .max(20000, "Keep the input under 20,000 characters."),
  template: z.enum(README_TEMPLATES).default("Professional"),
  projectName: z.string().trim().min(1).max(120).optional(),
  stack: z.enum(TECH_STACKS).optional(),
});

export type GenerateReadmeInput = z.infer<typeof generateReadmeSchema>;
export type ReadmeTemplate = (typeof README_TEMPLATES)[number];
