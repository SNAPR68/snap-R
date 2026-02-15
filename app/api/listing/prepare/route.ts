/**
 * SnapR API - Prepare Listing (Job-based)
 * ========================================
 * POST /api/listing/prepare
 *
 * Creates a job, sets listing to preparing, triggers the worker, and returns jobId.
 * Client should poll /api/listing/status for completion.
 *
 * ENFORCEMENT:
 * - Checks profiles.subscription_status === 'active' (or free tier with remaining quota)
 * - Checks profiles.listings_used_this_month < profiles.listings_limit
 * - Increments listings_used_this_month on job creation
 * - Rolls back on worker failure
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
    // Queries profiles table (where Stripe webhook writes)
    // ============================================
    if (!allowAdmin) {
      const effectiveUserId = listing.user_id;

      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('plan, subscription_status, listings_limit, listings_used_this_month')
        .eq('id', effectiveUserId)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: 'User profile not found' },
          { status: 402 }
        );
      }

      // Check subscription is active (or free tier)
      const isFreeTier = profile.plan === 'free' || !profile.plan;
      const isActive = profile.subscription_status === 'active';

      if (!isFreeTier && !isActive) {
        return NextResponse.json(
          {
            success: false,
            error: 'Subscription is not active. Please update your payment method.',
            subscriptionStatus: profile.subscription_status,
          },
          { status: 402 }
        );
      }

      // Check monthly listing limit
      const limit = profile.listings_limit || 3; // Default to free tier limit
      const used = profile.listings_used_this_month || 0;

      // Only count against quota if this listing hasn't been counted before
      if (!listing.counted_for_usage && used >= limit) {
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
    // 2. INCREMENT USAGE (only if not already counted)
    // ============================================
    if (!allowAdmin && !listing.counted_for_usage) {
      const { error: incrementError } = await admin
        .from('profiles')
        .update({
          listings_used_this_month: (await admin
            .from('profiles')
            .select('listings_used_this_month')
            .eq('id', listing.user_id)
            .single()
          ).data?.listings_used_this_month + 1 || 1,
        })
        .eq('id', listing.user_id);

      if (incrementError) {
        console.error('[Billing] Failed to increment usage:', incrementError.message);
        // Don't block the job — log and continue
      }

      await admin
        .from('listings')
        .update({ counted_for_usage: true })
        .eq('id', listingId);
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
    } catch (error: any) {
      // ROLLBACK on worker fetch failure
      await admin
        .from('listings')
        .update({
          preparation_status: null,
          processing_started_at: null,
        })
        .eq('id', listingId);
      console.error('[Prepare] Worker fetch failed:', error?.message || error);
      return NextResponse.json(
        {
          success: false,
          error: `Worker fetch failed: ${error?.message || 'unknown'}`,
          workerUrl,
          jobId: job.id,
        },
        { status: 502 }
      );
    }

    if (!workerResponse.ok) {
      // ROLLBACK on worker error
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
  } catch (error: any) {
    console.error('[Prepare] Error:', error.message, error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to prepare listing',
      },
      { status: 500 }
    );
  }
}
