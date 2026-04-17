/**
 * POST /api/notify/whatsapp
 * Send a WhatsApp message to a client with their property assets.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { sendWhatsApp } from '@/lib/notify/twilio'
import { notifyMessageSchema } from '@/lib/validation/schemas'
import { normalizePhoneNumber } from '@/lib/phone'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = notifyMessageSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

    const { to, message } = parsed.data
    const normalizedTo = normalizePhoneNumber(to)
    if (!normalizedTo) {
      return NextResponse.json({ error: 'Invalid WhatsApp number' }, { status: 400 })
    }

    const result = await sendWhatsApp(normalizedTo, message)

    await adminSupabase().from('notification_logs').insert({
      user_id: user.id,
      user_email: user.email ?? null,
      notification_type: 'manual_whatsapp_send',
      channel: 'whatsapp',
      success: result.success,
      message_id: result.sid ?? null,
      error: result.error ?? null,
      metadata: {
        to: normalizedTo,
        listingId: parsed.data.listingId ?? null,
      },
    })

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, sid: result.sid })
  } catch (error: unknown) {
    logger.error('[Notify/WhatsApp] POST error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
