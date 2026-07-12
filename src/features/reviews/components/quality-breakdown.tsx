import {
  Bug,
  Gauge,
  Lock,
  Sparkles,
  Type,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { ProgressBar } from "@/shared/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type {
  CategoryScore,
  CategoryStatus,
} from "@/features/reviews/types";
import type { ReviewCategory } from "@/features/reviews/schemas/generate-review";

const ICONS: Record<ReviewCategory, LucideIcon> = {
  Security: Lock,
  Bugs: Bug,
  Performance: Gauge,
  Readability: Type,
  Maintainability: Wrench,
  "Best Practices": Sparkles,
};

const STATUS_LABEL: Record<CategoryStatus, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Needs work",
};

const STATUS_STYLE: Record<CategoryStatus, string> = {
  excellent: "text-emerald-400",
  good: "text-sky-300",
  fair: "text-amber-300",
  poor: "text-red-300",
};

const BAR_STYLE: Record<CategoryStatus, string> = {
  excellent: "bg-emerald-400",
  good: "bg-sky-400",
  fair: "bg-amber-400",
  poor: "bg-red-400",
};

type QualityBreakdownProps = {
  categories: CategoryScore[];
};

export function QualityBreakdown({ categories }: QualityBreakdownProps) {
  return (
    <section className="space-y-3" aria-labelledby="quality-breakdown-heading">
      <div>
        <h2
          id="quality-breakdown-heading"
          className="text-sm font-medium text-foreground"
        >
          Quality breakdown
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Category scores with status, explanation, and issue density
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = ICONS[category.category];
          return (
            <Card key={category.category}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-elevated">
                      <Icon className="h-3.5 w-3.5 text-foreground" aria-hidden />
                    </span>
                    <div>
                      <CardTitle>{category.category}</CardTitle>
                      <CardDescription>
                        {category.issueCount} issue
                        {category.issueCount === 1 ? "" : "s"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">
                      {category.score}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] font-medium",
                        STATUS_STYLE[category.status],
                      )}
                    >
                      {STATUS_LABEL[category.status]}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ProgressBar
                  value={category.score}
                  label={`${category.category} score`}
                  indicatorClassName={BAR_STYLE[category.status]}
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {category.explanation}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
