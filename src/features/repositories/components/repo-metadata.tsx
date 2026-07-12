import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { RepositoryRecord } from "@/features/repositories/types";
import { ExternalLink } from "lucide-react";

type RepoMetadataProps = {
  repository: RepositoryRecord;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RepoMetadata({ repository }: RepoMetadataProps) {
  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: "Repository", value: repository.name },
    { label: "Owner", value: repository.owner },
    {
      label: "Description",
      value: repository.description ?? "—",
    },
    { label: "Visibility", value: repository.visibility },
    { label: "Default branch", value: repository.defaultBranch },
    { label: "License", value: repository.license ?? "—" },
    { label: "Primary language", value: repository.primaryLanguage ?? "—" },
    { label: "Stars", value: repository.stars.toLocaleString() },
    { label: "Forks", value: repository.forks.toLocaleString() },
    { label: "Open issues", value: repository.openIssues.toLocaleString() },
    { label: "Last commit", value: formatDate(repository.lastCommitAt) },
    {
      label: "Repository size",
      value: `${repository.sizeKb.toLocaleString()} KB`,
    },
    {
      label: "Repository URL",
      value: (
        <a
          href={repository.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sky-300 hover:underline"
        >
          {repository.htmlUrl}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repository metadata</CardTitle>
        <CardDescription>
          {repository.fullName}
          {repository.mock ? " · mock analysis" : " · live GitHub data"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-border bg-elevated/40 px-3 py-2 sm:[&:nth-child(3)]:col-span-2"
            >
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
