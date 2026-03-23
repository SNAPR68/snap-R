export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAuthClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { approvePhotoSchema, parseBody } from '@/lib/validation/schemas'

import { logger } from '@/lib/logger';
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authClient = await createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json(); const validated = parseBody(approvePhotoSchema, body); if (!validated.success) { return NextResponse.json({ error: validated.error, details: validated.details }, { status: 400 }); } const { photoId, shareToken, approved, feedback } = body;

    if (!photoId) {
      return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 });
    }

    if (!shareToken) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 403 });
    }

    const supabase = getSupabase();

    // Verify share token and get listing
    const { data: share } = await supabase
      .from('shares')
      .select('listing_id, expires_at, allow_approval')
      .eq('token', shareToken)
      .single();

    if (!share) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 403 });
    }

    // Check expiry
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 403 });
    }

    // Check if approvals are enabled for this share
    if (share.allow_approval === false) {
      return NextResponse.json({ error: 'Photo approval is not enabled for this share link' }, { status: 403 });
    }

    const listingId = share.listing_id;

    // Update photo approval
    const { error } = await supabase
      .from('photos')
      .update({
        client_approved: approved,
        client_feedback: feedback || null,
        approved_at: approved ? new Date().toISOString() : null,
      })
      .eq('id', photoId)
      .eq('listing_id', listingId);

    if (error) {
      logger.error('[Approve Photo] Update error:', error.message);
      return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 });
    }

    // Check if all photos for this listing have been reviewed (no pending left)
    // This enables automatic completion detection
    let allReviewed = false;
    let approvalStats: { approved: number; rejected: number; pending: number; total: number } | null = null;

    try {
      const { data: allPhotos } = await supabase
        .from('photos')
        .select('id, client_approved')
        .eq('listing_id', listingId)
        .eq('status', 'completed');

      if (allPhotos && allPhotos.length > 0) {
        const stats = {
          approved: allPhotos.filter(p => p.client_approved === true).length,
          rejected: allPhotos.filter(p => p.client_approved === false).length,
          pending: allPhotos.filter(p => p.client_approved === null).length,
          total: allPhotos.length,
        };
        approvalStats = stats;
        allReviewed = stats.pending === 0;
      }
    } catch {
      // Non-critical — don't block the approval response
    }

    return NextResponse.json({
      success: true,
      allReviewed,
      stats: approvalStats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    logger.error('[Approve Photo] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
