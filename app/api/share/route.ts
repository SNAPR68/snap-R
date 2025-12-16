export const dynamic = 'force-dynamic';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { listingId, options = {} } = await request.json();
    
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

    const shareToken = randomUUID().replace(/-/g, '').substring(0, 12);
    
    const { data: share, error } = await supabase
      .from('shares')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        token: shareToken,
        allow_download: options.allowDownload ?? true,
        show_comparison: options.showComparison ?? true,
        password: options.password || null,
        expires_at: options.expiresIn 
          ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .select()
      .single();

    if (error) {
      console.warn('[Share] Could not save share:', error);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snap-r.com';
    const token = share?.token || shareToken;
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      token,
    });
  } catch (error: any) {
    console.error('[Share] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
