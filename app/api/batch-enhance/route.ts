import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { batchEnhanceSchema, parseBody } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parseBody(batchEnhanceSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error, details: parsed.details }, { status: 400 });
    }
    const { listingId, toolId, preset } = parsed.data;

    const supabase = await createClient();
    
    // Get all pending photos
    const { data: photos, error } = await supabase
      .from('photos')
      .select('id')
      .eq('listing_id', listingId)
      .eq('status', 'pending');

    if (error || !photos || photos.length === 0) {
      return NextResponse.json({ error: 'No pending photos found' }, { status: 404 });
    }

    // Return photo IDs for client-side processing with progress
    return NextResponse.json({ 
      success: true, 
      photoIds: photos.map(p => p.id),
      total: photos.length 
    });
  } catch (error) {
    console.error('Batch enhance error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
