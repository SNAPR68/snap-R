export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/listing/sample
 *
 * Creates a sample listing with curated stock photos so new users
 * can immediately experience the AI studio without uploading their own.
 * Limited to one sample listing per user.
 */

const SAMPLE_LISTING = {
  title: 'Sample: Modern Luxury Home',
  address: '742 Evergreen Terrace, Beverly Hills, CA 90210',
  price: 2450000,
  bedrooms: 4,
  bathrooms: 3,
  sqft: 3200,
  description: 'This is a sample listing to help you explore SnapR. Try enhancing these photos with AI tools like sky replacement, virtual twilight, and HDR enhancement.',
  status: 'draft',
  preparation_status: 'pending',
};

// Curated Unsplash real estate photos (free license)
const SAMPLE_PHOTOS = [
  {
    raw_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
    variant: 'exterior_front',
  },
  {
    raw_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
    variant: 'exterior_angle',
  },
  {
    raw_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80',
    variant: 'interior_living',
  },
  {
    raw_url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80',
    variant: 'interior_kitchen',
  },
  {
    raw_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=80',
    variant: 'interior_bedroom',
  },
];

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a sample listing
    const { data: existing } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', user.id)
      .like('title', 'Sample:%')
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        created: false,
        message: 'Sample listing already exists',
      });
    }

    // Create the sample listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        ...SAMPLE_LISTING,
        user_id: user.id,
      })
      .select('id')
      .single();

    if (listingError || !listing) {
      console.error('[sample-listing] Insert error:', listingError);
      return NextResponse.json(
        { error: 'Failed to create sample listing' },
        { status: 500 }
      );
    }

    // Insert sample photos
    const photoInserts = SAMPLE_PHOTOS.map((photo, index) => ({
      listing_id: listing.id,
      user_id: user.id,
      raw_url: photo.raw_url,
      variant: photo.variant,
      status: 'uploaded',
      sort_order: index,
    }));

    const { error: photosError } = await supabase
      .from('photos')
      .insert(photoInserts);

    if (photosError) {
      console.error('[sample-listing] Photo insert error:', photosError);
      // Listing was created, photos failed — still return listing ID
    }

    return NextResponse.json({
      id: listing.id,
      created: true,
      message: 'Sample listing created with 5 photos',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[sample-listing] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
