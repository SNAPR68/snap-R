import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limit configuration per endpoint type
const rateLimitConfig = {
  '/api/enhance': { requests: 10, window: 60 * 1000 }, // 10 per minute
  '/api/analyze': { requests: 20, window: 60 * 1000 }, // 20 per minute
  '/api/upload': { requests: 30, window: 60 * 1000 }, // 30 per minute
  '/api/contact': { requests: 3, window: 60 * 1000 }, // 3 per minute (spam prevention)
  '/api/stripe': { requests: 10, window: 60 * 1000 }, // 10 per minute
  '/api/auth': { requests: 5, window: 60 * 1000 }, // 5 per minute (brute force prevention)
  'default': { requests: 100, window: 60 * 1000 }, // 100 per minute default
};

// In-memory rate limit store (use Redis in production for multi-instance)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key);
    }
  }
}, 60 * 1000);

function getRateLimitConfig(pathname: string) {
  for (const [path, config] of Object.entries(rateLimitConfig)) {
    if (path !== 'default' && pathname.startsWith(path)) {
      return config;
    }
  }
  return rateLimitConfig.default;
}

function checkRateLimit(key: string, config: { requests: number; window: number }): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + config.window });
    return { allowed: true, remaining: config.requests - 1, resetIn: config.window };
  }

  if (record.count >= config.requests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: config.requests - record.count, resetIn: record.resetTime - now };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate limit API routes
  if (pathname.startsWith('/api')) {
    // Get client identifier (IP or user ID from cookie)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const key = `${ip}:${pathname.split('/').slice(0, 3).join('/')}`; // Group by endpoint prefix

    const config = getRateLimitConfig(pathname);
    const { allowed, remaining, resetIn } = checkRateLimit(key, config);

    if (!allowed) {
      // Log rate limit violation
      console.warn(`Rate limit exceeded: ${key}`);
      
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Please slow down and try again later',
          retryAfter: Math.ceil(resetIn / 1000) 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(resetIn / 1000)),
            'X-RateLimit-Limit': String(config.requests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + resetIn),
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.requests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Date.now() + resetIn));
    return response;
  }

  // Block suspicious patterns
  const suspiciousPatterns = [
    /\.env/i,
    /\.git/i,
    /wp-admin/i,
    /wp-login/i,
    /phpinfo/i,
    /\.php$/i,
    /\/admin.*login/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(pathname))) {
    console.warn(`Blocked suspicious request: ${pathname}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
