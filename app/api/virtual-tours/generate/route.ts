/**
 * Auto-Generate Virtual Tour from Listing Photos
 * ================================================
 * Uses AI photo tags to intelligently sequence photos into a
 * walkthrough tour with room labels and navigation flow.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { parseBody, virtualTourGenerateSchema } from '@/lib/validation/schemas';

/** Room type ordering for natural walkthrough flow */
const TOUR_WALKTHROUGH_ORDER: Record<string, number> = {
  front_exterior: 0,
  entryway: 1,
  living_room: 2,
  kitchen: 3,
  dining_room: 4,
  home_office: 5,
  bedroom: 6,
  bathroom: 7,
  laundry_room: 8,
  basement: 9,
  garage: 10,
  rear_exterior: 11,
  patio: 12,
  deck: 13,
  pool: 14,
  garden: 15,
  aerial: 16,
  drone: 16,
  theater: 17,
  game_room: 18,
  gym: 19,
  wine_cellar: 20,
  other: 99,
};

const ROOM_DISPLAY_NAMES: Record<string, string> = {
  living_room: 'Living Room',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  dining_room: 'Dining Room',
  home_office: 'Home Office',
  basement: 'Basement',
  garage: 'Garage',
  front_exterior: 'Front of Home',
  rear_exterior: 'Backyard',
  pool: 'Pool',
  patio: 'Patio',
  deck: 'Deck',
  garden: 'Garden',
  laundry_room: 'Laundry Room',
  entryway: 'Entry',
  aerial: 'Aerial View',
  drone: 'Aerial View',
  theater: 'Theater',
  game_room: 'Game Room',
  gym: 'Gym',
  wine_cellar: 'Wine Cellar',
  other: 'Room',
};

interface PhotoWithTags {
  id: string;
  raw_url: string | null;
  processed_url: string | null;
  room_type: string;
  features: string[];
  condition: string;
  style: string;
  atmosphere: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = parseBody(virtualTourGenerateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error, details: parsed.details }, { status: 400 });
    }
    const { listingId } = parsed.data;

    const admin = adminSupabase();

    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, address, city, state')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Fetch photos with their tags
    const { data: photos } = await admin
      .from('photos')
      .select('id, raw_url, processed_url')
      .eq('listing_id', listingId)
      .order('created_at');

    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: 'Listing has no photos' }, { status: 400 });
    }

    // Fetch photo tags if available
    const photoIds = photos.map((p) => p.id);
    const { data: tags } = await admin
      .from('photo_tags')
      .select('photo_id, room_type, features, condition, style, atmosphere, confidence')
      .in('photo_id', photoIds);

    const tagMap = new Map(
      (tags ?? []).map((t) => [t.photo_id, t])
    );

    // Build photos with tags, defaulting untagged to 'other'
    const photosWithTags: PhotoWithTags[] = photos.map((p) => {
      const tag = tagMap.get(p.id);
      return {
        id: p.id,
        raw_url: p.raw_url,
        processed_url: p.processed_url,
        room_type: tag?.room_type ?? 'other',
        features: tag?.features ?? [],
        condition: tag?.condition ?? 'good',
        style: tag?.style ?? 'unknown',
        atmosphere: tag?.atmosphere ?? 'unknown',
        confidence: tag?.confidence ?? 0,
      };
    });

    // Sort by walkthrough order
    photosWithTags.sort((a, b) => {
      const orderA = TOUR_WALKTHROUGH_ORDER[a.room_type] ?? 99;
      const orderB = TOUR_WALKTHROUGH_ORDER[b.room_type] ?? 99;
      return orderA - orderB;
    });

    // Generate unique slug
    const baseName = listing.address ?? listing.title ?? 'Tour';
    const slug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) + '-' + Date.now().toString(36);

    // Create the tour
    const { data: tour, error: tourError } = await admin
      .from('virtual_tours')
      .insert({
        user_id: user.id,
        listing_id: listingId,
        name: `${listing.address ?? listing.title ?? 'Property'} Tour`,
        slug,
        description: `Virtual walkthrough of ${listing.address ?? listing.title ?? 'this property'}`,
        tour_type: 'photo',
        status: 'draft',
        is_public: false,
        auto_rotate: true,
        brand_color: '#D4A017',
      })
      .select('id')
      .single();

    if (tourError || !tour) {
      logger.error('[TourGenerate] Failed to create tour:', tourError);
      return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 });
    }

    // Create scenes with room labels
    const scenes = photosWithTags.map((photo, index) => {
      const imageUrl = photo.processed_url ?? photo.raw_url ?? '';
      const roomName = ROOM_DISPLAY_NAMES[photo.room_type] ?? photo.room_type.replace(/_/g, ' ');
      // Number duplicate room types (Bedroom 1, Bedroom 2, etc.)
      const sameTypeBefore = photosWithTags
        .slice(0, index)
        .filter((p) => p.room_type === photo.room_type).length;
      const displayName = sameTypeBefore > 0 ? `${roomName} ${sameTypeBefore + 1}` : roomName;

      return {
        tour_id: tour.id,
        name: displayName,
        description: photo.features.length > 0
          ? `${photo.condition} condition • ${photo.style} style • ${photo.features.slice(0, 3).map((f) => f.replace(/_/g, ' ')).join(', ')}`
          : `${photo.condition} condition • ${photo.atmosphere} atmosphere`,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        sort_order: index,
        is_start_scene: index === 0,
        floor_name: photo.room_type.startsWith('front_') || photo.room_type.startsWith('rear_') || photo.room_type === 'aerial' || photo.room_type === 'drone'
          ? 'Exterior'
          : 'Interior',
        is_360: false,
        yaw: 0,
        pitch: 0,
        zoom: 1,
      };
    });

    const { error: scenesError } = await admin
      .from('tour_scenes')
      .insert(scenes);

    if (scenesError) {
      logger.error('[TourGenerate] Failed to create scenes:', scenesError);
      // Clean up the tour
      await admin.from('virtual_tours').delete().eq('id', tour.id);
      return NextResponse.json({ error: 'Failed to create tour scenes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tourId: tour.id,
      slug,
      scenesCreated: scenes.length,
      message: `Tour created with ${scenes.length} scenes`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[TourGenerate] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
