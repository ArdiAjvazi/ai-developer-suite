"use client";

import { useMemo, useState } from "react";
import { Filter, RotateCcw, Search, Trash2 } from "lucide-react";
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
import type { ReviewHistoryItem } from "@/features/reviews/types";

type ReviewHistoryProps = {
  items: ReviewHistoryItem[];
  activeJobId?: string | null;
  onSelect: (jobId: string) => void;
  onDelete: (jobId: string) => Promise<void>;
};

function scoreBadgeClass(score: number | null) {
  if (score === null) return "border-border text-muted-foreground";
  if (score >= 85) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (score >= 70) return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-red-500/30 bg-red-500/10 text-red-300";
}

export function ReviewHistory({
  items,
  activeJobId,
  onSelect,
  onDelete,
}: ReviewHistoryProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [languageFilter, setLanguageFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const languages = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.language))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (languageFilter !== "ALL" && item.language !== languageFilter) {
        return false;
      }
      if (!needle) return true;
      return (
        item.fileName.toLowerCase().includes(needle) ||
        item.language.toLowerCase().includes(needle) ||
        item.id.toLowerCase().includes(needle)
      );
    });
  }, [items, languageFilter, query, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review history</CardTitle>
        <CardDescription>
          Search, filter, reopen, or delete previous REVIEW jobs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search file, language, or review ID"
              aria-label="Search review history"
              className="h-10 w-full rounded-md border border-border bg-elevated pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-zinc-500"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="history-status">
                <span className="inline-flex items-center gap-1">
                  <Filter className="h-3 w-3" aria-hidden />
                  Status
                </span>
              </Label>
              <Select
                id="history-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                <option value="SUCCEEDED">Succeeded</option>
                <option value="FAILED">Failed</option>
                <option value="RUNNING">Running</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="history-language">Language</Label>
              <Select
                id="history-language"
                value={languageFilter}
                onChange={(event) => setLanguageFilter(event.target.value)}
              >
                <option value="ALL">All languages</option>
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2" role="list" aria-label="Review history list">
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              No reviews match your filters.
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
                    aria-label={`Reopen review for ${item.fileName}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          scoreBadgeClass(item.score),
                        )}
                      >
                        {item.score ?? "—"}
                      </span>
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.fileName}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.language} · {item.status}
                      {item.mock ? " · mock" : ""} · {item.issueCount} issues ·{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </button>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onSelect(item.id)}
                      aria-label={`Reopen ${item.fileName}`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={deletingId === item.id}
                      onClick={async () => {
                        setDeletingId(item.id);
                        try {
                          await onDelete(item.id);
                        } finally {
                          setDeletingId(null);
                        }
                      }}
                      aria-label={`Delete review ${item.fileName}`}
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
