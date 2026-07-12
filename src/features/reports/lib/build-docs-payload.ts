import type { DocsResult } from "@/features/documentation/types";
import type { PdfReportPayload } from "@/features/reports/types";

export function buildDocsReportPayload(input: {
  jobId: string;
  result: DocsResult;
  mock?: boolean;
}): PdfReportPayload {
  const { result } = input;
  const plainSummary = result.markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 520);

  return {
    sourceType: "DOCS",
    sourceId: input.jobId,
    title: "AI Documentation Report",
    subtitle: "Generated developer documentation package",
    projectName: result.projectName,
    owner: result.metrics.language,
    generatedAt: new Date().toISOString(),
    executiveSummary:
      plainSummary ||
      `Documentation generated for ${result.projectName} covering ${result.sections.length} sections with an overall quality score of ${result.quality.overall}/100.`,
    overallScore: result.quality.overall,
    metrics: [
      { label: "Scope", value: result.metrics.scope },
      { label: "Language", value: result.metrics.language },
      { label: "Functions", value: result.metrics.functionsFound },
      { label: "Classes", value: result.metrics.classesFound },
      { label: "Endpoints", value: result.metrics.endpointsFound },
      { label: "Word count", value: result.metrics.wordCount },
    ],
    scores: [
      { label: "Completeness", score: result.quality.completeness },
      { label: "Readability", score: result.quality.readability },
      { label: "Coverage", score: result.quality.coverage },
      { label: "Maintainability", score: result.quality.maintainability },
    ],
    sections: [
      {
        kind: "bullets",
        title: "Document sections",
        items: result.sections.length
          ? result.sections
          : ["Overview", "API Reference", "Data Models"],
      },
      {
        kind: "table",
        title: "Quality breakdown",
        headers: ["Dimension", "Score"],
        rows: [
          ["Overall", String(result.quality.overall)],
          ["Completeness", String(result.quality.completeness)],
          ["Readability", String(result.quality.readability)],
          ["Coverage", String(result.quality.coverage)],
          ["Maintainability", String(result.quality.maintainability)],
        ],
      },
      {
        kind: "paragraph",
        title: "Documentation excerpt",
        text: result.markdown.replace(/\r\n/g, "\n").slice(0, 3500),
      },
    ],
    mock: input.mock,
  };
}
