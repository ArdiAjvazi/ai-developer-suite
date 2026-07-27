import { createHash, randomBytes } from "node:crypto";

export function createRawToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/** Store only hashed tokens in the database. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenExpiry(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
