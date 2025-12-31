/**
 * SnapR API - Daily Digest Cron
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[DailyDigest] Starting...');
  const supabase = await createClient();
  const results = { sent: 0, skipped: 0, failed: 0 };

  try {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, notification_preferences, notifications_paused_until')
      .not('phone', 'is', null);

    if (!users?.length) {
      return NextResponse.json({ success: true, results });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    for (const user of users) {
      try {
        const prefs = user.notification_preferences || {};
        
        if (!prefs.dailyWhatsapp) { results.skipped++; continue; }
        if (user.notifications_paused_until && new Date(user.notifications_paused_until) > now) { results.skipped++; continue; }

        // Gather stats
        const { count: listingsPrepared } = await supabase.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('prepared_at', yesterday);
        const { count: clientViews } = await supabase.from('notification_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'client_viewed').gte('created_at', yesterday);
        const { data: needsReview } = await supabase.from('listings').select('title, address').eq('user_id', user.id).eq('status', 'needs_review').limit(3);

        // Skip if no activity
        if ((listingsPrepared || 0) === 0 && (clientViews || 0) === 0 && !needsReview?.length) {
          results.skipped++;
          continue;
        }

        // Build message
        let message = `☀️ *Good morning, ${user.full_name || 'there'}!*\n\n📋 *Your SnapR Summary:*\n`;
        if (listingsPrepared) message += `• ${listingsPrepared} listing(s) prepared\n`;
        if (clientViews) message += `• ${clientViews} client view(s)\n`;
        if (needsReview?.length) {
          message += `\n⚡ *${needsReview.length} need review*\n`;
          needsReview.forEach((l: any) => { message += `• ${l.title || l.address}\n`; });
        }
        message += `\n_Reply 1, 2, or 3 for actions_`;

        // Send WhatsApp
        await sendWhatsApp(user.phone, message);
        results.sent++;

      } catch (e: any) {
        console.error(`[DailyDigest] Error for ${user.id}:`, e.message);
        results.failed++;
      }
    }

    console.log('[DailyDigest] Complete:', results);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendWhatsApp(phone: string, message: string) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return;

  let formattedPhone = phone.replace(/[^0-9+]/g, '');
  if (!formattedPhone.startsWith('+')) formattedPhone = '+1' + formattedPhone;
  formattedPhone = 'whatsapp:' + formattedPhone;

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: TWILIO_WHATSAPP_FROM, To: formattedPhone, Body: message }),
  });
}
