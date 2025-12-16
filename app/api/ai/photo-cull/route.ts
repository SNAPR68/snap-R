export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runCullSession, calculateCullingCost, generateMLSExport } from '@/lib/ai/photo-culler';

export const maxDuration = 300; // 5 minutes for large batches

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      listingId, 
      photoUrls, 
      targetCount = 25,
      sessionName 
    } = body;

    // Validate
    if (!listingId && (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0)) {
      return NextResponse.json({ 
        error: 'Either listingId or photoUrls array is required' 
      }, { status: 400 });
    }

    if (targetCount < 1 || targetCount > 100) {
      return NextResponse.json({ 
        error: 'targetCount must be between 1 and 100' 
      }, { status: 400 });
    }

    let photos: string[] = photoUrls || [];
    let listingAddress: string | undefined;

    // If listingId provided, fetch photos
    if (listingId && photos.length === 0) {
      const { data: listing } = await supabase
        .from('listings')
        .select('address')
        .eq('id', listingId)
        .single();
      
      listingAddress = listing?.address;

      const { data: photosData } = await supabase
        .from('photos')
        .select('raw_url, processed_url')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: true });

      if (photosData && photosData.length > 0) {
        photos = await Promise.all(
          photosData.map(async (photo) => {
            const path = photo.raw_url;
            const { data } = await supabase.storage
              .from('raw-images')
              .createSignedUrl(path, 3600);
            return data?.signedUrl || '';
          })
        );
        photos = photos.filter(url => url !== '');
      }
    }

    if (photos.length === 0) {
      return NextResponse.json({ error: 'No photos to analyze' }, { status: 400 });
    }

    if (photos.length > 150) {
      return NextResponse.json({ 
        error: 'Maximum 150 photos per session' 
      }, { status: 400 });
    }

    console.log(`[Photo Culling] Starting session: ${photos.length} photos, target: ${targetCount}`);

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from('cull_sessions')
      .insert({
        user_id: user.id,
        listing_id: listingId || null,
        name: sessionName || `Cull Session - ${new Date().toLocaleDateString()}`,
        total_photos: photos.length,
        target_count: targetCount,
        status: 'analyzing',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[Photo Culling] Session create error:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    try {
      // Run AI analysis
      const result = await runCullSession(photos, targetCount);

      // Save photo scores to database
      const photoInserts = result.selectedPhotos.concat(result.rejectedPhotos).map(photo => ({
        session_id: session.id,
        photo_url: photo.photoUrl,
        original_index: photo.photoIndex,
        quality_score: photo.qualityScore,
        blur_score: photo.blurScore,
        exposure_score: photo.exposureScore,
        composition_score: photo.compositionScore,
        room_type: photo.roomType,
        is_exterior: photo.isExterior,
        is_duplicate: photo.isDuplicate,
        duplicate_of: photo.duplicateOfIndex !== undefined 
          ? null // Will need to resolve after insert
          : null,
        similarity_score: photo.similarityScore,
        is_selected: photo.isSelected,
        selection_reason: photo.selectionReason,
        recommended_order: photo.recommendedOrder,
        ai_feedback: photo.aiFeedback,
      }));

      const { error: photosError } = await supabase
        .from('cull_photos')
        .insert(photoInserts);

      if (photosError) {
        console.error('[Photo Culling] Photos insert error:', photosError);
      }

      // Update session with results
      await supabase
        .from('cull_sessions')
        .update({
          status: 'completed',
          selected_count: result.selectedPhotos.length,
          rejected_count: result.rejectedPhotos.length,
          duplicate_count: result.duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0),
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      // Track cost
      const cost = calculateCullingCost(photos.length);
      try {
        await supabase.from('api_costs').insert({
          user_id: user.id,
          provider: 'openai',
          tool: 'photo-culling',
          model: 'gpt-4o',
          input_tokens: photos.length * 500,
          output_tokens: photos.length * 100,
          cost,
          metadata: { 
            session_id: session.id,
            listing_id: listingId,
            photo_count: photos.length,
            selected_count: result.selectedPhotos.length,
            processing_time_ms: result.processingTime,
          },
        });
      } catch (e) {
        console.error('[Photo Culling] Cost tracking error:', e);
      }

      // Generate MLS export data
      const mlsExport = generateMLSExport(result.selectedPhotos, listingAddress);

      console.log(`[Photo Culling] Complete in ${(result.processingTime / 1000).toFixed(1)}s`);

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        summary: {
          totalPhotos: result.totalPhotos,
          selectedCount: result.selectedPhotos.length,
          rejectedCount: result.rejectedPhotos.length,
          duplicateGroups: result.duplicateGroups.length,
          duplicatePhotos: result.duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0),
          averageQuality: result.averageQuality,
          roomTypeCounts: result.roomTypeCounts,
        },
        selectedPhotos: result.selectedPhotos,
        rejectedPhotos: result.rejectedPhotos,
        duplicateGroups: result.duplicateGroups,
        mlsExport,
        cost,
        processingTime: result.processingTime,
      });

    } catch (analysisError: any) {
      await supabase
        .from('cull_sessions')
        .update({ status: 'failed' })
        .eq('id', session.id);
      throw analysisError;
    }

  } catch (error: any) {
    console.error('[Photo Culling] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Culling failed' 
    }, { status: 500 });
  }
}

// GET - Fetch cull session results
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const listingId = searchParams.get('listingId');

    if (sessionId) {
      // Get specific session with photos
      const { data: session, error: sessionError } = await supabase
        .from('cull_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const { data: photos } = await supabase
        .from('cull_photos')
        .select('*')
        .eq('session_id', sessionId)
        .order('recommended_order', { ascending: true, nullsFirst: false });

      return NextResponse.json({
        session,
        photos: photos || [],
        selectedPhotos: (photos || []).filter((p: any) => p.is_selected),
        rejectedPhotos: (photos || []).filter((p: any) => !p.is_selected),
      });
    }

    // List sessions
    let query = supabase
      .from('cull_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data: sessions, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json(sessions || []);

  } catch (error: any) {
    console.error('[Photo Culling] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
