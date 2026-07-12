"use client";

import { useMemo, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { MarkdownPreview } from "@/shared/components/ui/markdown-preview";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";

type ViewMode = "editor" | "preview" | "split";

type DocsDocumentViewerProps = {
  markdown: string;
  onChange: (value: string) => void;
  sections: string[];
};

function filterMarkdownByQuery(markdown: string, query: string) {
  if (!query.trim()) return markdown;
  const needle = query.toLowerCase();
  const blocks = markdown.split(/\n(?=##\s)/);
  const matched = blocks.filter((block) => block.toLowerCase().includes(needle));
  return matched.length ? matched.join("\n") : markdown;
}

export function DocsDocumentViewer({
  markdown,
  onChange,
  sections,
}: DocsDocumentViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const visibleMarkdown = useMemo(() => {
    const filtered = filterMarkdownByQuery(markdown, query);
    if (!collapsed) return filtered;
    // Collapse to headings-only outline when collapsed
    return filtered
      .split(/\r?\n/)
      .filter((line) => /^#{1,3}\s+/.test(line))
      .join("\n\n");
  }, [collapsed, markdown, query]);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Documentation workspace</CardTitle>
            <CardDescription>
              Search, collapse sections, and switch editor/preview/split views
            </CardDescription>
          </div>
          <div
            className="inline-flex rounded-lg border border-border bg-elevated p-1"
            role="tablist"
            aria-label="Documentation view mode"
          >
            {(["editor", "preview", "split"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
                  viewMode === mode
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "split" ? "Split view" : mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search generated documentation"
              aria-label="Search documentation content"
              className="h-10 w-full rounded-md border border-border bg-elevated pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sections to headings"
            >
              <ChevronsDownUp className="h-3.5 w-3.5" />
              Collapse
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCollapsed(false)}
              aria-label="Expand all sections"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
              Expand all
            </Button>
          </div>
        </div>

        {sections.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label="Generated sections">
            {sections.slice(0, 12).map((section) => (
              <span
                key={section}
                className="rounded-full border border-border bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {section}
              </span>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid gap-4",
            viewMode === "split" && "lg:grid-cols-2",
          )}
        >
          {viewMode !== "preview" ? (
            <Textarea
              value={markdown}
              onChange={(event) => onChange(event.target.value)}
              aria-label="Documentation markdown editor"
              className="min-h-[460px] font-mono text-[12px] leading-relaxed"
            />
          ) : null}
          {viewMode !== "editor" ? (
            <div className="min-h-[460px] overflow-auto rounded-md border border-border bg-[#0d0d0f] p-4">
              <MarkdownPreview markdown={visibleMarkdown} />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
