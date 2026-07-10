import { z } from "zod";

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
  stack: z.enum(TECH_STACKS),
});

export type GenerateReadmeInput = z.infer<typeof generateReadmeSchema>;
