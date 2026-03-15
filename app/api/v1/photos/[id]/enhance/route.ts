/**
 * SnapR API v1 — Enhance Photo
 * POST /api/v1/photos/:id/enhance — Apply AI enhancement tool to a photo
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 180

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'
import { enhanceSchema, parseBody } from '@/lib/validation/schemas'
import { z } from 'zod'

function extractPhotoId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/')
  // /api/v1/photos/[id]/enhance → segments[4]
  return segments[4] ?? null
}

export const POST = withApiAuth(async (ctx) => {
  const photoId = extractPhotoId(ctx.request)
  if (!photoId || !z.string().uuid().safeParse(photoId).success) {
    return NextResponse.json(
      { error: { message: 'Invalid photo ID', code: 'validation_error' } },
      { status: 400 }
    )
  }

  const body = await ctx.request.json()
  const parsed = parseBody(enhanceSchema, { ...body, photoId })
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: parsed.error, code: 'validation_error', details: parsed.details } },
      { status: 400 }
    )
  }

  // Verify photo belongs to user
  const { data: photo } = await ctx.supabase
    .from('photos')
    .select('id, listing_id, raw_url, processed_url')
    .eq('id', photoId)
    .single()

  if (!photo) {
    return NextResponse.json(
      { error: { message: 'Photo not found', code: 'not_found' } },
      { status: 404 }
    )
  }

  // Verify listing ownership
  const { data: listing } = await ctx.supabase
    .from('listings')
    .select('id')
    .eq('id', photo.listing_id)
    .eq('user_id', ctx.userId)
    .single()

  if (!listing) {
    return NextResponse.json(
      { error: { message: 'Photo not found', code: 'not_found' } },
      { status: 404 }
    )
  }

  // Forward to internal enhance endpoint
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://snap-r.com'
  const enhanceResponse = await fetch(`${baseUrl}/api/enhance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'x-admin-key': process.env.WORKER_ADMIN_KEY || '',
    },
    body: JSON.stringify(parsed.data),
    signal: AbortSignal.timeout(150000),
  })

  let result: Record<string, unknown>
  try {
    result = await enhanceResponse.json()
  } catch {
    return NextResponse.json(
      { error: { message: 'Enhancement service returned non-JSON response', code: 'enhancement_error' } },
      { status: 502 }
    )
  }

  if (!enhanceResponse.ok) {
    const message = typeof result.error === 'string' ? result.error : 'Enhancement failed'
    return NextResponse.json(
      { error: { message, code: 'enhancement_error' } },
      { status: enhanceResponse.status }
    )
  }

  return NextResponse.json({ data: result })
})
