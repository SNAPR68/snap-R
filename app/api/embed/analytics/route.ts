import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'

const eventSchema = z.object({
  widget_type: z.enum(['before-after', 'gallery', 'property']),
  listing_id: z.string().uuid(),
  event: z.enum(['impression', 'click', 'interaction']),
  referrer: z.string().max(500).optional(),
})

/**
 * POST /api/embed/analytics
 * Tracks widget impressions and interactions. No auth required.
 * Fire-and-forget — always returns 200 to avoid blocking the widget.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = eventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const { widget_type, listing_id, event, referrer } = parsed.data
    const supabase = adminSupabase()

    // Fire-and-forget insert — don't await
    void supabase
      .from('widget_analytics')
      .insert({
        widget_type,
        listing_id,
        event,
        referrer: referrer ?? null,
        created_at: new Date().toISOString(),
      })
      .then()

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Always 200 for widgets
  }
}
