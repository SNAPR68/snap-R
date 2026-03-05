/**
 * /api/analytics/listings
 * Per-listing analytics: engagement, leads, cost per listing
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const fromParam = url.searchParams.get('from')
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const from = fromParam || thirtyDaysAgo.toISOString()

    // Fetch listings with address info
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, address, city, state, price, preparation_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!listings || listings.length === 0) {
      return NextResponse.json({ listings: [] })
    }

    const listingIds = listings.map(l => l.id)

    // Fetch published posts per listing
    const { data: posts } = await supabase
      .from('published_posts')
      .select('listing_id, likes, comments, shares, impressions, reach')
      .in('listing_id', listingIds)
      .gte('published_at', from)

    // Fetch leads per listing
    const { data: leads } = await supabase
      .from('property_leads')
      .select('listing_id, status, score')
      .in('listing_id', listingIds)
      .gte('created_at', from)

    // Fetch marketing costs per listing
    const { data: jobs } = await supabase
      .from('marketing_jobs')
      .select('listing_id, total_cost_cents')
      .in('listing_id', listingIds)
      .gte('created_at', from)

    // Aggregate per listing
    type ListingStats = {
      id: string
      title: string
      address: string
      city: string
      state: string
      price: number | null
      preparation_status: string
      posts: number
      likes: number
      comments: number
      shares: number
      impressions: number
      reach: number
      engagement: number
      engagementRate: number
      leads: number
      qualifiedLeads: number
      costCents: number
    }

    const statsMap = new Map<string, ListingStats>()
    for (const l of listings) {
      statsMap.set(l.id, {
        id: l.id,
        title: l.title || l.address || 'Untitled',
        address: l.address || '',
        city: l.city || '',
        state: l.state || '',
        price: l.price ?? null,
        preparation_status: l.preparation_status || 'pending',
        posts: 0, likes: 0, comments: 0, shares: 0,
        impressions: 0, reach: 0, engagement: 0, engagementRate: 0,
        leads: 0, qualifiedLeads: 0, costCents: 0,
      })
    }

    for (const p of posts || []) {
      if (!p.listing_id) continue
      const s = statsMap.get(p.listing_id)
      if (!s) continue
      s.posts += 1
      s.likes += p.likes || 0
      s.comments += p.comments || 0
      s.shares += p.shares || 0
      s.impressions += p.impressions || 0
      s.reach += p.reach || 0
    }

    for (const l of leads || []) {
      if (!l.listing_id) continue
      const s = statsMap.get(l.listing_id)
      if (!s) continue
      s.leads += 1
      if (l.status && ['qualified', 'converted', 'touring', 'offer'].includes(l.status)) {
        s.qualifiedLeads += 1
      }
    }

    for (const j of jobs || []) {
      if (!j.listing_id) continue
      const s = statsMap.get(j.listing_id)
      if (!s) continue
      s.costCents += j.total_cost_cents || 0
    }

    // Compute derived metrics
    for (const s of statsMap.values()) {
      s.engagement = s.likes + s.comments + s.shares
      s.engagementRate = s.impressions > 0
        ? Math.round((s.engagement / s.impressions) * 10000) / 100
        : 0
    }

    const result = Array.from(statsMap.values())
      .sort((a, b) => b.engagement - a.engagement)

    return NextResponse.json({ listings: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Analytics/Listings] Error:', message)
    return NextResponse.json({ error: 'Failed to fetch listing analytics' }, { status: 500 })
  }
}
