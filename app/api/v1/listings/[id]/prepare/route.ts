/**
 * SnapR API v1 — Prepare Listing
 * POST /api/v1/listings/:id/prepare — Trigger AI preparation pipeline
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'
import { z } from 'zod'

function extractListingId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/')
  return segments[4] ?? null
}

export const POST = withApiAuth(async (ctx) => {
  const listingId = extractListingId(ctx.request)
  if (!listingId || !z.string().uuid().safeParse(listingId).success) {
    return NextResponse.json(
      { error: { message: 'Invalid listing ID', code: 'validation_error' } },
      { status: 400 }
    )
  }

  // Verify listing belongs to user and has photos
  const { data: listing } = await ctx.supabase
    .from('listings')
    .select('id, preparation_status')
    .eq('id', listingId)
    .eq('user_id', ctx.userId)
    .single()

  if (!listing) {
    return NextResponse.json(
      { error: { message: 'Listing not found', code: 'not_found' } },
      { status: 404 }
    )
  }

  if (listing.preparation_status === 'processing') {
    return NextResponse.json(
      { error: { message: 'Listing is already being prepared', code: 'conflict' } },
      { status: 409 }
    )
  }

  const { count: photoCount } = await ctx.supabase
    .from('photos')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)

  if (!photoCount || photoCount === 0) {
    return NextResponse.json(
      { error: { message: 'Listing has no photos to prepare', code: 'validation_error' } },
      { status: 400 }
    )
  }

  // Create preparation job
  const { data: job, error: jobError } = await ctx.supabase
    .from('jobs')
    .insert({
      listing_id: listingId,
      user_id: ctx.userId,
      status: 'queued',
      type: 'preparation',
    })
    .select('id, status')
    .single()

  if (jobError) {
    return NextResponse.json(
      { error: { message: 'Failed to create preparation job', code: 'internal_error' } },
      { status: 500 }
    )
  }

  // Update listing status
  const { error: updateError } = await ctx.supabase
    .from('listings')
    .update({ preparation_status: 'processing' })
    .eq('id', listingId)

  if (updateError) {
    // Rollback: mark the job as failed since listing status couldn't be updated
    await ctx.supabase
      .from('jobs')
      .update({ status: 'failed' })
      .eq('id', job.id)

    return NextResponse.json(
      { error: { message: 'Failed to update listing status', code: 'internal_error' } },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: { job_id: job.id, status: job.status, message: 'Preparation queued' },
  }, { status: 202 })
})
