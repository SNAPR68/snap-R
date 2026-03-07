/**
 * POST /api/open-house/feedback — Submit feedback after an open house check-in
 * No auth required (public endpoint for guests)
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { openHouseFeedbackSchema } from '@/lib/validation/schemas'
import { adminSupabase } from '@/lib/supabase/admin'

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = openHouseFeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { attendeeId, interestLevel, feedback, wantsFollowUp } = parsed.data
    const supabase = adminSupabase()

    // Verify attendee exists
    const { data: attendee, error: lookupError } = await supabase
      .from('open_house_attendees')
      .select('id')
      .eq('id', attendeeId)
      .single()

    if (lookupError || !attendee) {
      return NextResponse.json({ error: 'Attendee record not found' }, { status: 404 })
    }

    // Build update payload
    const updates: Record<string, unknown> = {}
    if (interestLevel !== undefined) updates.interest_level = interestLevel
    if (feedback !== undefined) updates.feedback = feedback
    if (wantsFollowUp !== undefined) updates.wants_follow_up = wantsFollowUp

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No feedback data provided' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('open_house_attendees')
      .update(updates)
      .eq('id', attendeeId)

    if (updateError) {
      logger.error('[OpenHouse] Feedback update error:', updateError.message)
      return NextResponse.json({ error: 'Failed to save feedback.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('[OpenHouse] Feedback error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
