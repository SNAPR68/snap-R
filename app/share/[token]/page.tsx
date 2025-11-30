import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ShareView } from '@/components/share-view';

export default async function SharePage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  
  const { data: share } = await supabase
    .from('shares')
    .select('*, listings(*)')
    .eq('token', params.token)
    .single();

  let listing = share?.listings;
  let shareSettings = {
    allow_download: true,
    show_comparison: true,
  };

  if (!listing) {
    const { data: directListing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', params.token)
      .single();
    
    if (!directListing) {
      notFound();
    }
    listing = directListing;
  } else {
    shareSettings = {
      allow_download: share.allow_download,
      show_comparison: share.show_comparison,
    };
    
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      notFound();
    }
  }

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('listing_id', listing.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  const photosWithUrls = await Promise.all((photos || []).map(async (photo) => {
    const { data: rawUrl } = await supabase.storage.from('raw-images').createSignedUrl(photo.raw_url, 3600);
    const { data: processedUrl } = photo.processed_url 
      ? await supabase.storage.from('raw-images').createSignedUrl(photo.processed_url, 3600)
      : { data: null };
    
    return {
      ...photo,
      rawUrl: rawUrl?.signedUrl,
      processedUrl: processedUrl?.signedUrl,
    };
  }));

  return (
    <ShareView 
      listing={listing} 
      photos={photosWithUrls} 
      settings={shareSettings}
    />
  );
}
