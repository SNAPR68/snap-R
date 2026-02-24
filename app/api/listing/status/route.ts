/**
 * SnapR API - Listing Status
 * ===========================
 * GET: Fetch listing preparation status with history
 * PATCH: Update listing status (also evaluates auto-post rules and triggers campaigns on status change)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateAutoPostRules } from '@/lib/social/auto-post-evaluator';
import { onListingStatusChange, toCampaignStatus } from '@/lib/campaigns/status-hook';

interface FlaggedPhoto {
  id: string;
  raw_url: string | null;
  processed_url: string | null;
  variant: string | null;
  confidence?: number;
}

interface PreparationLog {
  id: string;
  created_at: string;
  confidence: number | null;
  photos_processed: number | null;
  tools_used: Record<string, unknown> | null;
  presets: Record<string, unknown> | null;
  status: string | null;
}

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

    // Get listing with preparation metadata + marketing status
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, preparation_status, marketing_status, hero_photo_id, prepared_at, preparation_metadata')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get active job for this listing (queued or processing)
    const { data: activeJob } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('listing_id', listingId)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get photos count
    const { count: totalPhotos } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId);

    const { count: enhancedPhotos } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .eq('status', 'completed');

    // Get flagged photos (low confidence)
    const { data: flaggedPhotosData } = await supabase
      .from('photos')
      .select('id, raw_url, processed_url, variant')
      .eq('listing_id', listingId)
      .lt('confidence', 70);

    const flaggedPhotos = await Promise.all((flaggedPhotosData || []).map(async (photo: FlaggedPhoto) => {
      const { data: urlData } = await supabase.storage.from('raw-images').createSignedUrl(photo.processed_url || photo.raw_url || '', 3600);
      return {
        id: photo.id,
        url: urlData?.signedUrl || '',
        reason: 'Low AI confidence score',
        confidence: photo.confidence || 50,
      };
    }));

    // Get preparation history from logs
    const { data: historyData } = await supabase
      .from('preparation_logs')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(10);

    const preparationHistory = (historyData || []).map((log: PreparationLog) => ({
      id: log.id,
      preparedAt: log.created_at,
      confidence: log.confidence || 0,
      photosProcessed: log.photos_processed || 0,
      toolsUsed: log.tools_used || {},
      presets: log.presets || {},
      status: log.status || 'completed',
    }));

    // If no history table yet, use metadata
    const prepStatus = listing.preparation_status || 'pending';
    if (preparationHistory.length === 0 && listing.preparation_metadata) {
      preparationHistory.push({
        id: listing.id,
        preparedAt: listing.prepared_at || listing.preparation_metadata?.preparedAt,
        confidence: listing.preparation_metadata?.confidence || 0,
        photosProcessed: totalPhotos || 0,
        toolsUsed: listing.preparation_metadata?.toolsApplied || {},
        presets: listing.preparation_metadata?.lockedPresets || {},
        status: prepStatus,
      });
    }

    // Phase 2: Get latest marketing job status
    const { data: marketingJob } = await supabase
      .from('marketing_jobs')
      .select('id, status, description_status, captions_status, mls_status, property_site_status, scheduled_posts_status, completed_at')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      listingId: listing.id,
      status: prepStatus,
      marketingStatus: listing.marketing_status || null,
      jobId: activeJob?.id ?? null,
      jobStatus: activeJob?.status ?? null,
      heroPhotoId: listing.hero_photo_id,
      preparedAt: listing.prepared_at,
      totalPhotos: totalPhotos || 0,
      enhancedPhotos: enhancedPhotos || 0,
      confidence: listing.preparation_metadata?.confidence || 0,
      canExport: prepStatus === 'prepared' || prepStatus === 'needs_review',
      canShare: !!listing.prepared_at,
      flaggedPhotos,
      preparationHistory,
      metadata: listing.preparation_metadata,
      // Phase 2: Marketing automation status
      marketingJob: marketingJob ? {
        id: marketingJob.id,
        status: marketingJob.status,
        description: marketingJob.description_status,
        captions: marketingJob.captions_status,
        mls: marketingJob.mls_status,
        propertySite: marketingJob.property_site_status,
        scheduledPosts: marketingJob.scheduled_posts_status,
        completedAt: marketingJob.completed_at,
      } : null,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Status API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Valid display statuses for marketing_status (maps to campaign triggers)
const VALID_MARKETING_STATUSES = [
  'Coming Soon', 'Just Listed', 'Active', 'Open House',
  'Price Improvement', 'Price Reduced', 'Under Contract',
  'Pending', 'Sold', 'Closed',
];

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, status, heroPhotoId, marketingStatus } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'preparing', 'prepared', 'needs_review', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (marketingStatus && !VALID_MARKETING_STATUSES.includes(marketingStatus)) {
      return NextResponse.json({ error: 'Invalid marketing status' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch current listing to get previous marketing_status (for campaign trigger)
    let previousMarketingStatus: string | null = null;
    if (marketingStatus) {
      const { data: currentListing } = await supabase
        .from('listings')
        .select('marketing_status')
        .eq('id', listingId)
        .eq('user_id', user.id)
        .single();
      previousMarketingStatus = currentListing?.marketing_status || null;
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updates.preparation_status = status;
    if (heroPhotoId) updates.hero_photo_id = heroPhotoId;
    if (status === 'prepared') updates.prepared_at = new Date().toISOString();
    if (marketingStatus) updates.marketing_status = marketingStatus;

    const { error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Evaluate auto-post rules on preparation status change (non-critical — log and continue)
    if (status) {
      try {
        await evaluateAutoPostRules({
          listingId,
          userId: user.id,
          triggerEvent: 'status_changed',
          triggerValue: status,
        });
      } catch (autoPostErr: unknown) {
        const msg = autoPostErr instanceof Error ? autoPostErr.message : 'Unknown error';
        console.error('[Status API] Auto-post evaluation failed (non-critical):', msg);
      }
    }

    // Trigger campaign engine on marketing status change (non-critical — log and continue)
    let campaignResult: { triggered: boolean; campaignId?: string; error?: string } | null = null;
    if (marketingStatus && marketingStatus !== previousMarketingStatus) {
      try {
        // Convert display status ("Just Listed") to campaign status key ("just_listed")
        const campaignStatus = toCampaignStatus(marketingStatus);
        const previousCampaignStatus = previousMarketingStatus
          ? toCampaignStatus(previousMarketingStatus) ?? undefined
          : undefined;

        if (campaignStatus) {
          campaignResult = await onListingStatusChange({
            userId: user.id,
            listingId,
            newStatus: campaignStatus,
            previousStatus: previousCampaignStatus,
          });

          if (campaignResult.triggered) {
            console.log('[Status API] Campaign triggered:', campaignResult.campaignId);
          }
        }
      } catch (campaignErr: unknown) {
        const msg = campaignErr instanceof Error ? campaignErr.message : 'Unknown error';
        console.error('[Status API] Campaign trigger failed (non-critical):', msg);
      }
    }

    return NextResponse.json({
      success: true,
      status,
      marketingStatus: marketingStatus || undefined,
      campaign: campaignResult || undefined,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Status API] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
