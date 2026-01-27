/**
 * SnapR API - Prepare Listing (Streaming)
 * ========================================
 * POST /api/listing/prepare-stream
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prepareListingV3 } from '@/lib/ai/v3-prepare';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return new Response(
        JSON.stringify({ error: 'listingId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, title')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (listing.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not own this listing' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent('progress', { stage: 'analyzing', message: 'Initializing SnapR AI Vision...', progress: 0 });
          
          sendEvent('progress', { stage: 'analyzing', message: 'AI Analyzer examining photos...', progress: 10 });

          const result = await prepareListingV3(
            { listingId, options: {} },
            user.id
          );

          sendEvent('complete', {
            success: result.success,
            status: result.status,
            totalPhotos: result.totalPhotos,
            successfulPhotos: result.successfulPhotos,
            failedPhotos: result.failedPhotos,
            photosNeedingReview: result.photosNeedingReview || 0,
            heroPhotoId: result.heroPhotoId,
          });

        } catch (error: any) {
          console.error('[prepare-stream] Error:', error);
          sendEvent('error', { error: error.message || 'Preparation failed' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[prepare-stream] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
