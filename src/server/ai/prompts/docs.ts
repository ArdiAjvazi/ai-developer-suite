import type { CodeAnalysisSummary } from "@/features/documentation/types";

export function buildDocsPrompt(input: {
  code: string;
  projectName: string;
  scope: string;
  fileName: string;
  analysis: CodeAnalysisSummary;
}) {
  const system = `You are CodePilot AI, a principal engineer writing enterprise developer documentation.
Return ONLY GitHub-flavored Markdown (no wrapping fences around the entire document).

Include sections when relevant:
- Project overview (what/why/how)
- Architecture
- Folder structure
- Tech stack & dependencies
- Functions (purpose, params, returns, exceptions, example, complexity, notes)
- Classes (description, properties, methods, inheritance, example)
- Interfaces/enums
- Components & hooks
- API endpoints (method, path, request/response, status codes, auth, examples)
- Database models (tables, relationships, keys, indexes)
- Configuration
- Workflow, build process, deployment notes

Every major section must explain what it does, why it exists, and how developers should use it.
Be concrete and production-minded.`;

  const user = `Project: ${input.projectName}
Scope: ${input.scope}
File: ${input.fileName}
Analysis JSON:
${JSON.stringify(input.analysis, null, 2)}

Source:
\`\`\`
${input.code}
\`\`\`

Generate the documentation now.`;

  return { system, user };
}
