/**
 * SnapR API - Skip Preparation
 * ==============================
 * POST /api/listing/skip-preparation
 *
 * Allows agents with pre-existing professional photos (e.g., from Fotello, BoxBrownie)
 * to skip the AI enhancement pipeline and go straight to the marketing pipeline.
 *
 * Sets preparation_status to 'prepared' with metadata indicating skip, marks all photos
 * as completed, counts the listing for billing, and dispatches listing.prepared webhook
 * so the marketing pipeline auto-triggers.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch';
import { logger } from '@/lib/logger';
import { getClientIp } from '@/lib/utils/client-ip';
import { checkRateLimitAsync } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // RATE LIMIT: 10 req/min per IP
    // ============================================
    const ip = getClientIp(request.headers);
    const { success: rateLimitOk } = await checkRateLimitAsync(
      `skip-preparation:${ip}`,
      10,
      60000
    );
    if (!rateLimitOk) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Try again in a minute.' },
        { status: 429 }
      );
    }

    // ============================================
    // VALIDATE BODY
    // ============================================
    const body = await request.json().catch(() => ({}));
    const { listingId } = body as { listingId?: string };

    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'listingId is required' },
        { status: 400 }
      );
    }

    // ============================================
    // AUTH CHECK
    // ============================================
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = adminSupabase();

    // ============================================
    // FETCH LISTING + OWNERSHIP CHECK
    // ============================================
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, user_id, preparation_status, counted_for_usage')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not own this listing' },
        { status: 403 }
      );
    }

    // ============================================
    // IDEMPOTENCY GUARD — prevent double-skip
    // ============================================
    if (listing.preparation_status === 'prepared') {
      return NextResponse.json(
        { success: false, error: 'Listing is already prepared' },
        { status: 409 }
      );
    }

    if (listing.preparation_status === 'preparing') {
      return NextResponse.json(
        { success: false, error: 'Listing is currently being prepared' },
        { status: 409 }
      );
    }

    // ============================================
    // SUBSCRIPTION ENFORCEMENT
    // ============================================
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('plan, subscription_tier, listings_per_month')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 402 }
      );
    }

    const isFreeTier = profile.plan === 'free' || !profile.plan;
    const isActive = ['free', 'starter', 'pro', 'agency', 'enterprise'].includes(
      profile.subscription_tier || 'free'
    );

    if (!isFreeTier && !isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription is not active. Please update your payment method.',
          subscriptionTier: profile.subscription_tier,
        },
        { status: 402 }
      );
    }

    // Check monthly listing limit
    if (!listing.counted_for_usage) {
      const limit = profile.listings_per_month || 3;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: used } = await admin
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('counted_for_usage', true)
        .gte('created_at', startOfMonth.toISOString());

      if ((used || 0) >= limit) {
        return NextResponse.json(
          {
            success: false,
            error: `Monthly listing limit reached (${used}/${limit}). Upgrade your plan for more listings.`,
            used,
            limit,
            plan: profile.plan,
          },
          { status: 402 }
        );
      }
    }

    const now = new Date().toISOString();

    // ============================================
    // 1. UPDATE LISTING → PREPARED (SKIPPED)
    // ============================================
    const { error: updateError } = await admin
      .from('listings')
      .update({
        preparation_status: 'prepared',
        prepared_at: now,
        preparation_metadata: {
          skipped: true,
          skipReason: 'user_requested',
          skippedAt: now,
        },
        updated_at: now,
      })
      .eq('id', listingId);

    if (updateError) {
      logger.error('[SkipPrep] Failed to update listing:', updateError.message);
      return NextResponse.json(
        { success: false, error: 'Failed to update listing status' },
        { status: 500 }
      );
    }

    // ============================================
    // 2. MARK ALL PHOTOS AS COMPLETED
    // ============================================
    const { error: photosError } = await admin
      .from('photos')
      .update({ status: 'completed', updated_at: now })
      .eq('listing_id', listingId);

    if (photosError) {
      logger.error('[SkipPrep] Failed to update photos:', photosError.message);
      // Non-critical — continue (always-complete semantics)
    }

    // ============================================
    // 3. COUNT FOR BILLING
    // ============================================
    if (!listing.counted_for_usage) {
      const { error: billingError } = await admin
        .from('listings')
        .update({ counted_for_usage: true })
        .eq('id', listingId);

      if (billingError) {
        logger.error('[SkipPrep] Failed to mark listing for usage:', billingError.message);
      }
    }

    // ============================================
    // 4. DISPATCH WEBHOOK → listing.prepared
    // ============================================
    dispatchWebhookEvent(user.id, 'listing.prepared', {
      listingId,
      skipped: true,
      skipReason: 'user_requested',
    }).catch(() => { /* non-critical */ });

    logger.info('[SkipPrep] Listing preparation skipped:', {
      listingId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      listingId,
      status: 'prepared',
      skipped: true,
      message: 'Preparation skipped. Marketing pipeline will auto-trigger.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to skip preparation';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('[SkipPrep] Error:', message, stack);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
