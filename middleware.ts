import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

// ── Rate limit configuration per endpoint ──────────────────────────
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/enhance': { limit: 10, windowMs: 60_000 },
  '/api/analyze': { limit: 20, windowMs: 60_000 },
  '/api/upload': { limit: 30, windowMs: 60_000 },
  '/api/contact': { limit: 3, windowMs: 60_000 },
  '/api/stripe': { limit: 10, windowMs: 60_000 },
  '/api/auth': { limit: 5, windowMs: 60_000 },
  '/api/log-error': { limit: 10, windowMs: 60_000 },
}
const DEFAULT_RATE_LIMIT = { limit: 100, windowMs: 60_000 }

// ── Suspicious bot patterns ────────────────────────────────────────
const SUSPICIOUS_PATTERNS = [
  /\.env/i,
  /\.git/i,
  /wp-admin/i,
  /wp-login/i,
  /phpinfo/i,
  /\.php$/i,
  /\/admin.*login/i,
]

function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } {
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      return config
    }
  }
  return DEFAULT_RATE_LIMIT
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── 1. Block suspicious bot patterns ───────────────────────────
  if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(pathname))) {
    console.warn(`[Middleware] Blocked suspicious request: ${pathname}`)
    return new NextResponse('Not Found', { status: 404 })
  }

  // ── 2. Rate limiting for API routes ────────────────────────────
  if (pathname.startsWith('/api')) {
    // Skip rate limiting for cron endpoints (they have CRON_SECRET auth)
    if (pathname.startsWith('/api/cron')) {
      return NextResponse.next()
    }

    const ip = getClientIp(request)
    // Group by endpoint prefix: /api/enhance/whatever → /api/enhance
    const endpointKey = '/' + pathname.split('/').slice(1, 3).join('/')
    const identifier = `${ip}:${endpointKey}`
    const config = getRateLimitConfig(pathname)
    const { success, remaining } = checkRateLimit(identifier, config.limit, config.windowMs)

    if (!success) {
      console.warn(`[Middleware] Rate limit exceeded: ${identifier}`)
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please slow down and try again later',
          retryAfter: Math.ceil(config.windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(config.windowMs / 1000)),
            'X-RateLimit-Limit': String(config.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // Add rate limit headers to successful API responses
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(config.limit))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  }

  // ── 3. Supabase auth for dashboard/auth routes ─────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes: redirect to login if not authenticated
  if (!user) {
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/onboarding')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Auth pages: redirect to dashboard if already authenticated
  if (user) {
    if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Auth-protected routes
    '/dashboard/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/onboarding/:path*',
    '/auth/login',
    '/auth/signup',
    // API routes (rate limiting + bot blocking)
    '/api/:path*',
    // Catch-all for bot blocking (exclude static assets)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$|.*\\.ico$).*)',
  ],
}
