import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { tagPhotoBatch, aggregateListingFeatures } from '@/lib/ai/photo-tagger';
import type { PhotoTagInput } from '@/lib/ai/photo-tagger';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ── POST: Trigger photo tagging for a listing ──────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = z.object({ listingId: z.string().uuid() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }

    const { listingId } = parsed.data;

    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Fetch photos with URLs
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, processed_url, raw_url')
      .eq('listing_id', listingId);

    if (photosError || !photos || photos.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 400 });
    }

    // Build photo inputs with signed URLs
    const admin = adminSupabase();
    const photoInputs: PhotoTagInput[] = [];

    for (const photo of photos) {
      const path = photo.processed_url ?? photo.raw_url;
      if (!path) continue;

      if (path.startsWith('http')) {
        photoInputs.push({ id: photo.id, url: path });
      } else {
        const { data: signed } = await admin.storage
          .from('raw-images')
          .createSignedUrl(path, 3600);
        if (signed?.signedUrl) {
          photoInputs.push({ id: photo.id, url: signed.signedUrl });
        }
      }
    }

    if (photoInputs.length === 0) {
      return NextResponse.json({ error: 'No accessible photo URLs' }, { status: 400 });
    }

    // Run batch tagging
    logger.info('[photo-tags] Tagging', photoInputs.length, 'photos for listing', listingId);
    const tagResults = await tagPhotoBatch(photoInputs);

    // Store results in photo_tags table
    const tagRows = [];
    for (const [photoId, result] of tagResults) {
      tagRows.push({
        photo_id: photoId,
        listing_id: listingId,
        user_id: user.id,
        room_type: result.roomType,
        features: result.features,
        condition: result.condition,
        style: result.style,
        atmosphere: result.atmosphere,
        confidence: result.confidence,
        reso_features: result.resoFeatures,
      });
    }

    const { error: insertError } = await admin
      .from('photo_tags')
      .upsert(tagRows, { onConflict: 'photo_id' });

    if (insertError) {
      logger.error('[photo-tags] Insert error:', insertError.message);
    }

    // Aggregate and update listing
    const allTags = [...tagResults.values()];
    const aggregated = aggregateListingFeatures(allTags);

    await admin
      .from('listings')
      .update({
        detected_features: aggregated.detectedFeatures,
        detected_style: aggregated.detectedStyle,
        detected_condition: aggregated.detectedCondition,
      })
      .eq('id', listingId);

    return NextResponse.json({
      tagged: tagRows.length,
      aggregated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[photo-tags] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── GET: Fetch tags for a listing ──────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = request.nextUrl.searchParams.get('listingId');
    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }

    const { data: tags, error } = await supabase
      .from('photo_tags')
      .select('*')
      .eq('listing_id', listingId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tags });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH: User override of a photo tag ──────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = z.object({
      photoId: z.string().uuid(),
      roomType: z.string().max(50).optional(),
      features: z.array(z.string().max(100)).max(50).optional(),
      condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      style: z.string().max(50).optional(),
      atmosphere: z.string().max(50).optional(),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }

    const { photoId, ...updates } = parsed.data;

    // Build update object from provided fields
    const updateData: Record<string, unknown> = {
      is_user_edited: true,
      updated_at: new Date().toISOString(),
    };

    if (updates.roomType !== undefined) updateData.room_type = updates.roomType;
    if (updates.features !== undefined) updateData.features = updates.features;
    if (updates.condition !== undefined) updateData.condition = updates.condition;
    if (updates.style !== undefined) updateData.style = updates.style;
    if (updates.atmosphere !== undefined) updateData.atmosphere = updates.atmosphere;

    const { data, error } = await supabase
      .from('photo_tags')
      .update(updateData)
      .eq('photo_id', photoId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tag: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
