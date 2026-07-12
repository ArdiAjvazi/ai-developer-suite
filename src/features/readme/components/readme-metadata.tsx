import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { ReadmeResult } from "@/features/readme/types";

type ReadmeMetadataProps = {
  result: ReadmeResult;
  model: string | null;
  jobId: string;
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function ReadmeMetadata({ result, model, jobId }: ReadmeMetadataProps) {
  const items = [
    {
      label: "Generation time",
      value: formatDuration(result.metrics.generationTimeMs),
    },
    { label: "Words", value: String(result.metrics.wordCount) },
    {
      label: "Sections generated",
      value: String(result.metrics.sectionCount),
    },
    {
      label: "Detected stack",
      value: result.metrics.detectedStack.primaryStack,
    },
    { label: "Template used", value: result.metrics.template },
    { label: "Model used", value: model ?? "n/a" },
    { label: "Job ID", value: jobId },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional details</CardTitle>
        <CardDescription>
          Generation metadata for audits and reproducibility
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
