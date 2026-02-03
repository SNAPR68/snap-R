/**
 * SnapR API - Prepare Listing
 * ============================
 * POST /api/listing/prepare
 * 
 * Uses listing-engine pipeline (V2) for all requests.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { prepareListing, buildPrepareResponse } from '@/lib/ai/listing-engine';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { listingId, options = {} } = body;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'listingId is required' },
        { status: 400 }
      );
    }
    
    console.log(`\n[API] ========== PREPARE LISTING (LISTING ENGINE) ==========`);
    console.log('[API] Listing:', listingId);
    
    const adminKey = request.headers.get('x-admin-key');
    const allowAdmin = Boolean(
      adminKey &&
        (adminKey === process.env.WORKER_ADMIN_KEY || adminKey === process.env.PREPARE_ADMIN_KEY)
    );

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user && !allowAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify user owns the listing
    const listingClient = allowAdmin ? adminSupabase() : supabase;
    const { data: listing, error: listingError } = await listingClient
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
    
    if (!allowAdmin && listing.user_id !== user?.id) {
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
    
    const effectiveUserId = allowAdmin ? listing.user_id : user!.id;
    const result = await prepareListing({ listingId, options }, effectiveUserId);
    const response = buildPrepareResponse(result);
    
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
