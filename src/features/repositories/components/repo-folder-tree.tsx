"use client";

import { useMemo, useState } from "react";
import { ChevronRight, File, Folder } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import type { RepoTreeNode } from "@/features/repositories/types";

type RepoFolderTreeProps = {
  tree: RepoTreeNode[];
  fileTypeFilter?: string;
};

function extensionOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function filterTree(
  nodes: RepoTreeNode[],
  query: string,
  fileType: string,
): RepoTreeNode[] {
  const q = query.trim().toLowerCase();
  const result: RepoTreeNode[] = [];

  for (const node of nodes) {
    if (node.type === "folder") {
      const children = filterTree(node.children ?? [], query, fileType);
      const selfMatch = !q || node.name.toLowerCase().includes(q);
      if (selfMatch || children.length > 0) {
        result.push({
          ...node,
          children: selfMatch && !q ? node.children : children,
        });
      }
      continue;
    }

    const matchesQuery = !q || node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q);
    const matchesType =
      !fileType ||
      fileType === "all" ||
      extensionOf(node.name) === fileType ||
      (fileType === "folder" ? false : true);
    if (matchesQuery && (fileType === "all" || !fileType || extensionOf(node.name) === fileType)) {
      if (fileType === "folder") continue;
      result.push(node);
    } else if (matchesQuery && matchesType && fileType !== "folder") {
      result.push(node);
    }
  }

  return result;
}

function TreeNodeRow({
  node,
  depth,
  defaultOpen,
}: {
  node: RepoTreeNode;
  depth: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen && depth < 2);
  const isFolder = node.type === "folder";

  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500",
          depth === 0 && "font-medium",
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          if (isFolder) setOpen((v) => !v);
        }}
        aria-expanded={isFolder ? open : undefined}
        aria-label={isFolder ? `${open ? "Collapse" : "Expand"} folder ${node.name}` : `File ${node.name}`}
      >
        {isFolder ? (
          <ChevronRight
            className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition", open && "rotate-90")}
            aria-hidden
          />
        ) : (
          <span className="w-3.5" />
        )}
        {isFolder ? (
          <Folder className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
        ) : (
          <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="truncate text-foreground">{node.name}</span>
      </button>
      {isFolder && open && node.children && node.children.length > 0 ? (
        <ul className="space-y-0.5" role="group">
          {node.children.slice(0, 120).map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              defaultOpen={false}
            />
          ))}
          {node.children.length > 120 ? (
            <li
              className="px-2 py-1 text-xs text-muted-foreground"
              style={{ paddingLeft: 8 + (depth + 1) * 14 }}
            >
              +{node.children.length - 120} more (lazy truncated)
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

export function RepoFolderTree({ tree }: RepoFolderTreeProps) {
  const [query, setQuery] = useState("");
  const [fileType, setFileType] = useState("all");

  const extensions = useMemo(() => {
    const set = new Set<string>();
    const walk = (nodes: RepoTreeNode[]) => {
      for (const n of nodes) {
        if (n.type === "file") {
          const ext = extensionOf(n.name);
          if (ext) set.add(ext);
        } else if (n.children) walk(n.children);
      }
    };
    walk(tree);
    return [...set].sort();
  }, [tree]);

  const filtered = useMemo(
    () => filterTree(tree, query, fileType),
    [tree, query, fileType],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Folder tree</CardTitle>
        <CardDescription>Expandable project structure with search and file-type filters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files and folders…"
            aria-label="Search files and folders"
          />
          <Select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            aria-label="Filter by file type"
          >
            <option value="all">All types</option>
            {extensions.map((ext) => (
              <option key={ext} value={ext}>
                {ext}
              </option>
            ))}
          </Select>
        </div>
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No matching files or folders.
          </p>
        ) : (
          <ul
            className="max-h-[420px] space-y-0.5 overflow-y-auto rounded-lg border border-border bg-elevated/30 p-2"
            role="tree"
            aria-label="Repository folder tree"
          >
            {filtered.slice(0, 200).map((node) => (
              <TreeNodeRow key={node.id} node={node} depth={0} defaultOpen />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
