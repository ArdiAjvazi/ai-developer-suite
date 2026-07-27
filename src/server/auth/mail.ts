import { getEnv } from "@/config/runtime-env";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Deliver auth emails when RESEND_API_KEY is set; otherwise log the message
 * (local/dev) so links remain usable without a mail provider.
 */
export async function sendAuthEmail(payload: MailPayload): Promise<void> {
  const apiKey = getEnv("RESEND_API_KEY");
  const from =
    getEnv("AUTH_EMAIL_FROM") ??
    getEnv("EMAIL_FROM") ??
    "CodePilot AI <onboarding@resend.dev>";

  if (apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Failed to send email (${response.status}): ${body || response.statusText}`,
      );
    }
    return;
  }

  console.info(
    `[auth-mail] To: ${payload.to}\nSubject: ${payload.subject}\n${payload.text}`,
  );
}

export function buildAppOrigin(): string {
  const configured =
    getEnv("AUTH_URL") ??
    getEnv("NEXTAUTH_URL") ??
    (getEnv("VERCEL_URL") ? `https://${getEnv("VERCEL_URL")}` : undefined);

  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through
    }
  }

  return "http://localhost:3000";
}
