"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/features/auth/components/user-menu";
import { mainNav, secondaryNav } from "@/shared/lib/navigation";

type TopbarProps = {
  onMenuClick: () => void;
};

function resolveTitle(pathname: string) {
  const all = [...mainNav, ...secondaryNav];
  const match = all.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.title ?? "Dashboard";
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-foreground">
          {title}
        </span>
        <span className="hidden text-muted-foreground/40 sm:inline">/</span>
        <span className="hidden truncate text-sm text-muted-foreground sm:inline">
          CodePilot AI
        </span>
      </div>

      <UserMenu />
    </header>
  );
}
