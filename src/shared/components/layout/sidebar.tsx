"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { mainNav, secondaryNav } from "@/shared/lib/navigation";
import { siteConfig } from "@/config/site";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={onClose}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-[11px] font-bold tracking-tight text-background">
              CP
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Workspace
            </p>
            {mainNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-elevated text-foreground"
                      : "text-muted-foreground hover:bg-elevated/60 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="font-medium">{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto space-y-0.5">
            <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Account
            </p>
            {secondaryNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-elevated text-foreground"
                      : "text-muted-foreground hover:bg-elevated/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-lg border border-border bg-elevated/50 px-3 py-2.5">
            <p className="text-xs font-medium text-foreground">Foundation</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Phase 1 · Prisma + Auth
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
