import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { getOAuthProviderFlags } from "@/server/auth/oauth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  const { github, google } = getOAuthProviderFlags();

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with email or connect an OAuth provider."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-cyan-300 hover:text-cyan-200"
          >
            Create one
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Loading…</div>
        }
      >
        <LoginForm githubEnabled={github} googleEnabled={google} />
      </Suspense>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Demo: <span className="text-foreground">demo@codepilot.ai</span> /{" "}
        <span className="text-foreground">password123</span>
      </p>
    </AuthShell>
  );
}
