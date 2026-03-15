/**
 * SnapR API v1 Auth Middleware
 * ============================
 * Higher-order function that wraps v1 route handlers with:
 * - API key authentication (Bearer sk_live_...)
 * - Enterprise tier validation
 * - Per-key rate limiting
 * - Usage logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, logApiUsage } from '@/lib/api-keys'
import { adminSupabase } from '@/lib/supabase/admin'
import { checkRateLimitAsync } from '@/lib/rate-limit'
import { getPlanLimits } from '@/lib/content/limits'

export interface ApiContext {
  userId: string
  keyId: string
  scopes: string[]
  supabase: ReturnType<typeof adminSupabase>
  request: NextRequest
}

type ApiHandler = (context: ApiContext) => Promise<NextResponse>

/**
 * Wrap a v1 route handler with API key auth, tier gating, rate limiting, and usage logging.
 */
export function withApiAuth(handler: ApiHandler) {
  return async (request: NextRequest, routeContext?: { params?: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const startTime = Date.now()
    const pathname = request.nextUrl.pathname
    const method = request.method

    // 1. Extract Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer sk_live_')) {
      return NextResponse.json(
        { error: { message: 'Missing or invalid API key. Use Authorization: Bearer sk_live_...', code: 'unauthorized' } },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7) // Remove 'Bearer '

    // 2. Validate API key
    const validation = await validateApiKey(token)
    if (!validation.valid) {
      return NextResponse.json(
        { error: { message: 'Invalid or expired API key', code: 'invalid_key' } },
        { status: 401 }
      )
    }

    // 3. Check enterprise tier
    const supabase = adminSupabase()
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', validation.userId)
      .single()

    const tier = profile?.subscription_tier ?? 'free'
    const limits = getPlanLimits(tier)

    if (!limits.canAccessApi) {
      return NextResponse.json(
        { error: { message: 'API access requires an Enterprise plan. Upgrade at snap-r.com/pricing', code: 'plan_required' } },
        { status: 403 }
      )
    }

    // 4. Per-key rate limiting
    const endpointKey = '/' + pathname.split('/').slice(1, 4).join('/')
    const rateLimitId = `apikey:${validation.keyId}:${endpointKey}`
    const { success: rateLimitOk, remaining } = await checkRateLimitAsync(
      rateLimitId,
      validation.rateLimitPerMinute,
      60_000
    )

    if (!rateLimitOk) {
      const response = NextResponse.json(
        { error: { message: 'Rate limit exceeded', code: 'rate_limited', retryAfter: 60 } },
        { status: 429 }
      )
      response.headers.set('Retry-After', '60')
      response.headers.set('X-RateLimit-Limit', String(validation.rateLimitPerMinute))
      response.headers.set('X-RateLimit-Remaining', '0')

      logApiUsage(validation.keyId, validation.userId, endpointKey, method, 429, Date.now() - startTime)
      return response
    }

    // 5. Resolve route params if present
    if (routeContext?.params) {
      await routeContext.params
    }

    // 6. Execute handler
    try {
      const response = await handler({
        userId: validation.userId,
        keyId: validation.keyId,
        scopes: validation.scopes,
        supabase,
        request,
      })

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(validation.rateLimitPerMinute))
      response.headers.set('X-RateLimit-Remaining', String(remaining))

      // Log usage (fire-and-forget)
      logApiUsage(validation.keyId, validation.userId, endpointKey, method, response.status, Date.now() - startTime)

      return response
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      logApiUsage(validation.keyId, validation.userId, endpointKey, method, 500, Date.now() - startTime)
      return NextResponse.json(
        { error: { message, code: 'internal_error' } },
        { status: 500 }
      )
    }
  }
}
