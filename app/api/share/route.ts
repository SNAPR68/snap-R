export const dynamic = 'force-dynamic';
import { randomUUID, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shareSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); const validated = parseBody(shareSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); } const { listingId, options = {} } = body;

    // Validate listingId is a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!listingId || typeof listingId !== 'string' || !uuidRegex.test(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const shareToken = randomUUID().replace(/-/g, '');

    const { data: share, error } = await supabase
      .from('shares')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        token: shareToken,
        allow_download: options.allowDownload ?? true,
        show_comparison: options.showComparison ?? true,
        password: options.password ? hashPassword(options.password as string) : null,
        expires_at: options.expiresIn 
          ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .select()
      .single();

    if (error) {
      logger.warn('[Share] Could not save share:', error);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snap-r.com';
    const token = share?.token || shareToken;
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      token,
    });
  } catch (error: unknown) {
    logger.error('[Share] Error:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}
