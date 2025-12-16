import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: shares } = await supabase
      .from('shares')
      .select('id, token, listing_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!shares || shares.length === 0) {
      return NextResponse.json({ listings: [] });
    }

    const listingIds = [...new Set(shares.map(s => s.listing_id))];

    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, address')
      .in('id', listingIds);

    const { data: photos } = await supabase
      .from('photos')
      .select('id, listing_id, client_approved, processed_url, created_at')
      .in('listing_id', listingIds)
      .eq('status', 'completed');

    const result = await Promise.all((listings || []).map(async (listing) => {
      const listingPhotos = (photos || []).filter(p => p.listing_id === listing.id);
      const share = shares.find(s => s.listing_id === listing.id);
      const firstPhoto = listingPhotos[0];
      
      let thumbnail = null;
      if (firstPhoto?.processed_url) {
        const { data } = await supabase.storage.from('raw-images').createSignedUrl(firstPhoto.processed_url, 3600);
        thumbnail = data?.signedUrl || null;
      }
      
      return {
        id: listing.id,
        title: listing.title || 'Untitled',
        address: listing.address || '',
        thumbnail,
        shareToken: share?.token || '',
        stats: {
          approved: listingPhotos.filter(p => p.client_approved === true).length,
          rejected: listingPhotos.filter(p => p.client_approved === false).length,
          pending: listingPhotos.filter(p => p.client_approved === null).length,
          total: listingPhotos.length,
        },
        lastActivity: share?.created_at || new Date().toISOString(),
      };
    }));

    return NextResponse.json({ listings: result });
  } catch (error) {
    console.error('Approval summary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
