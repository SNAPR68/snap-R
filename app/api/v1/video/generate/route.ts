/**
 * SnapR API v1 — Video Generate
 * POST /api/v1/video/generate — Trigger video render
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'
import { generateVideoSchema, parseBody } from '@/lib/validation/schemas'

export const POST = withApiAuth(async (ctx) => {
  const body = await ctx.request.json()
  const parsed = parseBody(generateVideoSchema, body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error, code: 'validation_error', details: parsed.details } },
      { status: 400 }
    )
  }

  // Verify listing ownership
  const { data: listing } = await ctx.supabase
    .from('listings')
    .select('id')
    .eq('id', parsed.data.listingId)
    .eq('user_id', ctx.userId)
    .single()

  if (!listing) {
    return NextResponse.json(
      { error: { message: 'Listing not found', code: 'not_found' } },
      { status: 404 }
    )
  }

  // Forward to internal video generate endpoint
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'
  const response = await fetch(`${baseUrl}/api/video/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(parsed.data),
    signal: AbortSignal.timeout(55000),
  })

  const result = await response.json()

  if (!response.ok) {
    return NextResponse.json(
      { error: { message: result.error || 'Video generation failed', code: 'video_error' } },
      { status: response.status }
    )
  }

  return NextResponse.json({ data: result }, { status: 202 })
})
