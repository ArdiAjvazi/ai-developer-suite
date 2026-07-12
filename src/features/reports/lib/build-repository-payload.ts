import type { RepositoryRecord } from "@/features/repositories/types";
import type { PdfReportPayload } from "@/features/reports/types";

export function buildRepositoryReportPayload(
  repository: RepositoryRecord,
): PdfReportPayload {
  const analysis = repository.analysis;
  const summary =
    analysis?.summaryMarkdown
      ?.replace(/[#|*_`\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 520) ??
    repository.description ??
    `Repository analysis for ${repository.fullName}.`;

  const stack = analysis?.stack;
  const health = analysis?.health;
  const stats = analysis?.statistics;

  return {
    sourceType: "REPOSITORY",
    sourceId: repository.id,
    title: "GitHub Repository Analysis",
    subtitle: "Stack detection, health, and project structure summary",
    projectName: repository.fullName,
    owner: repository.owner,
    generatedAt: new Date().toISOString(),
    executiveSummary: summary,
    overallScore: health?.overall ?? null,
    metrics: [
      { label: "Visibility", value: repository.visibility },
      { label: "Default branch", value: repository.defaultBranch },
      { label: "Primary language", value: repository.primaryLanguage ?? "—" },
      { label: "Stars", value: repository.stars },
      { label: "Forks", value: repository.forks },
      { label: "Open issues", value: repository.openIssues },
      { label: "License", value: repository.license ?? "—" },
      { label: "Size", value: `${repository.sizeKb.toLocaleString()} KB` },
      ...(stats
        ? [
            { label: "Files", value: stats.files },
            { label: "Folders", value: stats.folders },
            { label: "Lines of code", value: stats.linesOfCode },
            { label: "Dependencies", value: stats.dependenciesCount },
          ]
        : []),
    ],
    scores: health
      ? [
          { label: "Architecture", score: health.architecture },
          { label: "Security", score: health.security },
          { label: "Maintainability", score: health.maintainability },
          { label: "Documentation", score: health.documentation },
          { label: "Project Structure", score: health.projectStructure },
          { label: "Dependency Quality", score: health.dependencyQuality },
        ]
      : [],
    sections: [
      {
        kind: "table",
        title: "Detected stack",
        headers: ["Layer", "Value"],
        rows: [
          ["Framework", stack?.framework ?? "—"],
          ["Frontend", stack?.frontend ?? "—"],
          ["Backend", stack?.backend ?? "—"],
          ["Database", stack?.database ?? "—"],
          ["ORM", stack?.orm ?? "—"],
          ["Authentication", stack?.authentication ?? "—"],
          ["Package manager", stack?.packageManager ?? "—"],
          ["Deployment", stack?.deployment ?? "—"],
          ["Languages", stack?.languages.join(", ") || "—"],
        ],
      },
      {
        kind: "table",
        title: "Top dependencies",
        headers: ["Name", "Version", "Purpose", "Manager"],
        rows: (analysis?.dependencies ?? []).slice(0, 25).map((dep) => [
          dep.name,
          dep.version,
          dep.purpose,
          dep.manager,
        ]),
      },
      {
        kind: "bullets",
        title: "Top-level structure",
        items: (analysis?.tree ?? [])
          .slice(0, 30)
          .map((node) => `${node.type === "folder" ? "📁" : "📄"} ${node.name}`),
      },
      {
        kind: "paragraph",
        title: "Repository URL",
        text: repository.htmlUrl,
      },
    ],
    mock: repository.mock,
  };
}
