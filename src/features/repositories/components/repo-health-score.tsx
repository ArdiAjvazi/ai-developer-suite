import { ProgressBar } from "@/shared/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { RepoHealthScores } from "@/features/repositories/types";
import { cn } from "@/shared/lib/cn";

type RepoHealthScoreProps = {
  health: RepoHealthScores;
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

export function RepoHealthScore({ health }: RepoHealthScoreProps) {
  const rows = [
    { label: "Architecture", value: health.architecture },
    { label: "Security", value: health.security },
    { label: "Maintainability", value: health.maintainability },
    { label: "Documentation", value: health.documentation },
    { label: "Project Structure", value: health.projectStructure },
    { label: "Dependency Quality", value: health.dependencyQuality },
  ];

  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle>Repository health</CardTitle>
        <CardDescription>Overall health score across six quality dimensions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("text-4xl font-semibold tracking-tight", tone(health.overall))}>
          {health.overall}
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
