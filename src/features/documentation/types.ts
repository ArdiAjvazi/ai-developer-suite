import type { DocLanguage, DocScope } from "@/features/documentation/schemas/generate-docs";

export type DocsQualityScores = {
  overall: number;
  completeness: number;
  readability: number;
  coverage: number;
  maintainability: number;
};

export type DocsMetrics = {
  generationTimeMs: number;
  language: string;
  filesAnalyzed: number;
  functionsFound: number;
  classesFound: number;
  interfacesFound: number;
  endpointsFound: number;
  modelsFound: number;
  documentationVersion: string;
  scope: DocScope;
  wordCount: number;
  sectionCount: number;
};

export type DocsResult = {
  markdown: string;
  projectName: string;
  quality: DocsQualityScores;
  metrics: DocsMetrics;
  sections: string[];
  searchIndex: string[];
};

export type DocsHistoryItem = {
  id: string;
  createdAt: string;
  status: string;
  projectName: string;
  language: string;
  score: number | null;
  scope: string;
  mock: boolean;
};

export type DocsJobDetail = {
  jobId: string;
  status: string;
  createdAt: string;
  markdown: string | null;
  result: DocsResult | null;
  model: string | null;
  mock: boolean;
};

export type CodeAnalysisSummary = {
  language: DocLanguage | string;
  functions: string[];
  classes: string[];
  interfaces: string[];
  enums: string[];
  hooks: string[];
  endpoints: Array<{ method: string; path: string }>;
  models: string[];
  hasPrisma: boolean;
  hasSql: boolean;
  hasReact: boolean;
};
