"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { verifyEmailAction } from "@/actions/auth";

type VerifyEmailPanelProps = {
  token?: string;
  email?: string;
};

export function VerifyEmailPanel({ token, email }: VerifyEmailPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) {
      setMessage(
        email
          ? `We sent a verification link to ${email}. Open it to activate your account.`
          : "Check your inbox for a verification link to activate your account.",
      );
      return;
    }

    startTransition(async () => {
      const result = await verifyEmailAction({ token, email });
      if (!result.ok) {
        setError(result.error ?? "Verification failed.");
        return;
      }
      setMessage(result.message ?? "Email verified.");
    });
  }, [token, email]);

  return (
    <div className="space-y-4 text-center">
      {pending ? (
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {message}
        </p>
      ) : null}

      <Link
        href="/login"
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-border bg-elevated text-sm font-medium text-foreground transition hover:bg-zinc-800"
      >
        Back to sign in
      </Link>
    </div>
  );
}
