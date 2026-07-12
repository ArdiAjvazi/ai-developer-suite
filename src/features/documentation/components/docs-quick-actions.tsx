"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileDown,
  Loader2,
  RefreshCw,
  Share2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { downloadPdfReport } from "@/features/reports/lib/download-pdf-report";

type DocsQuickActionsProps = {
  markdown: string;
  projectName: string;
  jobId: string;
  onRegenerate: () => void;
  pending?: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function DocsQuickActions({
  markdown,
  projectName,
  jobId,
  onRegenerate,
  pending,
}: DocsQuickActionsProps) {
  const [copied, setCopied] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function download(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf() {
    setPdfError(null);
    setPdfPending(true);
    try {
      await downloadPdfReport({ sourceType: "DOCS", sourceId: jobId });
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "PDF export failed.");
    } finally {
      setPdfPending(false);
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        title: projectName,
        text: `Documentation generated with CodePilot AI (${jobId.slice(0, 8)})`,
      });
      return;
    }
    await copyMarkdown();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Documentation quick actions">
        <Button type="button" size="sm" variant="outline" onClick={copyMarkdown} aria-label="Copy markdown">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            download(
              markdown,
              `${slugify(projectName) || "documentation"}.md`,
              "text/markdown;charset=utf-8",
            )
          }
          aria-label="Download markdown"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void downloadPdf()}
          disabled={pdfPending || pending}
          aria-label="Export PDF report"
        >
          {pdfPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileDown className="h-3.5 w-3.5" />
          )}
          {pdfPending ? "Generating PDF…" : "Export PDF"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            download(
              `<!doctype html><html><body><pre>${markdown
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</pre></body></html>`,
              `${slugify(projectName) || "documentation"}.html`,
              "text/html",
            )
          }
          aria-label="Download HTML"
        >
          <Download className="h-3.5 w-3.5" />
          HTML
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={share} aria-label="Share documentation">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
        <Button type="button" size="sm" onClick={onRegenerate} disabled={pending} aria-label="Regenerate documentation">
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
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
