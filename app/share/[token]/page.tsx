import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { ShareView } from '@/components/share-view';

export const dynamic = 'force-dynamic';

// Use service role to bypass RLS — share pages are viewed by unauthenticated clients
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getSupabase();
  
  // First, try to find the share by token
  const { data: share } = await supabase
    .from('shares')
    .select('*')
    .eq('token', token)
    .single();

  let listing = null;
  let shareToken = token;
  let shareSettings: {
    allow_download: boolean;
    show_comparison: boolean;
    allow_approval: boolean;
    requirePassword?: boolean;
    passwordHash?: string;
  } = {
    allow_download: true,
    show_comparison: true,
    allow_approval: true,
  };

  if (!share) {
    // No valid share token — deny access
    notFound();
  }

  // Check expiry before loading any data
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    notFound();
  }

  // Check password-protected shares — require ?pw= query param
  if (share.password) {
    // Password verification is handled client-side via ShareView
    // The share page will prompt for password before showing content
    shareSettings.requirePassword = true;
    shareSettings.passwordHash = share.password;
  }

  // Share found - get the listing
  const { data: listingData } = await supabase
    .from('listings')
    .select('*')
    .eq('id', share.listing_id)
    .single();

  listing = listingData;

  shareSettings = {
    ...shareSettings,
    allow_download: share.allow_download ?? true,
    show_comparison: share.show_comparison ?? true,
    allow_approval: true,
  };

  if (!listing) {
    notFound();
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
      processedUrl: processedUrl?.signedUrl || rawUrl?.signedUrl,
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
