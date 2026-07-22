/**
 * Snapshot server env vars during `next build` on Vercel.
 *
 * Next.js 16 / Vercel can leave custom secrets missing from `process.env` at
 * function runtime even when they are present during the build. Capturing them
 * into a traced JSON file gives Route Handlers a reliable fallback.
 *
 * Never commit the generated file — it may contain secrets.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const KEYS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "AUTH_URL",
  "NEXTAUTH_URL",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "SETTINGS_ENCRYPTION_KEY",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
];

const snapshot = {};
const present = [];

for (const key of KEYS) {
  const value = process.env[key];
  if (typeof value === "string" && value.trim().length > 0) {
    snapshot[key] = value.trim().replace(/^["']|["']$/g, "");
    present.push(key);
  }
}

const outPath = resolve(process.cwd(), ".runtime-env.json");
writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log(
  `[snapshot-runtime-env] wrote ${outPath} with ${present.length} keys: ${present.join(", ") || "(none)"}`,
);

if (process.env.VERCEL === "1" && present.length === 0) {
  console.warn(
    "[snapshot-runtime-env] WARNING: no secrets found during Vercel build. Check Project Settings → Environment Variables (Production, Build + Runtime).",
  );
}
