import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reorderPhotosSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = parseBody(reorderPhotosSchema, body);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 });
    }
    const { listingId, photoOrder } = body;

    if (!listingId || !photoOrder || !Array.isArray(photoOrder)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
  } catch (error: unknown) {
    logger.error('Reorder photos error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
