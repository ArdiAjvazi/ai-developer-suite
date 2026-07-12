"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileDown,
  FileText,
  Loader2,
  RefreshCw,
  ScanSearch,
  Trash2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { downloadPdfReport } from "@/features/reports/lib/download-pdf-report";
import type { RepositoryRecord } from "@/features/repositories/types";

type RepoQuickActionsProps = {
  repository: RepositoryRecord;
  onRefresh: () => void;
  onDelete: () => void;
  pending?: boolean;
};

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const linkClass =
  "inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500";

export function RepoQuickActions({
  repository,
  onRefresh,
  onDelete,
  pending,
}: RepoQuickActionsProps) {
  const [copied, setCopied] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const summary =
    repository.analysis?.summaryMarkdown ??
    `# ${repository.fullName}\n\n${repository.description ?? ""}`;

  const query = new URLSearchParams({
    repo: repository.fullName,
    url: repository.htmlUrl,
    id: repository.id,
    source: "REPOSITORY",
  }).toString();

  function exportMarkdown() {
    downloadFile(
      summary,
      `${slugify(repository.name) || "repository"}-summary.md`,
      "text/markdown;charset=utf-8",
    );
  }

  function exportJson() {
    downloadFile(
      JSON.stringify(repository, null, 2),
      `${slugify(repository.name) || "repository"}.json`,
      "application/json",
    );
  }

  async function exportPdf() {
    setPdfError(null);
    setPdfPending(true);
    try {
      await downloadPdfReport({
        sourceType: "REPOSITORY",
        sourceId: repository.id,
      });
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "PDF export failed.");
    } finally {
      setPdfPending(false);
    }
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Repository quick actions"
      >
        <Link href={`/reviews?${query}`} className={linkClass} aria-label="Review repository">
          <ScanSearch className="h-3.5 w-3.5" />
          Review Repository
        </Link>
        <Link
          href={`/documentation?${query}`}
          className={linkClass}
          aria-label="Generate documentation"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Generate Documentation
        </Link>
        <Link href={`/readme?${query}`} className={linkClass} aria-label="Generate README">
          <FileText className="h-3.5 w-3.5" />
          Generate README
        </Link>
        <Link
          href={`/reports?${query}`}
          className={linkClass}
          aria-label="Open PDF reports center"
        >
          <FileDown className="h-3.5 w-3.5" />
          PDF Reports
        </Link>
        <Button type="button" size="sm" variant="outline" onClick={exportMarkdown}>
          <Download className="h-3.5 w-3.5" />
          Markdown
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={exportJson}>
          <Download className="h-3.5 w-3.5" />
          JSON
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void exportPdf()}
          disabled={pdfPending || pending}
          aria-label="Export repository analysis PDF"
        >
          {pdfPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileDown className="h-3.5 w-3.5" />
          )}
          {pdfPending ? "Generating PDF…" : "Export PDF"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={copySummary}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy Summary"}
        </Button>
        <Button type="button" size="sm" onClick={onRefresh} disabled={pending}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onDelete}
          disabled={pending}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
      {pdfError ? (
        <p className="text-xs text-red-300" role="alert">
          {pdfError}
        </p>
      ) : null}
    </div>
  );
}
