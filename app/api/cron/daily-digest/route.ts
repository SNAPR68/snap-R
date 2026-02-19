/**
 * SnapR API - Daily Digest Cron
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[DailyDigest] Starting...');
  const supabase = adminSupabase();
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

    // Batch: get all user IDs to query stats in fewer round-trips
    const userIds = users.map(u => u.id);

    // Batch queries for all users at once
    const [
      { data: allPrepared },
      { data: allViews },
      { data: allNeedsReview }
    ] = await Promise.all([
      supabase.from('listings').select('user_id').in('user_id', userIds).gte('prepared_at', yesterday),
      supabase.from('notification_logs').select('user_id').in('user_id', userIds).eq('type', 'client_viewed').gte('created_at', yesterday),
      supabase.from('listings').select('user_id, title, address').in('user_id', userIds).eq('preparation_status', 'needs_review').limit(100),
    ]);

    // Build lookup maps
    const preparedCounts = new Map<string, number>();
    for (const r of allPrepared || []) {
      preparedCounts.set(r.user_id, (preparedCounts.get(r.user_id) || 0) + 1);
    }
    const viewsCounts = new Map<string, number>();
    for (const r of allViews || []) {
      viewsCounts.set(r.user_id, (viewsCounts.get(r.user_id) || 0) + 1);
    }
    const reviewMap = new Map<string, Array<{ title: string; address: string }>>();
    for (const r of allNeedsReview || []) {
      if (!reviewMap.has(r.user_id)) reviewMap.set(r.user_id, []);
      reviewMap.get(r.user_id)!.push(r);
    }

    for (const user of users) {
      try {
        const prefs = user.notification_preferences || {};

        if (!prefs.dailyWhatsapp) { results.skipped++; continue; }
        if (user.notifications_paused_until && new Date(user.notifications_paused_until) > now) { results.skipped++; continue; }

        const listingsPrepared = preparedCounts.get(user.id) || 0;
        const clientViews = viewsCounts.get(user.id) || 0;
        const needsReview = (reviewMap.get(user.id) || []).slice(0, 3);

        // Skip if no activity
        if (listingsPrepared === 0 && clientViews === 0 && !needsReview.length) {
          results.skipped++;
          continue;
        }

        // Build message
        let message = `*Good morning, ${user.full_name || 'there'}!*\n\n*Your SnapR Summary:*\n`;
        if (listingsPrepared) message += `- ${listingsPrepared} listing(s) prepared\n`;
        if (clientViews) message += `- ${clientViews} client view(s)\n`;
        if (needsReview.length) {
          message += `\n*${needsReview.length} need review*\n`;
          needsReview.forEach((l: any) => { message += `- ${l.title || l.address}\n`; });
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
  const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) return;

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
