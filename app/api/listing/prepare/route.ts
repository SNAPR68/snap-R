/**
 * SnapR API - Prepare Listing
 * ============================
 * POST /api/listing/prepare
 * 
 * Now uses V3 pipeline by default.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prepareListingV3, buildV3PrepareResponse } from '@/lib/ai/v3-prepare';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('\n[API] ========== PREPARE LISTING (V3) ==========');
    
    const body = await request.json();
    const { listingId, options = {} } = body;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'listingId is required' },
        { status: 400 }
      );
    }
    
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
    
    console.log('[API] Starting V3 preparation for:', listing.title);
    
    // Run V3 preparation
    const result = await prepareListingV3(
      { listingId, options },
      user.id
    );
    
    const response = buildV3PrepareResponse(result);
    
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
        photosNeedingReview: result.photosNeedingReview,
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
