import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================
// Hybrid rate limiter: Upstash Redis when configured, in-memory fallback
// ============================================

const hasRedis = Boolean(process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN);

function getRedis(): Redis | null {
  if (!hasRedis) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  });
}

// ── Per-endpoint Redis limiters (created lazily, cached) ──────────────
const redisLimiters = new Map<string, Ratelimit>();

function getRedisLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!hasRedis) return null;

  const key = `${limit}:${windowMs}`;
  let limiter = redisLimiters.get(key);
  if (limiter) return limiter;

  const redis = getRedis();
  if (!redis) return null;

  const windowSec = Math.ceil(windowMs / 1000);
  const window = windowSec >= 3600
    ? `${Math.ceil(windowSec / 3600)} h`
    : windowSec >= 60
      ? `${Math.ceil(windowSec / 60)} m`
      : `${windowSec} s`;

  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`),
    analytics: true,
    prefix: `snapr_rl_${limit}_${windowSec}`,
  });

  redisLimiters.set(key, limiter);
  return limiter;
}

// ── In-memory fallback (single-instance, resets on cold start) ────────
const rateLimit = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = Date.now();

function checkInMemory(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();

  // Lazy cleanup: purge expired entries every 60s
  if (now - lastCleanup > 60000) {
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
 * Synchronous rate limit — always uses in-memory.
 * Used by Edge middleware (no async allowed in request path).
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  return checkInMemory(identifier, limit, windowMs);
}

/**
 * Async rate limit check — uses Upstash Redis when configured.
 * Call this from API routes (not middleware) for distributed rate limiting.
 * Creates per-config Redis limiters lazily and caches them.
 */
export async function checkRateLimitAsync(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<{ success: boolean; remaining: number }> {
  const limiter = getRedisLimiter(limit, windowMs);
  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return { success: result.success, remaining: result.remaining };
    } catch {
      // Redis failure — fall back to in-memory
      return checkInMemory(identifier, limit, windowMs);
    }
  }
  return checkInMemory(identifier, limit, windowMs);
}
