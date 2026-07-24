import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getEnv } from "@/config/runtime-env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const secret = getEnv("SETTINGS_ENCRYPTION_KEY");
  if (!secret || secret.length < 32) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY must be set to a secret of at least 32 characters.",
    );
  }
  // Derive a stable 32-byte key without storing the raw secret format.
  return createHash("sha256").update(secret).digest();
}

/** Encrypt plaintext with AES-256-GCM. Returns `iv:tag:ciphertext` (base64). */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/** Decrypt a value produced by `encryptSecret`. Server-side only. */
export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload.");
  }
  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Mask a secret for safe UI display, e.g. sk-****************************X9aF */
export function maskSecret(hint: string | null | undefined, prefix = "sk"): string {
  const last = (hint ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(-4);
  if (!last) return "••••••••••••••••";
  return `${prefix}-****************************${last}`;
}

export function secretHint(value: string): string {
  return value.slice(-4);
}
