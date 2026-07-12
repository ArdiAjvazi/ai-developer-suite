import {
  Activity,
  AlertTriangle,
  Clock3,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { CodeReviewResult } from "@/features/reviews/types";

type ReviewSummaryProps = {
  review: CodeReviewResult;
  mock?: boolean;
};

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-amber-300";
  return "text-red-300";
}

function healthTone(health: string) {
  if (health === "Excellent") return "text-emerald-400";
  if (health === "Good") return "text-sky-300";
  if (health === "Fair") return "text-amber-300";
  return "text-red-300";
}

export function ReviewSummary({ review, mock }: ReviewSummaryProps) {
  const totalIssues =
    review.severityCounts.High +
    review.severityCounts.Medium +
    review.severityCounts.Low;

  return (
    <section className="space-y-4" aria-labelledby="review-summary-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2
            id="review-summary-heading"
            className="text-sm font-medium text-foreground"
          >
            Review summary
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {mock ? "Mock analysis · " : ""}
            Enterprise quality snapshot for this run
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Overall score</CardTitle>
            <CardDescription>0–100 composite quality index</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-5xl font-semibold tracking-tight",
                scoreTone(review.score),
              )}
            >
              {review.score}
              <span className="ml-1 text-lg font-medium text-muted-foreground">
                /100
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              {review.summary}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              Issues
            </CardTitle>
            <CardDescription>Total and severity mix</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold text-foreground">{totalIssues}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-red-300">
                <span>High</span>
                <span className="font-medium">{review.severityCounts.High}</span>
              </div>
              <div className="flex justify-between text-amber-200">
                <span>Medium</span>
                <span className="font-medium">{review.severityCounts.Medium}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Low</span>
                <span className="font-medium">{review.severityCounts.Low}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
              Effort
            </CardTitle>
            <CardDescription>Fix time & technical debt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Estimated fix time
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {review.metrics.estimatedFixMinutes}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  min
                </span>
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Technical debt
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {review.metrics.technicalDebtHours}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  hrs
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-3.5 w-3.5 text-muted-foreground" />
              Repository health
            </CardTitle>
            <CardDescription>Operational readiness signal</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-3xl font-semibold",
                healthTone(review.metrics.repositoryHealth),
              )}
            >
              {review.metrics.repositoryHealth}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" />
              Weighted from severity and category scores
            </p>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              {review.metrics.filesAnalyzed} file · {review.metrics.linesOfCode}{" "}
              LOC
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
