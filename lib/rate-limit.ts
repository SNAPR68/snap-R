import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { checkInMemoryRateLimit, checkRateLimit as checkRateLimitEdge } from './rate-limit-edge';

// Re-export the edge-safe sync limiter so existing Node-runtime callers
// (app/api/*, non-middleware) don't need to change imports.
export const checkRateLimit = checkRateLimitEdge;

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

/**
 * Async rate limit check — uses Upstash Redis when configured.
 * Call this from API routes (not middleware) for distributed rate limiting.
 * Creates per-config Redis limiters lazily and caches them.
 * Falls back to the edge-safe in-memory limiter when Redis is unavailable.
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
      return checkInMemoryRateLimit(identifier, limit, windowMs);
    }
  }
  return checkInMemoryRateLimit(identifier, limit, windowMs);
}

/**
 * Per-user rate limit for AI-heavy routes.
 * Uses user ID + route as identifier (vs IP-based for general limits).
 * Prevents a single user from burning excessive AI credits.
 */
export async function checkRateLimitPerUser(
  userId: string,
  route: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ success: boolean; remaining: number }> {
  const identifier = `user:${userId}:${route}`;
  return checkRateLimitAsync(identifier, limit, windowMs);
}
