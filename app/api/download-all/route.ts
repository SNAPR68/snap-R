import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  try {
    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the listing
    const { data: listing } = await supabase
      .from('listings')
      .select('title')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found or access denied' }, { status: 404 });
    }

    const { data: photos, error } = await supabase
      .from('photos')
      .select('id, processed_url, variant')
      .eq('listing_id', listingId)
      .eq('status', 'completed')
      .not('processed_url', 'is', null)
      .order('display_order', { ascending: true });

    if (error || !photos || photos.length === 0) {
      return NextResponse.json({ error: 'No enhanced photos found' }, { status: 404 });
    }

    const zip = new JSZip();
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const { data: signedUrl } = await supabase.storage
        .from('raw-images')
        .createSignedUrl(photo.processed_url, 60);

      if (signedUrl?.signedUrl) {
        try {
          const response = await fetch(signedUrl.signedUrl);
          const arrayBuffer = await response.arrayBuffer();
          const fileName = `${String(i + 1).padStart(2, '0')}-${photo.variant || 'enhanced'}.jpg`;
          zip.file(fileName, arrayBuffer);
        } catch (fetchError) {
          console.error(`Failed to fetch photo ${photo.id}:`, fetchError);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const safeName = (listing?.title || 'listing').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}-enhanced.zip"`,
      },
    });
  } catch (error) {
    console.error('Download all error:', error);
    return NextResponse.json({ error: 'Failed to create ZIP' }, { status: 500 });
  }
}
