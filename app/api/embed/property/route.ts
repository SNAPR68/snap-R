import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const querySchema = z.object({
  listingId: z.string().uuid(),
})

/**
 * GET /api/embed/property?listingId=...
 * Public endpoint for property card embed widget.
 * Returns listing details + hero photo for the mini property card.
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

    // Verify listing has a published property site
    const { data: site } = await supabase
      .from('property_sites')
      .select('slug')
      .eq('listing_id', listingId)
      .eq('is_published', true)
      .single()

    if (!site) {
      return NextResponse.json({ error: 'Listing not found or not published' }, { status: 404 })
    }

    // Fetch listing details
    const { data: listing } = await supabase
      .from('listings')
      .select('id, title, address, price, bedrooms, bathrooms, sqft, hero_photo_id')
      .eq('id', listingId)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Fetch hero photo URL
    let heroUrl: string | null = null
    if (listing.hero_photo_id) {
      const { data: heroPhoto } = await supabase
        .from('photos')
        .select('processed_url, raw_url')
        .eq('id', listing.hero_photo_id)
        .single()
      heroUrl = heroPhoto?.processed_url ?? heroPhoto?.raw_url ?? null
    }

    return NextResponse.json({
      property: {
        title: listing.title ?? 'Untitled Property',
        address: listing.address ?? '',
        price: listing.price,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sqft: listing.sqft,
        hero_url: heroUrl,
        property_site_url: `https://snap-r.com/p/${site.slug}`,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Embed/Property] GET error:', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
