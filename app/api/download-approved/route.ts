export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawListingId = searchParams.get('listingId');
    const parsed = z.string().uuid().safeParse(rawListingId);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid or missing listingId' }, { status: 400 });
    }
    const listingId = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify listing ownership
    const { data: listing } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Fetch approved photos
    const { data: photos } = await supabase
      .from('photos')
      .select('id, processed_url, display_order')
      .eq('listing_id', listingId)
      .eq('status', 'completed')
      .eq('client_approved', true)
      .not('processed_url', 'is', null)
      .order('display_order', { ascending: true });

    if (!photos || photos.length === 0) {
      return NextResponse.json({ urls: [] });
    }

    // Generate signed URLs in parallel
    const urlResults = await Promise.allSettled(
      photos.map(async (photo) => {
        const { data } = await supabase.storage
          .from('raw-images')
          .createSignedUrl(photo.processed_url!, 3600);
        return data?.signedUrl ?? null;
      })
    );

    const urls = urlResults
      .filter((r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((u): u is string => u !== null);

    return NextResponse.json({ urls, count: urls.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
