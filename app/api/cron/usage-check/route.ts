/**
 * GET /api/cron/usage-check
 * Runs daily — checks each user's monthly listing usage.
 * Sends a warning email at 80% and a limit-reached email at 100%.
 * Skips agency-tier users (unlimited listings).
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { normalizeTier, LISTING_LIMITS, type PlanType } from '@/lib/content/limits';

import { logger } from '@/lib/logger';
import { startCronHeartbeat } from '@/lib/monitoring/cron-heartbeat';
const resend = new Resend(process.env.RESEND_API_KEY);
const CRON_SECRET = process.env.CRON_SECRET;

interface UsageProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  subscription_tier: string | null;
  plan: string | null;
}

function buildWarningEmail(
  firstName: string,
  used: number,
  limit: number,
  tier: string,
  isAtLimit: boolean,
): string {
  const percentage = Math.round((used / limit) * 100);
  const remaining = Math.max(0, limit - used);

  const headline = isAtLimit
    ? 'You\u2019ve reached your listing limit'
    : `You\u2019ve used ${percentage}% of your listings`;

  const subtext = isAtLimit
    ? `You\u2019ve used all ${limit} listings on your ${tier} plan this month. Upgrade to keep preparing new listings without interruption.`
    : `You\u2019ve prepared ${used} of ${limit} listings this month. Only ${remaining} remaining \u2014 upgrade to get more capacity.`;

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <!-- Logo -->
    <div style="margin-bottom:32px">
      <span style="font-size:28px;font-weight:700;color:#D4A017">Snap</span><span style="font-size:28px;font-weight:700;color:#ffffff">R</span>
    </div>

    <!-- Alert Badge -->
    <div style="display:inline-block;padding:6px 14px;background:${isAtLimit ? 'rgba(239,68,68,0.15)' : 'rgba(212,160,23,0.15)'};border:1px solid ${isAtLimit ? 'rgba(239,68,68,0.3)' : 'rgba(212,160,23,0.3)'};border-radius:20px;margin-bottom:20px">
      <span style="font-size:13px;font-weight:600;color:${isAtLimit ? '#EF4444' : '#D4A017'}">${isAtLimit ? '\u26a0\ufe0f Limit Reached' : '\u26a0\ufe0f Usage Warning'}</span>
    </div>

    <!-- Headline -->
    <h1 style="font-size:28px;font-weight:700;color:#ffffff;margin:0 0 12px">${headline}</h1>
    <p style="font-size:16px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 32px">${subtext}</p>

    <!-- Usage Bar -->
    <div style="background:#1A1A1A;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:32px">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span style="font-size:14px;color:rgba(255,255,255,0.5)">Monthly Listings</span>
        <span style="font-size:14px;font-weight:600;color:#fff">${used} / ${limit}</span>
      </div>
      <div style="background:rgba(255,255,255,0.08);border-radius:8px;height:12px;overflow:hidden">
        <div style="background:${isAtLimit ? '#EF4444' : percentage >= 80 ? '#D4A017' : '#22C55E'};height:100%;width:${Math.min(percentage, 100)}%;border-radius:8px;transition:width 0.3s"></div>
      </div>
      <p style="font-size:13px;color:rgba(255,255,255,0.35);margin:8px 0 0;text-align:right">${percentage}% used</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:40px">
      <a href="https://snap-r.com/dashboard/billing"
         style="display:inline-block;background:linear-gradient(135deg,#D4A017,#B8860B);color:#000;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none">
        Upgrade Your Plan \u2192
      </a>
    </div>

    <!-- Plan Comparison -->
    <div style="background:#1A1A1A;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:32px">
      <p style="font-size:14px;font-weight:600;color:#D4A017;margin:0 0 16px">What you unlock with an upgrade:</p>
      <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
        <span style="color:#D4A017;font-size:14px">\u26a1</span>
        <span style="color:rgba(255,255,255,0.7);font-size:14px">More listings per month (up to unlimited)</span>
      </div>
      <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
        <span style="color:#D4A017;font-size:14px">\u26a1</span>
        <span style="color:rgba(255,255,255,0.7);font-size:14px">Full marketing automation (descriptions, captions, scheduling)</span>
      </div>
      <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
        <span style="color:#D4A017;font-size:14px">\u26a1</span>
        <span style="color:rgba(255,255,255,0.7);font-size:14px">Social media auto-publishing</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="color:#D4A017;font-size:14px">\u26a1</span>
        <span style="color:rgba(255,255,255,0.7);font-size:14px">AI video generation with voiceover</span>
      </div>
    </div>

    <!-- Footer -->
    <p style="font-size:14px;color:rgba(255,255,255,0.4);text-align:center;margin:0">
      Questions? Reply to this email or visit <a href="https://snap-r.com" style="color:#D4A017;text-decoration:none">snap-r.com</a>
    </p>

    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0">
    <p style="font-size:12px;color:rgba(255,255,255,0.2);text-align:center;margin:0">
      SnapR \u00b7 AI Real Estate Photo Enhancement \u00b7 <a href="https://snap-r.com/unsubscribe" style="color:rgba(255,255,255,0.2)">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const heartbeat = startCronHeartbeat('usage-check');
  const supabase = adminSupabase();
  const results = { warned: 0, limitReached: 0, skipped: 0, failed: 0 };

  try {
    // Current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get all non-agency users with email
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_tier, plan');

    if (!users?.length) {
      await heartbeat.succeed(results as unknown as Record<string, unknown>);
      return NextResponse.json({ success: true, results });
    }

    // Get listing counts per user for this month (batch query)
    const userIds = (users as UsageProfile[]).map(u => u.id);
    const { data: listingsData } = await supabase
      .from('listings')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', monthStart);

    // Build count map
    const usageCounts = new Map<string, number>();
    for (const row of listingsData || []) {
      usageCounts.set(row.user_id, (usageCounts.get(row.user_id) || 0) + 1);
    }

    for (const user of users as UsageProfile[]) {
      try {
        if (!user.email) {
          results.skipped++;
          continue;
        }

        const tier = normalizeTier(user.subscription_tier || user.plan);

        // Skip agency (unlimited) — no warning needed
        if (tier === 'agency') {
          results.skipped++;
          continue;
        }

        const limit = LISTING_LIMITS[tier as PlanType].listings;
        const used = usageCounts.get(user.id) || 0;
        const percentage = limit > 0 ? (used / limit) * 100 : 0;

        // Only email at 80%+ usage
        if (percentage < 80) {
          results.skipped++;
          continue;
        }

        const isAtLimit = used >= limit;
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';

        const subject = isAtLimit
          ? `You\u2019ve reached your ${limit}-listing limit this month`
          : `Usage alert: ${Math.round(percentage)}% of your monthly listings used`;

        await resend.emails.send({
          from: 'SnapR <notifications@snap-r.com>',
          to: user.email,
          subject,
          html: buildWarningEmail(firstName, used, limit, tier, isAtLimit),
        });

        if (isAtLimit) {
          results.limitReached++;
        } else {
          results.warned++;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[UsageCheck] Error for ${user.id}:`, msg);
        results.failed++;
      }
    }

    logger.info('[UsageCheck] Complete:', results);
    await heartbeat.succeed(results as unknown as Record<string, unknown>);
    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[UsageCheck] Fatal error:', msg);
    await heartbeat.fail(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
