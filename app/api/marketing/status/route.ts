/**
 * SnapR API - Marketing Status
 * =============================
 * GET: Fetch marketing job status + artifacts for a listing
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, marketing_status')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get latest marketing job for this listing
    const { data: marketingJob, error: jobError } = await supabase
      .from('marketing_jobs')
      .select('*')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!marketingJob) {
      return NextResponse.json({
        listingId,
        marketingStatus: listing.marketing_status,
        marketingJob: null,
        message: 'No marketing job found for this listing',
      });
    }

    return NextResponse.json({
      listingId,
      marketingStatus: listing.marketing_status,
      marketingJob: {
        id: marketingJob.id,
        status: marketingJob.status,
        description: {
          status: marketingJob.description_status,
          result: marketingJob.description_result,
        },
        captions: {
          status: marketingJob.captions_status,
          result: marketingJob.captions_result,
        },
        mls: {
          status: marketingJob.mls_status,
          result: marketingJob.mls_result,
        },
        propertySite: {
          status: marketingJob.property_site_status,
          result: marketingJob.property_site_result,
        },
        scheduledPosts: {
          status: marketingJob.scheduled_posts_status,
          result: marketingJob.scheduled_posts_result,
        },
        totalCostCents: marketingJob.total_cost_cents,
        costBreakdown: marketingJob.cost_breakdown,
        startedAt: marketingJob.started_at,
        completedAt: marketingJob.completed_at,
        error: marketingJob.error,
      },
    });

  } catch (error: any) {
    console.error('[Marketing Status API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
