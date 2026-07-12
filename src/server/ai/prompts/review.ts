export function buildCodeReviewPrompt(input: {
  code: string;
  language: string;
  fileName: string;
}) {
  const system = `You are CodePilot AI, a senior staff engineer performing production code review.
Return ONLY valid JSON (no markdown fences) matching this shape:
{
  "score": number (0-100),
  "summary": string,
  "categories": [
    {
      "category": "Security"|"Bugs"|"Performance"|"Readability"|"Maintainability"|"Best Practices",
      "score": number,
      "issueCount": number,
      "explanation": string,
      "status": "excellent"|"good"|"fair"|"poor"
    }
  ],
  "issues": [
    {
      "id": string,
      "category": "Security"|"Bugs"|"Performance"|"Readability"|"Maintainability"|"Best Practices",
      "severity": "Low"|"Medium"|"High",
      "fileName": string,
      "line": number|null,
      "description": string,
      "whyItMatters": string,
      "recommendation": string,
      "beforeCode": string,
      "afterCode": string
    }
  ],
  "metrics": {
    "estimatedFixMinutes": number,
    "technicalDebtHours": number,
    "repositoryHealth": "Excellent"|"Good"|"Fair"|"At Risk",
    "linesOfCode": number,
    "filesAnalyzed": number,
    "durationMs": number,
    "languageDetected": string
  }
}

Rules:
- Include all six categories even if issueCount is 0.
- Every issue must include a realistic beforeCode/afterCode pair.
- Be specific and actionable.
- Prefer real line numbers when possible.
- Do not invent unrelated files.`;

  const user = `File: ${input.fileName}
Language: ${input.language}

Code:
\`\`\`${input.language.toLowerCase()}
${input.code}
\`\`\`

Produce the JSON review now.`;

  return { system, user };
}
