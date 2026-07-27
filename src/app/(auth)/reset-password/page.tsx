import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <AuthShell
      title="Choose a new password"
      description="Enter a strong password to finish resetting your account."
      footer={
        <>
          <Link
            href="/forgot-password"
            className="font-medium text-cyan-300 hover:text-cyan-200"
          >
            Request a new link
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
