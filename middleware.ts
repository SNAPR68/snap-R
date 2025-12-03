import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (use Redis for production scale)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS = {
  api: { limit: 100, window: 60000 }, // 100 requests per minute
  auth: { limit: 10, window: 60000 },  // 10 auth attempts per minute
  enhance: { limit: 30, window: 60000 }, // 30 enhancements per minute
};

function checkRateLimit(ip: string, type: keyof typeof RATE_LIMITS): boolean {
  const now = Date.now();
  const config = RATE_LIMITS[type];
  const key = `${type}:${ip}`;
  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + config.window });
    return true;
  }

  if (record.count >= config.limit) {
    return false;
  }

  record.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;

  // Rate limit API routes
  if (path.startsWith('/api/')) {
    let limitType: keyof typeof RATE_LIMITS = 'api';
    
    if (path.includes('/auth/')) {
      limitType = 'auth';
    } else if (path.includes('/enhance')) {
      limitType = 'enhance';
    }

    if (!checkRateLimit(ip, limitType)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
