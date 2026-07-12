import type { CategoryStatus } from "@/features/reviews/types";

export function statusFromScore(score: number): CategoryStatus {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "fair";
  return "poor";
}

export function healthFromScore(
  score: number,
): "Excellent" | "Good" | "Fair" | "At Risk" {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "At Risk";
}

export function countLines(code: string) {
  if (!code.trim()) return 0;
  return code.replace(/\r\n/g, "\n").split("\n").length;
}

export function estimateFixMinutes(
  high: number,
  medium: number,
  low: number,
) {
  return high * 45 + medium * 20 + low * 8;
}

export function estimateDebtHours(fixMinutes: number) {
  return Math.round((fixMinutes / 60) * 10) / 10;
}
