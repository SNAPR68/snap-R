// app/api/listings/status/route.ts
// Update listing status and trigger campaigns

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { onListingStatusChange, toCampaignStatus } from '@/lib/campaigns/status-hook';
import { listingsStatusSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json(); const validated = parseBody(listingsStatusSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); } const { listingId, newStatus } = body;

    if (!listingId || !newStatus) {
      return NextResponse.json(
        { error: 'listingId and newStatus required' },
        { status: 400 }
      );
    }

    const admin = adminSupabase();

    // Get current marketing status — verify ownership via user_id
    const { data: listing, error: fetchError } = await admin
      .from('listings')
      .select('marketing_status')
      .eq('id', listingId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const previousStatus = listing.marketing_status;

    // Update marketing status in database
    const { error: updateError } = await admin
      .from('listings')
      .update({
        marketing_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Convert to campaign status and trigger campaign
    const campaignStatus = toCampaignStatus(newStatus);
    let campaignResult: { triggered: boolean; campaignId?: string; error?: string } = { triggered: false };

    if (campaignStatus) {
      campaignResult = await onListingStatusChange({
        userId,
        listingId,
        newStatus: campaignStatus,
        previousStatus: toCampaignStatus(previousStatus) || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      previousStatus,
      newStatus,
      campaign: campaignResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('Status update error:', message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
