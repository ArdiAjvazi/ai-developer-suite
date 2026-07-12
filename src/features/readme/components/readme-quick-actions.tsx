"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileDown,
  RefreshCw,
  Share2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";

type ReadmeQuickActionsProps = {
  markdown: string;
  projectName: string;
  jobId: string;
  onRegenerate: () => void;
  pending?: boolean;
};

export function ReadmeQuickActions({
  markdown,
  projectName,
  jobId,
  onRegenerate,
  pending,
}: ReadmeQuickActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadMarkdown() {
    downloadFile(
      markdown,
      `${slugify(projectName) || "README"}.md`,
      "text/markdown;charset=utf-8",
    );
  }

  function downloadHtml() {
    const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>${projectName}</title>
<style>
body{font-family:ui-sans-serif,system-ui;max-width:860px;margin:40px auto;padding:0 20px;color:#111;line-height:1.6}
pre{background:#f4f4f5;padding:12px;border-radius:8px;overflow:auto}
code{font-family:ui-monospace,monospace}
</style></head><body>
<pre>${markdown.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string))}</pre>
</body></html>`;
    downloadFile(html, `${slugify(projectName) || "readme"}.html`, "text/html");
  }

  function downloadPdf() {
    const html = `<!doctype html><html><head><title>${projectName}</title>
<style>body{font-family:ui-sans-serif,system-ui;padding:40px;max-width:860px;margin:0 auto;white-space:pre-wrap}</style>
</head><body>${markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}<script>window.onload=()=>window.print()</script></body></html>`;
    const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
  }

  async function share() {
    const shareData = {
      title: projectName,
      text: `README generated with CodePilot AI (Job ${jobId.slice(0, 8)})`,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="README quick actions"
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copyMarkdown}
        aria-label="Copy README markdown"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        Copy README
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={downloadMarkdown}
        aria-label="Download README.md"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={downloadPdf}
        aria-label="Export printable PDF"
      >
        <FileDown className="h-3.5 w-3.5" />
        Export PDF
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={downloadHtml}
        aria-label="Download HTML"
      >
        <Download className="h-3.5 w-3.5" />
        Download HTML
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={share}
        aria-label="Share README"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={onRegenerate}
        disabled={pending}
        aria-label="Regenerate README"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Regenerate
      </Button>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
