import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const querySchema = z.object({
  listingId: z.string().uuid(),
})

/**
 * GET /api/embed/photos?listingId=...
 * Public endpoint for embed widgets — returns photos with raw + processed URLs.
 * Uses adminSupabase (no auth required — validates listing has a published property site).
 */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = querySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 })
    }

    const { listingId } = parsed.data
    const supabase = adminSupabase()

    // Verify listing exists and has a published property site
    const { data: site } = await supabase
      .from('property_sites')
      .select('id')
      .eq('listing_id', listingId)
      .eq('is_published', true)
      .single()

    if (!site) {
      return NextResponse.json({ error: 'Listing not found or not published' }, { status: 404 })
    }

    // Fetch photos with both raw and processed URLs
    const { data: photos } = await supabase
      .from('photos')
      .select('id, raw_url, processed_url, variant, sort_order')
      .eq('listing_id', listingId)
      .not('processed_url', 'is', null)
      .order('sort_order', { ascending: true })

    return NextResponse.json({
      photos: (photos ?? []).map(p => ({
        id: p.id,
        raw_url: p.raw_url,
        processed_url: p.processed_url,
        variant: p.variant,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Embed/Photos] GET error:', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
