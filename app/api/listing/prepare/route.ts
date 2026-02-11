/**
 * SnapR API - Prepare Listing (Job-based)
 * ========================================
 * POST /api/listing/prepare
 *
 * Creates a job, sets listing to preparing, triggers the worker, and returns jobId.
 * Client should poll /api/listing/status for completion.
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
      .select('id, user_id, title, preparation_status')
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

    if (listing.preparation_status === 'preparing') {
      return NextResponse.json(
        { success: false, error: 'Listing is already being prepared' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // 1. Create job record
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

    // 2. Set listing preparation_status = 'preparing' and processing_started_at
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
      // Continue anyway - job is created
    }

    // 3. Call worker /process endpoint
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
