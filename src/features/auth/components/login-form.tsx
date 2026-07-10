"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";

type LoginFormProps = {
  githubEnabled: boolean;
};

export function LoginForm({ githubEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("demo@codepilot.ai");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(
    errorParam ? "Authentication failed. Please try again." : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-sm font-bold text-background">
          CP
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Sign in to {siteConfig.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Use the demo credentials or connect GitHub when configured.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-medium text-muted-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-foreground outline-none ring-0 transition placeholder:text-muted-foreground/60 focus:border-zinc-500"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-xs font-medium text-muted-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm text-foreground outline-none transition focus:border-zinc-500"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex h-10 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Continue with email"}
          </button>
        </form>

        {githubEnabled ? (
          <>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl })}
              className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-elevated text-sm font-medium text-foreground transition hover:bg-zinc-800"
            >
              Continue with GitHub
            </button>
          </>
        ) : null}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Demo: <span className="text-foreground">demo@codepilot.ai</span> /{" "}
        <span className="text-foreground">password123</span>
      </p>
    </div>
  );
}
