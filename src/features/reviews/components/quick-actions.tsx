"use client";

import { useState } from "react";
import {
  Check,
  ClipboardCopy,
  Code2,
  Download,
  FileDown,
  Loader2,
  Wand2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { downloadPdfReport } from "@/features/reports/lib/download-pdf-report";
import type { CodeReviewResult } from "@/features/reviews/types";

type QuickActionsProps = {
  review: CodeReviewResult;
  reviewId: string;
  model: string | null;
  onApplyFix: () => void;
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function buildMarkdown(review: CodeReviewResult, reviewId: string) {
  const lines = [
    `# CodePilot Review`,
    ``,
    `**Review ID:** ${reviewId}`,
    `**Score:** ${review.score}/100`,
    `**Health:** ${review.metrics.repositoryHealth}`,
    ``,
    `## Summary`,
    review.summary,
    ``,
    `## Severity`,
    `- High: ${review.severityCounts.High}`,
    `- Medium: ${review.severityCounts.Medium}`,
    `- Low: ${review.severityCounts.Low}`,
    ``,
    `## Findings`,
  ];

  for (const issue of review.issues) {
    lines.push(
      ``,
      `### ${issue.severity} · ${issue.category}`,
      `- File: \`${issue.fileName}\`${issue.line ? `:${issue.line}` : ""}`,
      `- ${issue.description}`,
      `- Why it matters: ${issue.whyItMatters}`,
      `- Recommendation: ${issue.recommendation}`,
      ``,
      "```diff",
      ...issue.beforeCode.split("\n").map((line) => `- ${line}`),
      ...issue.afterCode.split("\n").map((line) => `+ ${line}`),
      "```",
    );
  }

  return lines.join("\n");
}

export function QuickActions({
  review,
  reviewId,
  model,
  onApplyFix,
}: QuickActionsProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [pdfPending, setPdfPending] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function flash(key: string, value: string) {
    await copyText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  function downloadMarkdown() {
    const blob = new Blob([buildMarkdown(review, reviewId)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `codepilot-review-${reviewId.slice(0, 8)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf() {
    setPdfError(null);
    setPdfPending(true);
    try {
      await downloadPdfReport({ sourceType: "REVIEW", sourceId: reviewId });
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "PDF export failed.");
    } finally {
      setPdfPending(false);
    }
  }

  const recommendationBundle = review.issues
    .map(
      (issue, index) =>
        `${index + 1}. [${issue.severity}] ${issue.recommendation}`,
    )
    .join("\n");

  const fixedBundle = review.issues
    .map(
      (issue, index) =>
        `// Fix ${index + 1}: ${issue.category}\n${issue.afterCode}`,
    )
    .join("\n\n");

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Review quick actions"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => flash("rec", recommendationBundle)}
          aria-label="Copy all recommendations"
        >
          {copied === "rec" ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
          Copy Recommendation
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => flash("fix", fixedBundle)}
          aria-label="Copy fixed code snippets"
        >
          {copied === "fix" ? <Check className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
          Copy Fixed Code
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={downloadMarkdown}
          aria-label="Export review as Markdown"
        >
          <Download className="h-3.5 w-3.5" />
          Export Markdown
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void downloadPdf()}
          disabled={pdfPending}
          aria-label="Download PDF report"
        >
          {pdfPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileDown className="h-3.5 w-3.5" />
          )}
          {pdfPending ? "Generating PDF…" : "Download PDF"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onApplyFix}
          aria-label="Apply AI fix to editor"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Apply AI Fix
        </Button>
      </div>
      {pdfError ? (
        <p className="text-xs text-red-300" role="alert">
          {pdfError}
        </p>
      ) : null}
      <p className="sr-only">Model: {model ?? "n/a"}</p>
    </div>
  );
}
