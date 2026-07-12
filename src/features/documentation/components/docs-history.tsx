"use client";

import { useMemo, useState } from "react";
import { CopyPlus, Filter, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";
import type { DocsHistoryItem } from "@/features/documentation/types";
import { DOC_SCOPES } from "@/features/documentation/schemas/generate-docs";

type DocsHistoryProps = {
  items: DocsHistoryItem[];
  activeJobId?: string | null;
  onSelect: (jobId: string) => void;
  onDelete: (jobId: string) => Promise<void>;
  onDuplicate: (jobId: string) => Promise<void>;
  onRegenerate: (jobId: string) => void;
};

function scoreClass(score: number | null) {
  if (score === null) return "border-border text-muted-foreground";
  if (score >= 90) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (score >= 75) return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

export function DocsHistory({
  items,
  activeJobId,
  onSelect,
  onDelete,
  onDuplicate,
  onRegenerate,
}: DocsHistoryProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (scopeFilter !== "ALL" && item.scope !== scopeFilter) return false;
      if (!needle) return true;
      return (
        item.projectName.toLowerCase().includes(needle) ||
        item.language.toLowerCase().includes(needle) ||
        item.scope.toLowerCase().includes(needle) ||
        item.id.toLowerCase().includes(needle)
      );
    });
  }, [items, query, scopeFilter, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentation history</CardTitle>
        <CardDescription>
          Search, filter, reopen, duplicate, regenerate, or delete DOCS jobs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search project, language, scope, or job ID"
            aria-label="Search documentation history"
            className="h-10 w-full rounded-md border border-border bg-elevated pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-500"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="docs-status">
              <span className="inline-flex items-center gap-1">
                <Filter className="h-3 w-3" aria-hidden />
                Status
              </span>
            </Label>
            <Select
              id="docs-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="SUCCEEDED">Succeeded</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="docs-scope">Scope</Label>
            <Select
              id="docs-scope"
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
            >
              <option value="ALL">All scopes</option>
              {DOC_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {scope}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2" role="list" aria-label="Documentation history list">
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              No documentation jobs match your filters.
            </p>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                role="listitem"
                className={cn(
                  "rounded-lg border px-3 py-3 transition",
                  activeJobId === item.id
                    ? "border-zinc-500 bg-elevated"
                    : "border-border bg-elevated/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                    aria-label={`Open documentation for ${item.projectName}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          scoreClass(item.score),
                        )}
                      >
                        {item.score ?? "—"}
                      </span>
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.projectName}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.language} · {item.scope} · {item.status}
                      {item.mock ? " · mock" : ""} ·{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onRegenerate(item.id)}
                      aria-label={`Regenerate ${item.projectName}`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={async () => {
                        setBusyId(item.id);
                        try {
                          await onDuplicate(item.id);
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      aria-label={`Duplicate ${item.projectName}`}
                    >
                      <CopyPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={async () => {
                        setBusyId(item.id);
                        try {
                          await onDelete(item.id);
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      aria-label={`Delete ${item.projectName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
