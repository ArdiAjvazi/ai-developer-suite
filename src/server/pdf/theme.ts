/** Shared PDF theme aligned with CodePilot dark dashboard. */
export const pdfTheme = {
  pageBg: "#09090b",
  cardBg: "#18181b",
  elevated: "#27272a",
  border: "#3f3f46",
  text: "#fafafa",
  muted: "#a1a1aa",
  accent: "#e4e4e7",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#38bdf8",
  brand: "#f4f4f5",
} as const;

export function scoreColor(score: number): string {
  if (score >= 90) return pdfTheme.success;
  if (score >= 75) return pdfTheme.info;
  if (score >= 60) return pdfTheme.warning;
  return pdfTheme.danger;
}

export function formatReportDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
