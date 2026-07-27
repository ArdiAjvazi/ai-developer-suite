import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";

export const metadata: Metadata = {
  title: "Verify email",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Verify your email"
      description="Confirm your address to activate credentials sign-in."
    >
      <VerifyEmailPanel
        token={params.token?.trim()}
        email={params.email?.trim()}
      />
    </AuthShell>
  );
}
