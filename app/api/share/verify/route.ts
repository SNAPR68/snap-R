export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { adminSupabase } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { parseBody } from '@/lib/validation/schemas';

const verifySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

/**
 * Verify a share password and return listing + signed photo URLs.
 * Passwords are stored as SHA-256 hex hashes in the DB.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = parseBody(verifySchema, body);
    if (!validated.success) {
      return NextResponse.json({ error: 'Token and password are required', details: validated.details }, { status: 400 });
    }
    const { token, password } = validated.data;

    const supabase = adminSupabase();

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

    const photosWithUrls = await Promise.all((photos || []).map(async (photo: Record<string, unknown>) => {
      const rawPath = photo.raw_url as string | null;
      const processedPath = photo.processed_url as string | null;

      // Only sign rawUrl when comparison is enabled — server-enforced
      let rawSignedUrl: string | undefined;
      if (showComparison && rawPath) {
        const { data: rawUrl } = await supabase.storage
          .from('raw-images')
          .createSignedUrl(rawPath, 3600);
        rawSignedUrl = rawUrl?.signedUrl ?? undefined;
      }

      const { data: processedUrl } = processedPath
        ? await supabase.storage.from('raw-images').createSignedUrl(processedPath, 3600)
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
