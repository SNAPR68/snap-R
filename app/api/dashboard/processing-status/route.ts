import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

import { logger } from '@/lib/logger';
/**
 * GET /api/dashboard/processing-status
 * Lightweight polling endpoint for processing container.
 * Returns:
 *   - items: listings currently preparing or processing marketing
 *   - recentlyCompleted: listings that completed marketing in last 5 minutes (for toast detection)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch currently processing items
    const { data: processingListings } = await supabase
      .from('listings')
      .select('id, title, preparation_status, marketing_status')
      .eq('user_id', user.id)
      .or('preparation_status.eq.preparing,marketing_status.eq.processing')
      .limit(200)

    // Fetch recently completed marketing (last 5 minutes) for toast trigger
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentJobs } = await supabase
      .from('marketing_jobs')
      .select('listing_id, status, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('updated_at', fiveMinutesAgo)

    // Get listing titles for recently completed
    let recentlyCompleted: Array<{ id: string; title: string }> = []
    if (recentJobs && recentJobs.length > 0) {
      const listingIds = recentJobs.map(j => j.listing_id)
      const { data: completedListings } = await supabase
        .from('listings')
        .select('id, title')
        .in('id', listingIds)

      recentlyCompleted = (completedListings || []).map(l => ({
        id: l.id,
        title: l.title || 'Untitled',
      }))
    }

    // Build processing items (no thumbnail to keep it lightweight)
    const items = (processingListings || []).map(l => ({
      id: l.id,
      title: l.title || 'Untitled',
      thumbnail: null,
      preparation_status: l.preparation_status,
      marketing_status: l.marketing_status,
    }))

    return NextResponse.json({ items, recentlyCompleted })
  } catch (error: unknown) {
    logger.error('Error fetching processing status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
