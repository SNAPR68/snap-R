import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================
// Hybrid rate limiter: Upstash Redis when configured, in-memory fallback
// ============================================

const hasRedis = Boolean(process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN);

// Upstash Redis rate limiter (distributed, production-grade)
let redisLimiter: Ratelimit | null = null;
if (hasRedis) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  });
  redisLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'snapr_rl',
  });
}

// In-memory fallback (single-instance, resets on cold start)
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

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  // Redis limiter is async but middleware needs sync — use in-memory for now
  // and let Redis handle it via the async path below
  // For edge middleware compatibility, always use in-memory synchronously
  return checkInMemory(identifier, limit, windowMs);
}

/**
 * Async rate limit check — uses Upstash Redis when configured.
 * Call this from API routes (not middleware) for distributed rate limiting.
 */
export async function checkRateLimitAsync(
  identifier: string,
  limit: number = 100,
  _windowMs: number = 60000
): Promise<{ success: boolean; remaining: number }> {
  if (redisLimiter) {
    try {
      const result = await redisLimiter.limit(identifier, { rate: limit });
      return { success: result.success, remaining: result.remaining };
    } catch {
      // Redis failure — fall back to in-memory
      return checkInMemory(identifier, limit, _windowMs);
    }
  }
  return checkInMemory(identifier, limit, _windowMs);
}
