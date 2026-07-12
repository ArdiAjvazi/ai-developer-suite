import type { CodeReviewResult } from "@/features/reviews/types";
import type { PdfReportPayload } from "@/features/reports/types";

export function buildReviewReportPayload(input: {
  jobId: string;
  review: CodeReviewResult;
  fileName?: string | null;
  language?: string | null;
  mock?: boolean;
}): PdfReportPayload {
  const { review } = input;

  return {
    sourceType: "REVIEW",
    sourceId: input.jobId,
    title: "AI Code Review Report",
    subtitle: "Quality, security, and maintainability analysis",
    projectName: input.fileName ?? "Code snippet",
    owner: input.language ?? review.metrics.languageDetected ?? "Unknown",
    generatedAt: new Date().toISOString(),
    executiveSummary: review.summary,
    overallScore: review.score,
    metrics: [
      { label: "Repository health", value: review.metrics.repositoryHealth },
      { label: "Lines of code", value: review.metrics.linesOfCode },
      { label: "Files analyzed", value: review.metrics.filesAnalyzed },
      { label: "Est. fix time", value: `${review.metrics.estimatedFixMinutes} min` },
      { label: "Tech debt", value: `${review.metrics.technicalDebtHours} h` },
      {
        label: "Severity mix",
        value: `H ${review.severityCounts.High} · M ${review.severityCounts.Medium} · L ${review.severityCounts.Low}`,
      },
    ],
    scores: review.categories.map((category) => ({
      label: category.category,
      score: category.score,
    })),
    sections: [
      {
        kind: "bullets",
        title: "Category overview",
        items: review.categories.map(
          (category) =>
            `${category.category}: ${category.score}/100 (${category.status}) — ${category.explanation}`,
        ),
      },
      {
        kind: "table",
        title: "Findings",
        headers: ["Severity", "Category", "Location", "Issue"],
        rows: review.issues.slice(0, 40).map((issue) => [
          issue.severity,
          issue.category,
          `${issue.fileName}${issue.line ? `:${issue.line}` : ""}`,
          issue.description,
        ]),
      },
      ...review.issues.slice(0, 12).map(
        (issue) =>
          ({
            kind: "paragraph" as const,
            title: `${issue.severity} · ${issue.category}`,
            text: `${issue.description}\n\nWhy it matters: ${issue.whyItMatters}\n\nRecommendation: ${issue.recommendation}`,
          }) as const,
      ),
    ],
    mock: input.mock,
  };
}
