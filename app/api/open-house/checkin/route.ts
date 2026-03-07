/**
 * POST /api/open-house/checkin — Public check-in to an open house event
 * No auth required (public endpoint for guests)
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { openHouseCheckinSchema } from '@/lib/validation/schemas'
import { adminSupabase } from '@/lib/supabase/admin'

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = openHouseCheckinSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { eventId, name, email, phone, contactType, brokerage, source } = parsed.data
    const supabase = adminSupabase()

    // Verify event exists and is published
    const { data: event, error: eventError } = await supabase
      .from('open_house_events')
      .select('id, is_published, max_attendees, checkin_count, status')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Open house event not found' }, { status: 404 })
    }

    if (!event.is_published) {
      return NextResponse.json({ error: 'This open house is no longer available' }, { status: 403 })
    }

    if (event.status === 'cancelled') {
      return NextResponse.json({ error: 'This open house has been cancelled' }, { status: 403 })
    }

    // Check capacity
    if (event.max_attendees !== null && (event.checkin_count ?? 0) >= event.max_attendees) {
      return NextResponse.json({ error: 'This open house has reached maximum capacity' }, { status: 409 })
    }

    // Insert attendee
    const { data: attendee, error: insertError } = await supabase
      .from('open_house_attendees')
      .insert({
        event_id: eventId,
        name,
        email,
        phone: phone ?? null,
        contact_type: contactType ?? 'buyer',
        brokerage: brokerage ?? null,
        source: source ?? null,
      })
      .select('id')
      .single()

    if (insertError) {
      logger.error('[OpenHouse] Check-in insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to check in. Please try again.' }, { status: 500 })
    }

    // Increment checkin_count
    const { error: updateError } = await supabase
      .from('open_house_events')
      .update({ checkin_count: (event.checkin_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', eventId)

    if (updateError) {
      logger.error('[OpenHouse] checkin_count update error:', updateError.message)
    }

    return NextResponse.json({ success: true, attendeeId: attendee.id }, { status: 201 })
  } catch (error: unknown) {
    logger.error('[OpenHouse] Check-in error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
