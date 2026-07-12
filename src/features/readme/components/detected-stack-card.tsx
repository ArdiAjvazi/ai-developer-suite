import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { DetectedStack } from "@/features/readme/types";

type DetectedStackCardProps = {
  detected: DetectedStack;
};

const ROWS: Array<{ key: keyof DetectedStack; label: string }> = [
  { key: "language", label: "Language" },
  { key: "framework", label: "Framework" },
  { key: "packageManager", label: "Package manager" },
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "database", label: "Database" },
  { key: "orm", label: "ORM" },
  { key: "authentication", label: "Authentication" },
  { key: "deployment", label: "Deployment" },
];

export function DetectedStackCard({ detected }: DetectedStackCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart project detection</CardTitle>
        <CardDescription>
          Auto-detected from your description · primary: {detected.primaryStack}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 sm:grid-cols-2">
          {ROWS.map((row) => (
            <div
              key={row.key}
              className="rounded-lg border border-border bg-elevated/40 px-3 py-2"
            >
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {detected[row.key] ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
