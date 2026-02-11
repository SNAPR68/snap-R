// app/api/listings/status/route.ts
// Update listing status and trigger campaigns

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { onListingStatusChange, toCampaignStatus } from '@/lib/campaigns/status-hook';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, listingId, newStatus } = await request.json();

    if (!userId || !listingId || !newStatus) {
      return NextResponse.json(
        { error: 'userId, listingId, and newStatus required' },
        { status: 400 }
      );
    }

    // Get current marketing status
    const { data: listing, error: fetchError } = await supabase
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
    const { error: updateError } = await supabase
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
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
