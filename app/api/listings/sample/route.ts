/**
 * Create a sample listing with demo photos for first-time users.
 * One sample per user — subsequent calls return the existing one.
 * Uses title prefix "Sample:" as marker since there's no is_sample column.
 */

export const dynamic = 'force-dynamic'

import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const SAMPLE_TITLE = 'Sample: Modern Luxury Estate'

const SAMPLE_LISTING = {
  title: SAMPLE_TITLE,
  address: '123 Demo Boulevard',
  city: 'Beverly Hills',
  state: 'CA',
  postal_code: '90210',
  description: 'This is a sample listing to help you explore SnapR. Try AI enhancement, generate marketing content, and see the full platform in action.',
  marketing_status: 'Coming Soon',
}

/** Demo photos from the public gallery (already in /public/) */
const SAMPLE_PHOTOS = [
  { raw_url: '/gallery/sky-before.jpg', variant: 'exterior' },
  { raw_url: '/gallery/twilight-before.jpg', variant: 'exterior' },
  { raw_url: '/gallery/staging-before.jpg', variant: 'interior' },
  { raw_url: '/gallery/declutter-before.jpg', variant: 'interior' },
  { raw_url: '/gallery/hdr-before.jpg', variant: 'interior' },
  { raw_url: '/gallery/lawn-before.jpg', variant: 'exterior' },
]

export async function POST(request: NextRequest) {
  try {
    // Guard: no body expected for this endpoint
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      // Try to parse and reject if body is present
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return NextResponse.json(
          { error: 'No request body expected' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminSupabase()

    // Check if user already has a sample listing (by title prefix)
    const { data: existing } = await admin
      .from('listings')
      .select('id')
      .eq('user_id', user.id)
      .like('title', 'Sample:%')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ listingId: existing.id, existing: true })
    }

    // Create the sample listing
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .insert({
        ...SAMPLE_LISTING,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (listingError || !listing) {
      logger.error('[SampleListing] Failed to create:', listingError)
      return NextResponse.json({ error: 'Failed to create sample listing' }, { status: 500 })
    }

    // Add sample photos
    const photoRows = SAMPLE_PHOTOS.map((photo, i) => ({
      listing_id: listing.id,
      user_id: user.id,
      raw_url: photo.raw_url,
      variant: photo.variant,
      status: 'uploaded',
      sort_order: i,
    }))

    const { error: photosError } = await admin
      .from('photos')
      .insert(photoRows)

    if (photosError) {
      logger.error('[SampleListing] Failed to add photos:', photosError)
    }

    return NextResponse.json({
      listingId: listing.id,
      existing: false,
      photosAdded: SAMPLE_PHOTOS.length,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[SampleListing] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
