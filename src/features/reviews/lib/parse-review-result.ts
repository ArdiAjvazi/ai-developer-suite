import { z } from "zod";
import {
  REVIEW_CATEGORIES,
  REVIEW_SEVERITIES,
} from "@/features/reviews/schemas/generate-review";
import type { CodeReviewResult } from "@/features/reviews/types";
import {
  estimateDebtHours,
  estimateFixMinutes,
  healthFromScore,
  statusFromScore,
} from "@/features/reviews/lib/review-metrics";

const reviewResultSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
  categories: z
    .array(
      z.object({
        category: z.enum(REVIEW_CATEGORIES),
        score: z.number().min(0).max(100),
        issueCount: z.number().int().min(0),
        explanation: z.string().optional(),
        status: z
          .enum(["excellent", "good", "fair", "poor"])
          .optional(),
      }),
    )
    .min(1),
  issues: z.array(
    z.object({
      id: z.string(),
      category: z.enum(REVIEW_CATEGORIES),
      severity: z.enum(REVIEW_SEVERITIES),
      fileName: z.string(),
      line: z.number().int().positive().nullable(),
      description: z.string(),
      whyItMatters: z.string().optional(),
      recommendation: z.string(),
      beforeCode: z.string().optional(),
      afterCode: z.string().optional(),
    }),
  ),
  metrics: z
    .object({
      estimatedFixMinutes: z.number().optional(),
      technicalDebtHours: z.number().optional(),
      repositoryHealth: z
        .enum(["Excellent", "Good", "Fair", "At Risk"])
        .optional(),
      linesOfCode: z.number().optional(),
      filesAnalyzed: z.number().optional(),
      durationMs: z.number().optional(),
      languageDetected: z.string().optional(),
    })
    .optional(),
});

export function parseReviewResultJson(
  raw: string,
  fallback: {
    language: string;
    linesOfCode: number;
    durationMs: number;
  },
): CodeReviewResult {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const payload = fenced ? fenced[1].trim() : trimmed;
  const parsed = reviewResultSchema.parse(JSON.parse(payload));

  const severityCounts = { High: 0, Medium: 0, Low: 0 };
  for (const issue of parsed.issues) {
    severityCounts[issue.severity] += 1;
  }

  const estimatedFixMinutes =
    parsed.metrics?.estimatedFixMinutes ??
    estimateFixMinutes(
      severityCounts.High,
      severityCounts.Medium,
      severityCounts.Low,
    );

  return {
    score: parsed.score,
    summary: parsed.summary,
    categories: parsed.categories.map((category) => ({
      category: category.category,
      score: category.score,
      issueCount: category.issueCount,
      explanation:
        category.explanation ??
        `${category.category} scored ${category.score}/100 based on detected patterns.`,
      status: category.status ?? statusFromScore(category.score),
    })),
    issues: parsed.issues.map((issue) => ({
      ...issue,
      whyItMatters:
        issue.whyItMatters ??
        "This finding can increase risk, cost, or maintenance burden if left unresolved.",
      beforeCode: issue.beforeCode ?? "// original snippet unavailable",
      afterCode: issue.afterCode ?? "// suggested fix unavailable",
    })),
    metrics: {
      estimatedFixMinutes,
      technicalDebtHours:
        parsed.metrics?.technicalDebtHours ??
        estimateDebtHours(estimatedFixMinutes),
      repositoryHealth:
        parsed.metrics?.repositoryHealth ?? healthFromScore(parsed.score),
      linesOfCode: parsed.metrics?.linesOfCode ?? fallback.linesOfCode,
      filesAnalyzed: parsed.metrics?.filesAnalyzed ?? 1,
      durationMs: parsed.metrics?.durationMs ?? fallback.durationMs,
      languageDetected:
        parsed.metrics?.languageDetected ?? fallback.language,
    },
    severityCounts,
  };
}
