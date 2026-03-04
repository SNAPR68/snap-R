/**
 * POST /api/deliver/event
 * Records a delivery event (viewed, downloaded, downloaded_single)
 * Called from the public /deliver/[token] client page — no auth required.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminSupabase } from '@/lib/supabase/admin'

const schema = z.object({
  deliveryId: z.string().uuid(),
  listingId: z.string().uuid(),
  eventType: z.enum(['viewed', 'downloaded', 'downloaded_single']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { deliveryId, listingId, eventType } = parsed.data
    const admin = adminSupabase()

    // Verify delivery link exists and is active
    const { data: link } = await admin
      .from('delivery_links')
      .select('id, status, download_count, downloaded_at')
      .eq('id', deliveryId)
      .single()

    if (!link || link.status !== 'active') {
      return NextResponse.json({ error: 'Invalid delivery' }, { status: 404 })
    }

    // Insert event
    await admin.from('delivery_events').insert({
      delivery_link_id: deliveryId,
      listing_id: listingId,
      event_type: eventType,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    })

    // Update delivery_links stats
    if (eventType === 'downloaded' || eventType === 'downloaded_single') {
      const updates: Record<string, unknown> = {
        download_count: (link.download_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      }
      if (!link.downloaded_at) {
        updates.downloaded_at = new Date().toISOString()
      }
      await admin.from('delivery_links').update(updates).eq('id', deliveryId)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
