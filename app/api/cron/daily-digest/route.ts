/**
 * SnapR API - Daily Digest Cron
 * Sends daily summary via WhatsApp and Email
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { sendNotification } from '@/lib/notifications/sender';
import type { DailySummaryData } from '@/lib/notifications/types';

import { logger } from '@/lib/logger';
import { startCronHeartbeat } from '@/lib/monitoring/cron-heartbeat';
const CRON_SECRET = process.env.CRON_SECRET;

interface DigestUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  notification_preferences: Record<string, unknown> | null;
  notifications_paused_until: string | null;
}

interface NeedsReviewItem {
  user_id: string;
  title: string;
  address: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[DailyDigest] Starting...');
  const heartbeat = startCronHeartbeat('daily-digest');
  const supabase = adminSupabase();
  const results = { emailSent: 0, whatsappSent: 0, skipped: 0, failed: 0 };

  try {
    // Query ALL users — not just those with phone numbers
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, notification_preferences, notifications_paused_until');

    if (!users?.length) {
      await heartbeat.succeed(results as unknown as Record<string, unknown>);
      return NextResponse.json({ success: true, results });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Batch: get all user IDs to query stats in fewer round-trips
    const userIds = (users as DigestUser[]).map(u => u.id);

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
    const reviewMap = new Map<string, NeedsReviewItem[]>();
    for (const r of (allNeedsReview || []) as NeedsReviewItem[]) {
      if (!reviewMap.has(r.user_id)) reviewMap.set(r.user_id, []);
      reviewMap.get(r.user_id)!.push(r);
    }

    for (const user of users as DigestUser[]) {
      try {
        const prefs = user.notification_preferences || {};
        const wantWhatsapp = Boolean(prefs.dailyWhatsapp);
        const wantEmail = prefs.dailyEmail !== false; // default to true for email

        // Skip if user wants neither channel
        if (!wantWhatsapp && !wantEmail) { results.skipped++; continue; }
        if (user.notifications_paused_until && new Date(user.notifications_paused_until) > now) { results.skipped++; continue; }

        const listingsPrepared = preparedCounts.get(user.id) || 0;
        const clientViews = viewsCounts.get(user.id) || 0;
        const needsReview = (reviewMap.get(user.id) || []).slice(0, 3);

        // Skip if no activity
        if (listingsPrepared === 0 && clientViews === 0 && !needsReview.length) {
          results.skipped++;
          continue;
        }

        // Build daily summary data for the notification system
        const dailySummary: DailySummaryData = {
          listingsPrepared,
          clientViews,
          clientApprovals: 0,
          postsPublished: 0,
          pendingActions: needsReview.map(l => ({
            type: 'needs_review',
            listingId: '',
            listingTitle: l.title || l.address || 'Untitled',
            action: 'Needs review',
          })),
        };

        // Send via the unified notification system (handles both email + WhatsApp)
        const notifResults = await sendNotification(
          {
            type: 'daily_summary',
            userId: user.id,
            data: { dailySummary },
          },
          user.email || '',
          user.full_name || 'there',
          {
            email: wantEmail && Boolean(user.email),
            whatsapp: wantWhatsapp && Boolean(user.phone),
            whatsappNumber: user.phone ?? undefined,
            dailyWhatsapp: wantWhatsapp,
          }
        );

        for (const r of notifResults) {
          if (r.success && r.channel === 'email') results.emailSent++;
          else if (r.success && r.channel === 'whatsapp') results.whatsappSent++;
          else if (!r.success) results.failed++;
        }

        // If notification system returned nothing (e.g. all channels disabled), count as skipped
        if (notifResults.length === 0) results.skipped++;

      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : 'Internal server error';
        logger.error(`[DailyDigest] Error for ${user.id}:`, errMsg);
        results.failed++;
      }
    }

    logger.info('[DailyDigest] Complete:', results);
    await heartbeat.succeed(results as unknown as Record<string, unknown>);
    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    await heartbeat.fail(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
