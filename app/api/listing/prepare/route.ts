/**
 * SnapR API - Prepare Listing (Job-based)
 * ========================================
 * POST /api/listing/prepare
 *
 * Creates a job, sets listing to preparing, triggers the worker, and returns jobId.
 * Client should poll /api/listing/status for completion.
 *
 * ENFORCEMENT:
 * - Checks profiles.subscription_tier is valid (free/starter/pro/agency)
 * - Counts listings with counted_for_usage=true this month against listings_per_month
 * - Sets counted_for_usage=true on the listing when job is created
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { listingId, priority = 'standard' } = body || {};

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'listingId is required' },
        { status: 400 }
      );
    }

    const adminKey = request.headers.get('x-admin-key');
    const allowAdmin = Boolean(
      adminKey &&
        (adminKey === process.env.WORKER_ADMIN_KEY || adminKey === process.env.PREPARE_ADMIN_KEY)
    );

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !allowAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = adminSupabase();
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, user_id, title, preparation_status, counted_for_usage')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (!allowAdmin && listing.user_id !== user?.id) {
      return NextResponse.json(
        { success: false, error: 'You do not own this listing' },
        { status: 403 }
      );
    }

    // ============================================
    // SUBSCRIPTION ENFORCEMENT
    // ============================================
    if (!allowAdmin) {
      const effectiveUserId = listing.user_id;

      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('plan, subscription_tier, listings_per_month')
        .eq('id', effectiveUserId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: 'User profile not found' },
          { status: 402 }
        );
      }

      const isFreeTier = profile.plan === 'free' || !profile.plan;
      const isActive = ['free', 'starter', 'pro', 'agency'].includes(profile.subscription_tier || 'free');

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
      const limit = profile.listings_per_month || 3;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count: used } = await admin
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', effectiveUserId)
        .eq('counted_for_usage', true)
        .gte('created_at', startOfMonth.toISOString());

      if (!listing.counted_for_usage && (used || 0) >= limit) {
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

    // ============================================
    // IDEMPOTENCY GUARD
    // ============================================
    if (listing.preparation_status === 'preparing') {
      return NextResponse.json(
        { success: false, error: 'Listing is already being prepared' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // ============================================
    // 1. CREATE JOB RECORD
    // ============================================
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .insert({
        user_id: listing.user_id,
        listing_id: listingId,
        status: 'queued',
      })
      .select('id')
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: jobError?.message || 'Failed to create job' },
        { status: 500 }
      );
    }

    // ============================================
    // 2. MARK LISTING AS COUNTED FOR USAGE
    // ============================================
    if (!allowAdmin && !listing.counted_for_usage) {
      const { error: incrementError } = await admin
        .from('listings')
        .update({ counted_for_usage: true })
        .eq('id', listingId);

      if (incrementError) {
        console.error('[Billing] Failed to mark listing for usage:', incrementError.message);
      }
    }

    // ============================================
    // 3. SET LISTING STATUS → PREPARING
    // ============================================
    const { error: updateError } = await admin
      .from('listings')
      .update({
        preparation_status: 'preparing',
        processing_started_at: now,
        updated_at: now,
      })
      .eq('id', listingId);

    if (updateError) {
      console.error('[Prepare] Failed to update listing:', updateError.message);
    }

    // ============================================
    // 4. TRIGGER WORKER
    // ============================================
  const workerUrl = process.env.WORKER_URL || 'http://127.0.0.1:8787';
    const effectiveUserId = allowAdmin ? listing.user_id : user?.id;
    let workerResponse: Response;
    try {
      workerResponse = await fetch(`${workerUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          listingId,
          userId: effectiveUserId,
          priority,
          timestamp: now,
        }),
      });
    } catch (error: unknown) {
      await admin
        .from('listings')
        .update({
          preparation_status: null,
          processing_started_at: null,
        })
        .eq('id', listingId);
      const workerMsg = error instanceof Error ? error.message : 'unknown';
      console.error('[Prepare] Worker fetch failed:', workerMsg);
      return NextResponse.json(
        {
          success: false,
          error: `Worker fetch failed: ${workerMsg}`,
          workerUrl,
          jobId: job.id,
        },
        { status: 502 }
      );
    }

    if (!workerResponse.ok) {
      await admin
        .from('listings')
        .update({
          preparation_status: null,
          processing_started_at: null,
        })
        .eq('id', listingId);
      const text = await workerResponse.text();
      return NextResponse.json(
        { success: false, error: `Worker error: ${text}`, jobId: job.id },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job queued and worker triggered. Poll /api/listing/status for completion.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to prepare listing';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[Prepare] Error:', message, stack);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
