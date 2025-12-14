import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { photoId, shareToken, approved, feedback } = await req.json();

    if (!photoId || !shareToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify share token
    const { data: share } = await supabase
      .from('shares')
      .select('listing_id')
      .eq('token', shareToken)
      .single();

    if (!share) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 403 });
    }

    // Update photo approval
    const { error } = await supabase
      .from('photos')
      .update({ 
        client_approved: approved,
        client_feedback: feedback || null,
        approved_at: approved ? new Date().toISOString() : null
      })
      .eq('id', photoId)
      .eq('listing_id', share.listing_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve photo error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
