import { ProgressBar } from "@/shared/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { DocsQualityScores } from "@/features/documentation/types";
import { cn } from "@/shared/lib/cn";

type DocsQualityScoreProps = {
  quality: DocsQualityScores;
};

function tone(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-sky-300";
  if (score >= 60) return "text-amber-300";
  return "text-red-300";
}

function bar(score: number) {
  if (score >= 90) return "bg-emerald-400";
  if (score >= 75) return "bg-sky-400";
  if (score >= 60) return "bg-amber-400";
  return "bg-red-400";
}

export function DocsQualityScore({ quality }: DocsQualityScoreProps) {
  const rows = [
    { label: "Completeness", value: quality.completeness },
    { label: "Readability", value: quality.readability },
    { label: "Coverage", value: quality.coverage },
    { label: "Maintainability", value: quality.maintainability },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentation quality</CardTitle>
        <CardDescription>
          Completeness, readability, coverage, and maintainability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("text-4xl font-semibold tracking-tight", tone(quality.overall))}>
          {quality.overall}
          <span className="ml-1 text-lg font-medium text-muted-foreground">/100</span>
        </p>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
              <ProgressBar
                value={row.value}
                label={row.label}
                indicatorClassName={bar(row.value)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
