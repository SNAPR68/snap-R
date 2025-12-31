/**
 * SnapR API - Listing Status
 * GET /api/listing/status?listingId=xxx
 * PATCH /api/listing/status - Update status
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
    
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, status, hero_photo_id, prepared_at, preparation_metadata')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();
    
    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    const { count: totalPhotos } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId);
    
    const { count: enhancedPhotos } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .not('processed_url', 'is', null);
    
    return NextResponse.json({
      listingId: listing.id,
      status: listing.status || 'pending',
      heroPhotoId: listing.hero_photo_id,
      preparedAt: listing.prepared_at,
      totalPhotos: totalPhotos || 0,
      enhancedPhotos: enhancedPhotos || 0,
      confidence: listing.preparation_metadata?.confidence || 0,
      canExport: listing.status === 'prepared',
      canShare: ['prepared', 'needs_review'].includes(listing.status),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, status, heroPhotoId } = body;
    
    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: listing } = await supabase
      .from('listings')
      .select('id, status, user_id')
      .eq('id', listingId)
      .single();
    
    if (!listing || listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    
    if (status) {
      updates.status = status;
      if (status === 'prepared') updates.prepared_at = new Date().toISOString();
    }
    
    if (heroPhotoId !== undefined) {
      updates.hero_photo_id = heroPhotoId;
    }
    
    await supabase.from('listings').update(updates).eq('id', listingId);
    
    return NextResponse.json({ success: true, listingId, status: status || listing.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
