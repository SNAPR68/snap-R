/**
 * GET /api/listings/[id]/photos
 * Returns photos for a listing with signed URLs.
 * Used by the mobile app (apps/mobile/src/lib/api.ts).
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/validation/schemas';

import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClientFromRequest(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = uuidSchema.safeParse(params.id);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }
    const listingId = parsed.data;

    // Verify ownership
    const { data: listing } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Fetch photos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, raw_url, processed_url, variant, status, created_at')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });

    if (photosError) {
      logger.error('[Listings Photos API] Fetch error:', photosError.message);
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }

    // Create signed URLs
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        let signedOriginalUrl: string | null = null;
        let signedProcessedUrl: string | null = null;

        if (photo.raw_url) {
          if (photo.raw_url.startsWith('http')) {
            signedOriginalUrl = photo.raw_url;
          } else {
            const { data } = await supabase.storage
              .from('raw-images')
              .createSignedUrl(photo.raw_url, 3600);
            signedOriginalUrl = data?.signedUrl ?? null;
          }
        }

        if (photo.processed_url) {
          if (photo.processed_url.startsWith('http')) {
            signedProcessedUrl = photo.processed_url;
          } else {
            const { data } = await supabase.storage
              .from('raw-images')
              .createSignedUrl(photo.processed_url, 3600);
            signedProcessedUrl = data?.signedUrl ?? null;
          }
        }

        return {
          ...photo,
          signedOriginalUrl,
          signedProcessedUrl,
        };
      })
    );

    return NextResponse.json(photosWithUrls);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('[Listings/[id]/Photos] GET error:', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
