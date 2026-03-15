/**
 * SnapR API v1 — Listing Photos
 * GET /api/v1/listings/:id/photos — List photos for a listing
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'
import { z } from 'zod'

function extractListingId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/')
  return segments[4] ?? null
}

export const GET = withApiAuth(async (ctx) => {
  const listingId = extractListingId(ctx.request)
  if (!listingId || !z.string().uuid().safeParse(listingId).success) {
    return NextResponse.json(
      { error: { message: 'Invalid listing ID', code: 'validation_error' } },
      { status: 400 }
    )
  }

  // Verify listing belongs to user
  const { data: listing } = await ctx.supabase
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .eq('user_id', ctx.userId)
    .single()

  if (!listing) {
    return NextResponse.json(
      { error: { message: 'Listing not found', code: 'not_found' } },
      { status: 404 }
    )
  }

  const { data: photos, error } = await ctx.supabase
    .from('photos')
    .select('id, raw_url, processed_url, variant, status, created_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: { message: 'Failed to fetch photos', code: 'internal_error' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: photos ?? [] })
})
