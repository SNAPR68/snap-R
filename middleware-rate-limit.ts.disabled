// Rate limiting using in-memory store (for production, use Redis)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);

  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false; // Rate limited
  }

  record.count++;
  return true;
}
