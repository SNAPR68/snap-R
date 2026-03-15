/**
 * SnapR API v1 — Listing Status
 * GET /api/v1/listings/:id/status — Get preparation + marketing status
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

  const { data: listing, error: listingError } = await ctx.supabase
    .from('listings')
    .select('id, preparation_status, marketing_status, preparation_metadata')
    .eq('id', listingId)
    .eq('user_id', ctx.userId)
    .single()

  if (listingError || !listing) {
    return NextResponse.json(
      { error: { message: 'Listing not found', code: 'not_found' } },
      { status: 404 }
    )
  }

  // Get photo counts
  const { count: totalPhotos } = await ctx.supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)

  const { count: enhancedPhotos } = await ctx.supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)
    .not('processed_url', 'is', null)

  // Get marketing job if exists
  const { data: marketingJob } = await ctx.supabase
    .from('marketing_jobs')
    .select('id, status, description_status, captions_status, mls_status, property_site_status, scheduled_posts_status, total_cost_cents, started_at, completed_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    data: {
      preparation_status: listing.preparation_status,
      marketing_status: listing.marketing_status,
      total_photos: totalPhotos ?? 0,
      enhanced_photos: enhancedPhotos ?? 0,
      marketing_job: marketingJob ?? null,
    },
  })
})
