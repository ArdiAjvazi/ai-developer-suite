import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { CodeReviewResult } from "@/features/reviews/types";

type ReviewMetadataProps = {
  review: CodeReviewResult;
  reviewId: string;
  model: string | null;
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function ReviewMetadata({
  review,
  reviewId,
  model,
}: ReviewMetadataProps) {
  const items = [
    { label: "Review duration", value: formatDuration(review.metrics.durationMs) },
    { label: "Lines of code", value: String(review.metrics.linesOfCode) },
    { label: "Files analyzed", value: String(review.metrics.filesAnalyzed) },
    { label: "Language detected", value: review.metrics.languageDetected },
    { label: "Model used", value: model ?? "n/a" },
    { label: "Review ID", value: reviewId },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional details</CardTitle>
        <CardDescription>
          Run metadata for audits, exports, and reproducibility
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-border bg-elevated/40 px-3 py-2.5"
            >
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 break-all text-sm font-medium text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
