/**
 * POST /api/notify/sms
 * Send an SMS to a client with their property assets link.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/notify/twilio'
import { notifyMessageSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = notifyMessageSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

    const { to, message } = parsed.data
    const result = await sendSms(to, message)

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, sid: result.sid })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
