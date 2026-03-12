export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, timingSafeEqual } from 'node:crypto';
import { logger } from '@/lib/logger';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Verify a share password and return listing + signed photo URLs.
 * Passwords are stored as SHA-256 hex hashes in the DB.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: share } = await supabase
      .from('shares')
      .select('*')
      .eq('token', token)
      .single();

    if (!share) {
      return NextResponse.json({ error: 'Invalid share link' }, { status: 404 });
    }

    // Check expiry
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Verify password — stored as SHA-256 hex hash
    if (!share.password) {
      return NextResponse.json({ error: 'This share is not password-protected' }, { status: 400 });
    }

    const inputHash = createHash('sha256').update(password).digest('hex');
    const storedHash = share.password as string;

    // Timing-safe comparison
    let matches = false;
    try {
      matches = timingSafeEqual(
        Buffer.from(inputHash, 'utf-8'),
        Buffer.from(storedHash, 'utf-8')
      );
    } catch {
      matches = false;
    }

    if (!matches) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    // Password verified — fetch listing + photos
    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', share.listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const showComparison = share.show_comparison ?? true;

    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('listing_id', listing.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    const photosWithUrls = await Promise.all((photos || []).map(async (photo) => {
      // Only sign rawUrl when comparison is enabled — server-enforced
      let rawSignedUrl: string | undefined;
      if (showComparison && photo.raw_url) {
        const { data: rawUrl } = await supabase.storage
          .from('raw-images')
          .createSignedUrl(photo.raw_url, 3600);
        rawSignedUrl = rawUrl?.signedUrl ?? undefined;
      }

      const { data: processedUrl } = photo.processed_url
        ? await supabase.storage.from('raw-images').createSignedUrl(photo.processed_url, 3600)
        : { data: null };

      return {
        id: photo.id,
        rawUrl: rawSignedUrl,
        processedUrl: processedUrl?.signedUrl || rawSignedUrl || '',
        variant: photo.variant || 'original',
        clientApproved: photo.client_approved ?? undefined,
        clientFeedback: photo.client_feedback ?? undefined,
      };
    }));

    return NextResponse.json({
      listing: { title: listing.title },
      photos: photosWithUrls,
    });
  } catch (error: unknown) {
    logger.error('[Share Verify] Error:', error);
    return NextResponse.json({ error: 'Failed to verify' }, { status: 500 });
  }
}
