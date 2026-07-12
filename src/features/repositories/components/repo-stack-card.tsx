import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { DetectedRepoStack } from "@/features/repositories/types";

type RepoStackCardProps = {
  stack: DetectedRepoStack;
};

const ROWS: Array<{ key: keyof DetectedRepoStack; label: string }> = [
  { key: "framework", label: "Framework" },
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "database", label: "Database" },
  { key: "orm", label: "ORM" },
  { key: "authentication", label: "Authentication" },
  { key: "packageManager", label: "Package manager" },
  { key: "deployment", label: "Deployment" },
];

export function RepoStackCard({ stack }: RepoStackCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected stack</CardTitle>
        <CardDescription>
          Auto-detected from manifests and project structure
          {stack.languages.length
            ? ` · languages: ${stack.languages.slice(0, 4).join(", ")}`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 sm:grid-cols-2">
          {ROWS.map((row) => {
            const value = stack[row.key];
            const display = Array.isArray(value)
              ? value.join(", ")
              : (value ?? "—");
            return (
              <div
                key={row.key}
                className="rounded-lg border border-border bg-elevated/40 px-3 py-2"
              >
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{display}</dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
