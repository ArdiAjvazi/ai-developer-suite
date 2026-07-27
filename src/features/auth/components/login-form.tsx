"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth";
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/schemas/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type LoginFormProps = {
  githubEnabled: boolean;
  googleEnabled: boolean;
};

export function LoginForm({ githubEnabled, googleEnabled }: LoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [formError, setFormError] = useState<string | null>(() => {
    if (!errorParam) return null;
    if (errorParam === "Configuration") {
      return "Auth server misconfigured (missing AUTH_SECRET or bad AUTH_URL).";
    }
    if (errorParam === "OAuthCallback" || errorParam === "OAuthSignin") {
      return "OAuth provider failed. Verify callback URLs for this domain.";
    }
    return `Authentication failed (${errorParam}). Please try again.`;
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "demo@codepilot.ai",
      password: "password123",
    },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const result = await loginAction(values);
    if (result?.error) {
      setFormError(result.error);
    }
  }

  const oauthCallback =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/dashboard";

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-red-300">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-red-300">{errors.password.message}</p>
          ) : null}
        </div>

        {formError ? (
          <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Continue with email"}
        </Button>
      </form>

      {githubEnabled || googleEnabled ? (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            {githubEnabled ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() =>
                  signIn("github", { callbackUrl: oauthCallback })
                }
              >
                Continue with GitHub
              </Button>
            ) : null}
            {googleEnabled ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() =>
                  signIn("google", { callbackUrl: oauthCallback })
                }
              >
                Continue with Google
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
