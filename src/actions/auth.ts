"use server";

import { hash as bcryptHash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from "@/features/auth/schemas/auth";
import { signIn } from "@/server/auth";
import { buildAppOrigin, sendAuthEmail } from "@/server/auth/mail";
import { createRawToken, hashToken, tokenExpiry } from "@/server/auth/tokens";
import { prisma } from "@/server/db";

export type AuthActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
};

function formError(error: string): AuthActionResult {
  return { ok: false, error };
}

function formSuccess(message: string): AuthActionResult {
  return { ok: true, message };
}

export async function loginAction(
  raw: LoginInput,
): Promise<AuthActionResult | void> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return formError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, emailVerified: true },
  });

  if (existing?.passwordHash && !existing.emailVerified) {
    return formError(
      "Verify your email before signing in. Check your inbox for the link.",
    );
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return formError("Invalid email or password.");
      }

      return formError(
        error.message?.includes("secret")
          ? "Auth server misconfigured. Check AUTH_SECRET and AUTH_URL."
          : "Authentication failed. Please try again.",
      );
    }

    // Next.js redirect() throws; rethrow so navigation works.
    throw error;
  }
}

export async function registerAction(
  raw: RegisterInput,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return formError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const email = parsed.data.email.toLowerCase().trim();
  const name = parsed.data.name.trim();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return formError("An account with this email already exists.");
  }

  const passwordHash = await bcryptHash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "USER",
      projects: {
        create: {
          name: "Default Project",
          description: "Auto-created workspace project",
        },
      },
    },
    select: { id: true, email: true },
  });

  const rawToken = createRawToken();
  const token = hashToken(rawToken);
  const expires = tokenExpiry(24);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const origin = buildAppOrigin();
  const verifyUrl = `${origin}/verify-email?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

  try {
    await sendAuthEmail({
      to: email,
      subject: "Verify your CodePilot AI email",
      text: `Welcome to CodePilot AI.\n\nVerify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
      html: `<p>Welcome to CodePilot AI.</p><p><a href="${verifyUrl}">Verify your email</a></p><p>This link expires in 24 hours.</p>`,
    });
  } catch (error) {
    console.error("[auth] verification email failed", error);
    return formError(
      "Account created, but we could not send the verification email. Try again later.",
    );
  }

  void user;
  return formSuccess(
    "Account created. Check your email for a verification link before signing in.",
  );
}

export async function requestPasswordResetAction(
  raw: ForgotPasswordInput,
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return formError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const email = parsed.data.email.toLowerCase().trim();
  const genericMessage =
    "If an account exists for that email, a reset link has been sent.";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  // Always return the same message to avoid account enumeration.
  if (!user?.passwordHash) {
    return formSuccess(genericMessage);
  }

  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  const rawToken = createRawToken();
  const token = hashToken(rawToken);
  const expiresAt = tokenExpiry(1);

  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expiresAt,
      userId: user.id,
    },
  });

  const origin = buildAppOrigin();
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendAuthEmail({
      to: email,
      subject: "Reset your CodePilot AI password",
      text: `Reset your password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
      html: `<p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
    });
  } catch (error) {
    console.error("[auth] reset email failed", error);
    return formError("Could not send reset email. Please try again later.");
  }

  return formSuccess(genericMessage);
}

export async function resetPasswordAction(
  raw: ResetPasswordInput,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return formError(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const hashed = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashed },
  });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    return formError("This reset link is invalid or has expired.");
  }

  const user = await prisma.user.findUnique({
    where: { email: record.email },
    select: { id: true },
  });

  if (!user) {
    return formError("This reset link is invalid or has expired.");
  }

  const passwordHash = await bcryptHash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
      },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { email: record.email },
    }),
  ]);

  return formSuccess("Password updated. You can sign in with your new password.");
}

export async function verifyEmailAction(
  raw: VerifyEmailInput & { email?: string },
): Promise<AuthActionResult> {
  const parsed = verifyEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return formError(parsed.error.issues[0]?.message ?? "Invalid token.");
  }

  const hashed = hashToken(parsed.data.token);
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || record.expires.getTime() < Date.now()) {
    return formError("This verification link is invalid or has expired.");
  }

  if (raw.email && raw.email.toLowerCase().trim() !== record.identifier) {
    return formError("This verification link is invalid or has expired.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    }),
  ]);

  return formSuccess("Email verified. You can sign in now.");
}

/** Convenience redirect used by pages after successful password reset. */
export async function redirectToLogin(): Promise<void> {
  redirect("/login");
}
