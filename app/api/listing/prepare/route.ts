/**
 * SnapR API - Prepare Listing
 * ============================
 * POST /api/listing/prepare
 * 
 * Initiates the AI-powered listing preparation process
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prepareListing, buildPrepareResponse } from '@/lib/ai/listing-engine';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('\n[API] ========== PREPARE LISTING ==========');
    
    // Parse request
    const body = await request.json();
    const { listingId, options = {} } = body;
    
    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'listingId is required' },
        { status: 400 }
      );
    }
    
    console.log('[API] Listing:', listingId);
    
    // Authenticate user
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
    
    // Check if already preparing
    if (listing.status === 'preparing') {
      return NextResponse.json(
        { success: false, error: 'Listing is already being prepared' },
        { status: 409 }
      );
    }
    
    // Check listing quota (future: subscription-based limits)
    // For now, allow all authenticated users
    
    console.log('[API] Starting preparation for:', listing.title);
    
    // Run the preparation
    const result = await prepareListing(
      { listingId, options },
      user.id
    );
    
    // Build response
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
        photosNeedingReview: result.photosNeedingReview,
        overallConfidence: result.overallConfidence,
      },
    });
    
  } catch (error: any) {
    console.error('[API] Error:', error.message);
    
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
