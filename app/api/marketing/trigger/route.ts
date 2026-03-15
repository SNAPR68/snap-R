/**
 * SnapR API - Marketing Trigger
 * ==============================
 * POST: Manually trigger (or re-trigger) marketing for a prepared listing
 *
 * Marketing normally auto-triggers after preparation completes.
 * This endpoint allows manual re-triggering if:
 * - Auto-trigger failed
 * - User wants to regenerate marketing artifacts
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { marketingTriggerExtendedSchema, parseBody } from '@/lib/validation/schemas';
import * as Sentry from '@sentry/nextjs';

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  return Sentry.startSpan({ name: 'marketing.trigger', op: 'task' }, async () => {
  try {
    const body = await request.json();
    const validated = parseBody(marketingTriggerExtendedSchema, body);
    if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); }
    const { listingId } = validated.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify listing exists, belongs to user, and is prepared
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, preparation_status, user_id')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.preparation_status !== 'prepared') {
      return NextResponse.json(
        { error: `Listing must be prepared before marketing. Current status: ${listing.preparation_status}` },
        { status: 400 }
      );
    }

    // Check for in-progress marketing job
    const { data: activeJob } = await supabase
      .from('marketing_jobs')
      .select('id, status')
      .eq('listing_id', listingId)
      .in('status', ['queued', 'processing'])
      .maybeSingle();

    if (activeJob) {
      return NextResponse.json(
        { error: 'Marketing job already in progress', jobId: activeJob.id },
        { status: 409 }
      );
    }

    // Create marketing job via admin client (service role for insert)
    const admin = adminSupabase();
    const marketingJobId = crypto.randomUUID();

    const { error: insertError } = await admin
      .from('marketing_jobs')
      .insert({
        id: marketingJobId,
        listing_id: listingId,
        user_id: user.id,
        status: 'queued',
      });

    if (insertError) {
      logger.error('[Marketing Trigger] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create marketing job' }, { status: 500 });
    }

    // Trigger worker via HTTP → Queue bridge
    const workerUrl = process.env.WORKER_URL || 'http://127.0.0.1:8787';
    if (!workerUrl) {
      return NextResponse.json({ error: 'Worker URL not configured' }, { status: 500 });
    }

    const workerResponse = await fetch(`${workerUrl}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.WORKER_ADMIN_KEY && {
          'x-admin-key': process.env.WORKER_ADMIN_KEY,
        }),
      },
      body: JSON.stringify({
        type: 'marketing',
        jobId: marketingJobId,
        listingId,
        userId: user.id,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!workerResponse.ok) {
      logger.error('[Marketing Trigger] Worker enqueue failed:', workerResponse.status);
      // Roll back: delete the marketing job
      await admin
        .from('marketing_jobs')
        .delete()
        .eq('id', marketingJobId);
      return NextResponse.json({ error: 'Failed to enqueue marketing job' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobId: marketingJobId,
      message: 'Marketing job queued',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('[Marketing Trigger API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  });
}
