// ============================================
// Edge-safe rate limiter — in-memory only, no Upstash imports.
// ============================================
//
// IMPORTANT: This module MUST NOT import `@upstash/redis` or
// `@upstash/ratelimit`. Those packages use Node.js APIs (e.g. `eval`,
// `process.version`) that are disallowed in the Edge Runtime, which
// causes middleware to fail to load with:
//
//   EvalError: Code generation from strings disallowed for this context
//
// Used by `middleware.ts`. For API routes (Node runtime), use the
// hybrid `checkRateLimitAsync` from `lib/rate-limit.ts`.

const rateLimit = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = Date.now();

export function checkInMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();

  // Lazy cleanup: purge expired entries every 60s
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [key, value] of rateLimit.entries()) {
      if (now > value.resetTime) {
        rateLimit.delete(key);
      }
    }
  }

  const record = rateLimit.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

/**
 * Synchronous rate limit — always uses in-memory. Edge-safe.
 * Used by `middleware.ts` (no async allowed in request path).
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60_000
): { success: boolean; remaining: number } {
  return checkInMemoryRateLimit(identifier, limit, windowMs);
}
