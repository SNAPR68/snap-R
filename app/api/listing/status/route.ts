/**
 * SnapR API - Listing Status
 * ===========================
 * GET: Fetch listing preparation status with history
 * PATCH: Update listing status
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

    // Get listing with preparation metadata
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, status, hero_photo_id, prepared_at, preparation_metadata')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

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

    const flaggedPhotos = await Promise.all((flaggedPhotosData || []).map(async (photo: any) => {
      const { data: urlData } = await supabase.storage.from('raw-images').createSignedUrl(photo.processed_url || photo.raw_url, 3600);
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

    const preparationHistory = (historyData || []).map((log: any) => ({
      id: log.id,
      preparedAt: log.created_at,
      confidence: log.confidence || 0,
      photosProcessed: log.photos_processed || 0,
      toolsUsed: log.tools_used || {},
      presets: log.presets || {},
      status: log.status || 'completed',
    }));

    // If no history table yet, use metadata
    if (preparationHistory.length === 0 && listing.preparation_metadata) {
      preparationHistory.push({
        id: listing.id,
        preparedAt: listing.prepared_at || listing.preparation_metadata?.preparedAt,
        confidence: listing.preparation_metadata?.confidence || 0,
        photosProcessed: totalPhotos || 0,
        toolsUsed: listing.preparation_metadata?.toolsApplied || {},
        presets: listing.preparation_metadata?.lockedPresets || {},
        status: listing.status,
      });
    }

    return NextResponse.json({
      listingId: listing.id,
      status: listing.status || 'pending',
      heroPhotoId: listing.hero_photo_id,
      preparedAt: listing.prepared_at,
      totalPhotos: totalPhotos || 0,
      enhancedPhotos: enhancedPhotos || 0,
      confidence: listing.preparation_metadata?.confidence || 0,
      canExport: listing.status === 'prepared' || listing.status === 'needs_review',
      canShare: !!listing.prepared_at,
      flaggedPhotos,
      preparationHistory,
      metadata: listing.preparation_metadata,
    });

  } catch (error: any) {
    console.error('[Status API] Error:', error.message);
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

    const validStatuses = ['pending', 'preparing', 'prepared', 'needs_review', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (heroPhotoId) updates.hero_photo_id = heroPhotoId;
    if (status === 'prepared') updates.prepared_at = new Date().toISOString();

    const { error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });

  } catch (error: any) {
    console.error('[Status API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
