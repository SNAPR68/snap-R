import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { photoId, shareToken, approved, feedback } = await req.json();

    if (!photoId) {
      return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 });
    }

    let listingId: string | null = null;

    // If shareToken provided, verify it
    if (shareToken) {
      const { data: share } = await getSupabase()
        .from('shares')
        .select('listing_id')
        .eq('token', shareToken)
        .single();

      if (!share) {
        return NextResponse.json({ error: 'Invalid share token' }, { status: 403 });
      }
      listingId = share.listing_id;
    } else {
      // No shareToken - get listing from photo directly
      const { data: photo } = await getSupabase()
        .from('photos')
        .select('listing_id')
        .eq('id', photoId)
        .single();

      if (!photo) {
        return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
      }
      listingId = photo.listing_id;
    }

    // Update photo approval
    const { error } = await getSupabase()
      .from('photos')
      .update({ 
        client_approved: approved,
        client_feedback: feedback || null,
        approved_at: approved ? new Date().toISOString() : null
      })
      .eq('id', photoId)
      .eq('listing_id', listingId);

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve photo error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
