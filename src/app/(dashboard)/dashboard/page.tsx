import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  FileDown,
  FileText,
  FolderGit2,
  ScanSearch,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/shared/components/ui/page-header";

export const metadata: Metadata = {
  title: "Dashboard",
};

const quickActions = [
  {
    title: "Code Review",
    description: "Analyze repositories with AI",
    href: "/reviews",
    icon: ScanSearch,
  },
  {
    title: "Documentation",
    description: "Generate structured docs",
    href: "/documentation",
    icon: BookOpen,
  },
  {
    title: "README Generator",
    description: "Ship polished READMEs",
    href: "/readme",
    icon: FileText,
  },
  {
    title: "Repositories",
    description: "Import & analyze GitHub repos",
    href: "/repositories",
    icon: FolderGit2,
  },
  {
    title: "PDF Reports",
    description: "Export branded analysis PDFs",
    href: "/reports",
    icon: FileDown,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your AI developer command center. Import a repo, run reviews, and export reports from one workspace."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Repositories", value: "0" },
          { label: "Reviews", value: "0" },
          { label: "Reports", value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface px-4 py-4"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Quick actions</h2>
          <span className="text-xs text-muted-foreground">v1.0 modules</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-zinc-600 hover:bg-elevated"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-elevated">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mt-3 text-sm font-medium text-foreground">
                  {action.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-foreground">Recent activity</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No activity yet. Import a GitHub repository to get started.
        </p>
        <Link
          href="/repositories"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
        >
          Import repository
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
