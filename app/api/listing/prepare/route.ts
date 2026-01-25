/**
 * SnapR API - Prepare Listing
 * ============================
 * POST /api/listing/prepare
 * 
 * Uses V3 pipeline by default, with V2 fallback option.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prepareListingV3, buildV3PrepareResponse } from '@/lib/ai/v3-prepare';
import { prepareListing, buildPrepareResponse } from '@/lib/ai/listing-engine';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { listingId, options = {}, useV2 = false } = body;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'listingId is required' },
        { status: 400 }
      );
    }
    
    console.log(`\n[API] ========== PREPARE LISTING (${useV2 ? 'V2' : 'V3'}) ==========`);
    console.log('[API] Listing:', listingId);
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, title, status')
      .eq('id', listingId)
      .single();
    
    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not own this listing' },
        { status: 403 }
      );
    }
    
    if (listing.status === 'preparing') {
      return NextResponse.json(
        { success: false, error: 'Listing is already being prepared' },
        { status: 409 }
      );
    }
    
    console.log('[API] Starting preparation for:', listing.title);
    
    let response;
    let result;
    
    if (useV2) {
      // V2 fallback
      result = await prepareListing({ listingId, options }, user.id);
      response = buildPrepareResponse(result);
    } else {
      // V3 default
      result = await prepareListingV3({ listingId, options }, user.id);
      response = buildV3PrepareResponse(result);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[API] ✅ Complete in ${(duration / 1000).toFixed(1)}s`);
    console.log('[API] Status:', result.status);
    console.log('[API] =====================================\n');
    
    return NextResponse.json({
      ...response,
      processingTime: duration,
      heroPhotoId: result.heroPhotoId,
      stats: {
        totalPhotos: result.totalPhotos,
        successfulPhotos: result.successfulPhotos,
        failedPhotos: result.failedPhotos,
        photosNeedingReview: result.photosNeedingReview || 0,
        overallConfidence: result.overallConfidence,
      },
    });
    
  } catch (error: any) {
    console.error('[API] Error:', error.message, error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to prepare listing',
        status: 'failed',
      },
      { status: 500 }
    );
  }
}
