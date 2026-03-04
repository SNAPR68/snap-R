/**
 * SnapR API — Drip Sequence Unsubscribe
 * =======================================
 * Public GET endpoint for one-click unsubscribe from lead drip emails.
 * Returns an HTML page confirming the unsubscription.
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const enrollmentId = url.searchParams.get('e')

  if (!enrollmentId || !/^[0-9a-f-]{36}$/.test(enrollmentId)) {
    return new NextResponse(unsubscribePage('Invalid unsubscribe link.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const admin = adminSupabase()

  const { error } = await admin
    .from('lead_drip_enrollments')
    .update({ status: 'unsubscribed', completed_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .in('status', ['active', 'paused'])

  if (error) {
    console.error('[Drip Unsubscribe] Error:', error.message)
    return new NextResponse(unsubscribePage('Something went wrong. Please try again.', false), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Cancel remaining scheduled emails
  await admin
    .from('lead_drip_emails')
    .update({ status: 'skipped' })
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'scheduled')

  return new NextResponse(unsubscribePage('You have been unsubscribed successfully.', true), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function unsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe — SnapR</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:480px;margin:0 auto;padding:40px 20px;text-align:center;">
    <div style="margin-bottom:24px;">
      <span style="font-size:48px;">${success ? '✅' : '❌'}</span>
    </div>
    <h1 style="color:${success ? '#D4A017' : '#ff4444'};font-size:24px;margin:0 0 16px;">${success ? 'Unsubscribed' : 'Error'}</h1>
    <p style="color:#888;font-size:16px;margin:0 0 32px;line-height:1.6;">${message}</p>
    <a href="https://snap-r.com" style="color:#D4A017;text-decoration:none;font-size:14px;">Powered by SnapR</a>
  </div>
</body>
</html>`
}
