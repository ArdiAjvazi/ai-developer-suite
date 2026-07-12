import type {
  ReviewCategory,
  ReviewSeverity,
} from "@/features/reviews/schemas/generate-review";

export type CategoryStatus = "excellent" | "good" | "fair" | "poor";

export type RepositoryHealth = "Excellent" | "Good" | "Fair" | "At Risk";

export type ReviewIssue = {
  id: string;
  category: ReviewCategory;
  severity: ReviewSeverity;
  fileName: string;
  line: number | null;
  description: string;
  whyItMatters: string;
  recommendation: string;
  beforeCode: string;
  afterCode: string;
};

export type CategoryScore = {
  category: ReviewCategory;
  score: number;
  issueCount: number;
  explanation: string;
  status: CategoryStatus;
};

export type ReviewMetrics = {
  estimatedFixMinutes: number;
  technicalDebtHours: number;
  repositoryHealth: RepositoryHealth;
  linesOfCode: number;
  filesAnalyzed: number;
  durationMs: number;
  languageDetected: string;
};

export type SeverityCounts = Record<ReviewSeverity, number>;

export type CodeReviewResult = {
  score: number;
  summary: string;
  categories: CategoryScore[];
  issues: ReviewIssue[];
  metrics: ReviewMetrics;
  severityCounts: SeverityCounts;
};

export type ReviewHistoryItem = {
  id: string;
  createdAt: string;
  status: string;
  language: string;
  fileName: string;
  score: number | null;
  issueCount: number;
  mock: boolean;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  categoryScores: Partial<Record<ReviewCategory, number>>;
};

export type ReviewJobDetail = {
  jobId: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  review: CodeReviewResult | null;
  model: string | null;
  mock: boolean;
  language: string | null;
  fileName: string | null;
};
