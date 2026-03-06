/**
 * API Route Handler Utilities
 *
 * Provides DRY patterns for common API route boilerplate:
 * - Auth enforcement
 * - Zod validation
 * - Structured error responses
 * - Sentry error reporting
 *
 * Usage:
 *   import { withAuth, apiError, parseBody } from '@/lib/api/handler'
 *
 *   export async function POST(request: NextRequest) {
 *     const { user, supabase } = await withAuth()
 *     if (!user) return apiError('Unauthorized', 401)
 *
 *     const body = await parseBody(request, myZodSchema)
 *     if ('error' in body) return body.error
 *
 *     // ... business logic ...
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ZodSchema, ZodError } from 'zod'
import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface AuthResult {
  user: { id: string; email?: string } | null
  supabase: SupabaseClient
}

/**
 * Authenticates the request and returns the user + supabase client.
 * Returns `user: null` if not authenticated (caller should return apiError).
 */
export async function withAuth(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, supabase }
}

/**
 * Parses and validates JSON request body against a Zod schema.
 * Returns `{ data }` on success, `{ error: NextResponse }` on failure.
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { error: apiError('Invalid JSON body', 400) }
  }

  try {
    const data = schema.parse(raw)
    return { data }
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return {
        error: NextResponse.json(
          { error: 'Validation error', details: err.flatten() },
          { status: 400 }
        ),
      }
    }
    return { error: apiError('Invalid request body', 400) }
  }
}

/**
 * Creates a standardized JSON error response.
 */
export function apiError(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status }
  )
}

/**
 * Creates a standardized JSON success response.
 */
export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Wraps an API handler with try/catch, error logging, and Sentry reporting.
 * Use for route handlers that want consistent error handling:
 *
 *   export const POST = handleApiError('my-route', async () => {
 *     const { user } = await withAuth()
 *     if (!user) return apiError('Unauthorized', 401)
 *     return apiSuccess({ ok: true })
 *   })
 */
export function handleApiError(
  source: string,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error'

      // Report to Sentry with context
      Sentry.withScope((scope) => {
        scope.setTag('api.route', source)
        scope.setExtra('url', request.url)
        scope.setExtra('method', request.method)
        if (error instanceof Error) {
          Sentry.captureException(error)
        } else {
          Sentry.captureMessage(`API error in ${source}: ${message}`)
        }
      })

      console.error(`[${source}] Unhandled error:`, message)
      return apiError('Internal server error', 500)
    }
  }
}
