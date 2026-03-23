import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { mapToReso } from '@/lib/syndication/field-mapping';
import { generateZillowFeed } from '@/lib/syndication/reso-feed';

interface ListingRow {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  year_built: number | null;
  description: string | null;
  property_type: string | null;
  status: string | null;
  mls_number: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface PhotoRow {
  id: string;
  listing_id: string;
  processed_url: string | null;
  raw_url: string | null;
  sort_order: number | null;
  caption: string | null;
  updated_at: string | null;
}

/**
 * GET /api/syndication/zillow
 * Returns Zillow ZDF XML feed of active listings
 * Auth: Bearer token (API key)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const token = authHeader?.replace('Bearer ', '') || url.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required. Provide Bearer token or ?token= query parameter.' },
      { status: 401 }
    );
  }

  const supabase = adminSupabase();

  const { data: apiKey, error: keyError } = await supabase
    .from('api_keys')
    .select('user_id, is_active, scopes')
    .eq('key_prefix', token.substring(0, 8))
    .eq('is_active', true)
    .single();

  if (keyError || !apiKey) {
    return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 403 });
  }

  const userId = String(apiKey.user_id);

  const { data: rawListings, error: listingsError } = await supabase
    .from('listings')
    .select('id, address, city, state, zip, price, bedrooms, bathrooms, sqft, year_built, description, property_type, status, mls_number, created_at, updated_at')
    .eq('user_id', userId)
    .in('status', ['active', 'prepared']);

  if (listingsError) {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }

  const listings = (rawListings || []) as ListingRow[];

  if (listings.length === 0) {
    return new Response(generateZillowFeed([]), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  const listingIds = listings.map((l) => l.id);
  const { data: rawPhotos } = await supabase
    .from('photos')
    .select('id, listing_id, processed_url, raw_url, sort_order, caption, updated_at')
    .in('listing_id', listingIds)
    .order('sort_order', { ascending: true });

  const photos = (rawPhotos || []) as PhotoRow[];

  const photosByListing = new Map<string, PhotoRow[]>();
  for (const photo of photos) {
    const existing = photosByListing.get(photo.listing_id) || [];
    existing.push(photo);
    photosByListing.set(photo.listing_id, existing);
  }

  const resoProperties = listings.map((listing) => {
    const listingPhotos = (photosByListing.get(listing.id) || []).map((p) => ({
      id: p.id,
      processed_url: p.processed_url ?? undefined,
      raw_url: p.raw_url ?? undefined,
      order: p.sort_order ?? undefined,
      caption: p.caption ?? undefined,
      updated_at: p.updated_at ?? undefined,
    }));

    return mapToReso(
      {
        id: listing.id,
        address: listing.address ?? undefined,
        city: listing.city ?? undefined,
        state: listing.state ?? undefined,
        zip: listing.zip ?? undefined,
        price: listing.price ?? undefined,
        bedrooms: listing.bedrooms ?? undefined,
        bathrooms: listing.bathrooms ?? undefined,
        sqft: listing.sqft ?? undefined,
        year_built: listing.year_built ?? undefined,
        description: listing.description ?? undefined,
        property_type: listing.property_type ?? undefined,
        status: listing.status ?? undefined,
        mls_number: listing.mls_number ?? undefined,
        listed_date: listing.created_at ?? undefined,
        updated_at: listing.updated_at ?? undefined,
      },
      listingPhotos
    );
  });

  return new Response(generateZillowFeed(resoProperties), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
