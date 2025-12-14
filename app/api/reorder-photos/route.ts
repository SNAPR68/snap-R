import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { listingId, photoOrder } = await req.json();

    if (!listingId || !photoOrder || !Array.isArray(photoOrder)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Update each photo's display_order
    const updates = photoOrder.map((photoId, index) => 
      supabase
        .from('photos')
        .update({ display_order: index })
        .eq('id', photoId)
        .eq('listing_id', listingId)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder photos error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
