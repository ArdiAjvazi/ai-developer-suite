export function buildReadmePrompt(input: {
  description: string;
  stack: string;
}) {
  const system = `You are CodePilot AI, an expert technical writer for open-source and SaaS projects.
Generate a polished, production-ready README.md in GitHub-flavored Markdown.

Rules:
- Output ONLY Markdown (no surrounding code fences wrapping the entire document).
- Include: title, short tagline, badges placeholders, features, tech stack, getting started, usage, project structure, scripts/commands when relevant, contributing, license.
- Match the selected technology stack conventions.
- Keep tone clear, premium, and developer-centric.
- Prefer concrete commands over vague advice.`;

  const user = `Technology stack: ${input.stack}

Project description / source context:
"""
${input.description}
"""

Generate the README now.`;

  return { system, user };
}
