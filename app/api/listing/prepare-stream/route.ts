/**
 * SnapR API - Prepare Listing (Streaming)
 * ========================================
 * POST /api/listing/prepare-stream
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { prepareListing, ProcessingProgress, PrepareListingResponse } from '@/lib/ai/listing-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, options = {} } = body;

    if (!listingId) {
      return new Response(
        JSON.stringify({ error: 'listingId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const adminKey = request.headers.get('x-admin-key');
    const allowAdmin = adminKey && process.env.WORKER_ADMIN_KEY && adminKey === process.env.WORKER_ADMIN_KEY;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !allowAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const listingClient = allowAdmin ? adminSupabase() : supabase;
    const { data: listing, error: listingError } = await listingClient
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

    if (!allowAdmin && listing.user_id !== user?.id) {
      return new Response(
        JSON.stringify({ error: 'You do not own this listing' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const sendEvent = (event: string, data: any) => {
          if (isClosed) return;
          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
            // Force flush by yielding control - allows Next.js to send the chunk immediately
            // Use queueMicrotask for immediate flush without blocking
            queueMicrotask(() => {});
          } catch {
            isClosed = true;
          }
        };

        const onProgress = (progress: ProcessingProgress) => {
          sendEvent('progress', {
            phase: progress.status,
            message: progress.currentPhase,
            progress: progress.percentComplete,
            photoProgress: {
              current: progress.processedPhotos,
              total: progress.totalPhotos,
            },
            currentTool: progress.currentTool,
            currentPhotoId: progress.currentPhotoId,
          });
        };

        try {
          sendEvent('progress', { phase: 'starting', message: 'Initializing SnapR AI Engine...', progress: 0 });

          const effectiveUserId = allowAdmin ? listing.user_id : user!.id;
          const result = await prepareListing(
            { listingId, options: allowAdmin ? { ...options, admin: true } : options },
            effectiveUserId,
            onProgress
          );

          const response: PrepareListingResponse = {
            success: result.status !== 'failed',
            listingId: result.listingId,
            status: result.status,
            message: result.error || `Listing prepared with status: ${result.status}`,
            heroPhotoId: result.heroPhotoId ?? undefined,
            totalPhotos: result.totalPhotos,
            successfulPhotos: result.successfulPhotos,
            photosNeedingReview: result.photosNeedingReview,
            estimatedTime: Math.round(result.totalProcessingTime / 1000),
            estimatedCost: result.totalCost,
            toolsApplied: result.toolsApplied,
          };

          sendEvent('complete', { result: response });
        } catch (error: any) {
          console.error('[prepare-stream] Error:', error);
          sendEvent('error', { error: error.message || 'Preparation failed' });
        } finally {
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'X-Content-Type-Options': 'nosniff',
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
