import type { ReadmeTemplate } from "@/features/readme/schemas/generate-readme";

export type DetectedStack = {
  language: string | null;
  framework: string | null;
  packageManager: string | null;
  backend: string | null;
  frontend: string | null;
  database: string | null;
  orm: string | null;
  authentication: string | null;
  deployment: string | null;
  primaryStack: string;
};

export type ReadmeQualityScores = {
  overall: number;
  completeness: number;
  clarity: number;
  professionalism: number;
  seo: number;
  githubReadability: number;
};

export type ReadmeMetrics = {
  generationTimeMs: number;
  wordCount: number;
  sectionCount: number;
  template: ReadmeTemplate;
  detectedStack: DetectedStack;
};

export type ReadmeResult = {
  markdown: string;
  projectName: string;
  quality: ReadmeQualityScores;
  metrics: ReadmeMetrics;
  badges: string[];
  sectionsGenerated: string[];
};

export type ReadmeHistoryItem = {
  id: string;
  createdAt: string;
  status: string;
  projectName: string;
  template: string;
  qualityScore: number | null;
  language: string | null;
  mock: boolean;
};

export type ReadmeJobDetail = {
  jobId: string;
  status: string;
  createdAt: string;
  markdown: string | null;
  result: ReadmeResult | null;
  model: string | null;
  mock: boolean;
};
