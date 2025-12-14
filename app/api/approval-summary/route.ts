import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, client_approved, client_feedback, approved_at, variant, processed_url')
      .eq('listing_id', listingId)
      .eq('status', 'completed');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }

    const summary = {
      total: photos?.length || 0,
      approved: photos?.filter(p => p.client_approved === true).length || 0,
      rejected: photos?.filter(p => p.client_approved === false).length || 0,
      pending: photos?.filter(p => p.client_approved === null).length || 0,
      photos: photos || [],
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Approval summary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
