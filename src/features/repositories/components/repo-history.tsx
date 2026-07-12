"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
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
import type { RepositoryHistoryItem } from "@/features/repositories/types";

type RepoHistoryProps = {
  history: RepositoryHistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReimport: (item: RepositoryHistoryItem) => void;
  pending?: boolean;
};

export function RepoHistory({
  history,
  selectedId,
  onSelect,
  onDelete,
  onReimport,
  pending,
}: RepoHistoryProps) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [status, setStatus] = useState("all");

  const languages = useMemo(() => {
    const set = new Set(
      history.map((h) => h.primaryLanguage).filter(Boolean) as string[],
    );
    return [...set].sort();
  }, [history]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((item) => {
      if (language !== "all" && item.primaryLanguage !== language) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!q) return true;
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        (item.framework ?? "").toLowerCase().includes(q) ||
        (item.primaryLanguage ?? "").toLowerCase().includes(q)
      );
    });
  }, [history, query, language, status]);

  const visible = filtered.slice(0, 40);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repository history</CardTitle>
        <CardDescription>
          Recent imports · search, filter, re-import, or delete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_140px_140px]">
          <div className="space-y-1.5">
            <Label htmlFor="repo-history-search">Search</Label>
            <Input
              id="repo-history-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Repository, owner, framework…"
              aria-label="Search repository history"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repo-history-lang">Language</Label>
            <Select
              id="repo-history-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Filter by language"
            >
              <option value="all">All</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repo-history-status">Status</Label>
            <Select
              id="repo-history-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All</option>
              <option value="READY">Ready</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No repositories imported yet. Paste a GitHub URL to get started.
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No history items match your filters.
          </p>
        ) : (
          <ul className="max-h-[480px] space-y-2 overflow-y-auto" role="list">
            {visible.map((item) => {
              const selected = item.id === selectedId;
              return (
                <li key={item.id}>
                  <div
                    className={cn(
                      "rounded-lg border px-3 py-3 transition",
                      selected
                        ? "border-zinc-500 bg-elevated"
                        : "border-border bg-elevated/30 hover:border-zinc-600",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                      onClick={() => onSelect(item.id)}
                      aria-pressed={selected}
                      aria-label={`Open details for ${item.fullName}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {item.fullName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.owner} ·{" "}
                            {new Date(item.createdAt).toLocaleString()} ·{" "}
                            {item.primaryLanguage ?? "Unknown"} ·{" "}
                            {item.framework ?? "—"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-muted-foreground">Health</p>
                          <p className="text-sm font-semibold text-foreground">
                            {item.healthScore ?? "—"}
                          </p>
                          {item.mock ? (
                            <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-amber-300">
                              Mock
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => onReimport(item)}
                        aria-label={`Re-import ${item.fullName}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-import
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => onDelete(item.id)}
                        aria-label={`Delete ${item.fullName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
