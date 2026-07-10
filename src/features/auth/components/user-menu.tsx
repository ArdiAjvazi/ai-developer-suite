"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

export function UserMenu() {
  const { data } = useSession();
  const label = data?.user?.name ?? data?.user?.email ?? "You";
  const initials = label.slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-elevated text-[10px] font-semibold text-muted-foreground"
        title={label}
      >
        {initials}
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
      >
        <LogOut className="h-3 w-3" />
        Sign out
      </button>
    </div>
  );
}
