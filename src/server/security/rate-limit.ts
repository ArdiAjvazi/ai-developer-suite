type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();

/**
 * Simple in-memory rate limiter (per process).
 * Suitable for single-instance deployments; swap for Redis in multi-instance prod.
 */
export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= input.limit) {
    return { allowed: false, retryAfterMs: Math.max(0, existing.resetAt - now) };
  }

  existing.count += 1;
  buckets.set(input.key, existing);
  return { allowed: true, retryAfterMs: 0 };
}
