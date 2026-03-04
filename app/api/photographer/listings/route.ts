/**
 * SnapR API — Photographer Listings
 * ==================================
 * GET: All listings for the authenticated photographer, with delivery link stats
 * Returns listings owned by the user, enriched with per-listing delivery status
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const status = url.searchParams.get('status') // preparation_status filter

    const admin = adminSupabase()

    // Fetch listings
    let query = admin
      .from('listings')
      .select(`
        id, title, address, city, state, price,
        preparation_status, marketing_status,
        created_at, updated_at,
        photos(id, processed_url, variant, display_order)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('preparation_status', status)

    const { data: listings, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fetch delivery links for all listings in one query
    const listingIds = (listings || []).map(l => l.id)
    const { data: deliveryLinks } = await admin
      .from('delivery_links')
      .select('id, listing_id, client_name, client_email, status, download_count, viewed_at, downloaded_at, created_at')
      .eq('photographer_id', user.id)
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false })

    // Group delivery links by listing
    const linksByListing = (deliveryLinks || []).reduce<Record<string, typeof deliveryLinks>>((acc, link) => {
      if (!link) return acc
      const lid = link.listing_id as string
      if (!acc[lid]) acc[lid] = []
      acc[lid]!.push(link)
      return acc
    }, {})

    // Enrich listings with delivery stats + hero photo
    const enriched = (listings || []).map(listing => {
      const links = linksByListing[listing.id] || []
      const photos = (listing.photos as Array<{ id: string; processed_url: string; variant: string | null; display_order: number | null }> | null) || []
      const hero = photos.find(p => p.variant === 'hero') ?? photos.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]

      return {
        id: listing.id,
        title: listing.title,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        price: listing.price,
        preparation_status: listing.preparation_status,
        marketing_status: listing.marketing_status,
        created_at: listing.created_at,
        photo_count: photos.length,
        hero_url: hero?.processed_url ?? null,
        delivery: {
          total: links.length,
          sent: links.filter(l => l.viewed_at).length,
          downloaded: links.filter(l => l.downloaded_at).length,
          links: links.slice(0, 5), // preview first 5
        },
      }
    })

    return NextResponse.json({ listings: enriched, total: enriched.length })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
