export type ReportSourceType = "REVIEW" | "DOCS" | "REPOSITORY";

export type ReportMetric = {
  label: string;
  value: string | number;
};

export type ReportScoreRow = {
  label: string;
  score: number;
};

export type ReportSectionBlock =
  | {
      kind: "paragraph";
      title?: string;
      text: string;
    }
  | {
      kind: "bullets";
      title?: string;
      items: string[];
    }
  | {
      kind: "table";
      title?: string;
      headers: string[];
      rows: string[][];
    }
  | {
      kind: "code";
      title?: string;
      language?: string;
      code: string;
    };

export type PdfReportPayload = {
  sourceType: ReportSourceType;
  sourceId: string;
  title: string;
  subtitle: string;
  projectName: string;
  owner: string;
  generatedAt: string;
  executiveSummary: string;
  metrics: ReportMetric[];
  scores: ReportScoreRow[];
  overallScore: number | null;
  sections: ReportSectionBlock[];
  mock?: boolean;
};

export type ReportHistoryItem = {
  id: string;
  createdAt: string;
  status: string;
  sourceType: ReportSourceType;
  sourceId: string;
  title: string;
  projectName: string;
  overallScore: number | null;
  mock: boolean;
};

export type GenerateReportRequest =
  | { sourceType: "REVIEW"; sourceId: string }
  | { sourceType: "DOCS"; sourceId: string }
  | { sourceType: "REPOSITORY"; sourceId: string };
