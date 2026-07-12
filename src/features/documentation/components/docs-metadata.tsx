import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { DocsResult } from "@/features/documentation/types";

type DocsMetadataProps = {
  result: DocsResult;
  model: string | null;
  jobId: string;
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function DocsMetadata({ result, model, jobId }: DocsMetadataProps) {
  const items = [
    { label: "Generation time", value: formatDuration(result.metrics.generationTimeMs) },
    { label: "Language", value: result.metrics.language },
    { label: "Files analyzed", value: String(result.metrics.filesAnalyzed) },
    { label: "Functions found", value: String(result.metrics.functionsFound) },
    { label: "Classes found", value: String(result.metrics.classesFound) },
    { label: "Documentation version", value: result.metrics.documentationVersion },
    { label: "Model used", value: model ?? "n/a" },
    { label: "Job ID", value: jobId },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional details</CardTitle>
        <CardDescription>
          Run metadata for audits and reproducibility
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
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
