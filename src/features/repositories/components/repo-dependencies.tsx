"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import type { RepoDependency } from "@/features/repositories/types";

type RepoDependenciesProps = {
  dependencies: RepoDependency[];
};

export function RepoDependencies({ dependencies }: RepoDependenciesProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dependencies;
    return dependencies.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.purpose.toLowerCase().includes(q) ||
        d.manager.toLowerCase().includes(q),
    );
  }, [dependencies, query]);

  const visible = filtered.slice(0, 60);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dependency analysis</CardTitle>
        <CardDescription>
          Detected from package manifests · {dependencies.length} total
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dependencies…"
          aria-label="Search dependencies"
        />
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No dependencies matched your search.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-border bg-elevated/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Dependency</th>
                  <th className="px-3 py-2 font-medium">Version</th>
                  <th className="px-3 py-2 font-medium">Purpose</th>
                  <th className="px-3 py-2 font-medium">Manager</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((dep) => (
                  <tr
                    key={`${dep.manager}:${dep.name}`}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-foreground">{dep.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{dep.version}</td>
                    <td className="px-3 py-2 text-muted-foreground">{dep.purpose}</td>
                    <td className="px-3 py-2 text-muted-foreground">{dep.manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > visible.length ? (
              <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                Showing {visible.length} of {filtered.length} (virtualized window)
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
