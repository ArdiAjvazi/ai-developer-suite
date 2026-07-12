"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Code2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { SeverityBadge } from "@/features/reviews/components/severity-badge";
import { CodeDiffViewer } from "@/features/reviews/components/code-diff-viewer";
import type { ReviewIssue } from "@/features/reviews/types";

type IssueCardProps = {
  issue: ReviewIssue;
  onApplyFix?: (issue: ReviewIssue) => void;
};

export function IssueCard({ issue, onApplyFix }: IssueCardProps) {
  const [copied, setCopied] = useState<"rec" | "fix" | null>(null);

  async function copy(kind: "rec" | "fix", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1400);
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={issue.severity} />
            <CardTitle>{issue.category}</CardTitle>
          </div>
          <CardDescription>
            {issue.fileName}
            {issue.line ? ` · line ${issue.line}` : ""}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => copy("rec", issue.recommendation)}
            aria-label={`Copy recommendation for ${issue.category}`}
          >
            {copied === "rec" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ClipboardCopy className="h-3.5 w-3.5" />
            )}
            Copy
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => copy("fix", issue.afterCode)}
            aria-label={`Copy fixed code for ${issue.category}`}
          >
            {copied === "fix" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Code2 className="h-3.5 w-3.5" />
            )}
            Fixed code
          </Button>
          {onApplyFix ? (
            <Button
              type="button"
              size="sm"
              onClick={() => onApplyFix(issue)}
              aria-label={`Apply AI fix for ${issue.category}`}
            >
              Apply fix
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Explanation
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
              {issue.description}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Why it matters
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
              {issue.whyItMatters}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-elevated/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            AI recommendation
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {issue.recommendation}
          </p>
        </div>

        <CodeDiffViewer
          beforeCode={issue.beforeCode}
          afterCode={issue.afterCode}
        />
      </CardContent>
    </Card>
  );
}
