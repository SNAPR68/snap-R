import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ShareView } from '@/components/share-view';

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  
  const { data: share } = await supabase
    .from('shares')
    .select('*, listings(*)')
    .eq('token', token)
    .single();

  let listing = share?.listings;
  let shareToken = token;
  let shareSettings = {
    allow_download: true,
    show_comparison: true,
    allow_approval: true,
  };

  if (!listing) {
    const { data: directListing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', token)
      .single();
    
    if (!directListing) {
      notFound();
    }
    listing = directListing;
    shareToken = '';  // No approval for direct listing access
  } else {
    shareSettings = {
      allow_download: share.allow_download ?? true,
      show_comparison: share.show_comparison ?? true,
      allow_approval: share.allow_approval ?? true,
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
      clientApproved: photo.client_approved,
      clientFeedback: photo.client_feedback,
    };
  }));

  return (
    <ShareView 
      listing={listing} 
      photos={photosWithUrls} 
      settings={shareSettings}
      shareToken={shareToken}
    />
  );
}
