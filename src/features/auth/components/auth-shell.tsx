import Link from "next/link";
import type { ReactNode } from "react";
import { Bot } from "lucide-react";
import { siteConfig } from "@/config/site";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <Link
            href="/"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
          >
            <Bot className="h-5 w-5" aria-hidden />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          {children}
        </div>

        {footer ? (
          <div className="text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {siteConfig.name} · secure Auth.js sessions
          </p>
        )}
      </div>
    </div>
  );
}
