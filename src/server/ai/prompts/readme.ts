import type { DetectedStack } from "@/features/readme/types";

export function buildReadmePrompt(input: {
  description: string;
  template: string;
  projectName: string;
  detected: DetectedStack;
}) {
  const system = `You are CodePilot AI, an expert technical writer for premium SaaS and open-source projects.
Generate a polished, production-ready README.md in GitHub-flavored Markdown.

Rules:
- Output ONLY Markdown (no wrapping fences around the entire document).
- Match the selected template tone and section set.
- Include GitHub badges near the top.
- Include: title, description, features, tech stack table, installation, requirements, environment variables, configuration, getting started, folder structure, architecture when relevant, API endpoints when relevant, authentication when relevant, usage, scripts, examples, screenshots placeholder, roadmap, contributing, license, support, credits, FAQ.
- Prefer concrete commands based on detected package manager and stack.
- Keep tone clear, premium, and developer-centric.`;

  const user = `Template: ${input.template}
Project name: ${input.projectName}
Detected stack JSON:
${JSON.stringify(input.detected, null, 2)}

Project description / source context:
"""
${input.description}
"""

Generate the README now.`;

  return { system, user };
}
