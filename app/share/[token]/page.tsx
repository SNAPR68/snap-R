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

interface ShareSettings {
  allow_download: boolean;
  show_comparison: boolean;
  allow_approval: boolean;
  requirePassword: boolean;
}

interface PhotoWithUrls {
  id: string;
  rawUrl?: string;
  processedUrl: string;
  variant: string;
  clientApproved?: boolean | null;
  clientFeedback?: string | null;
}

/**
 * Sign photo URLs for a listing.
 * When show_comparison is false, rawUrl is omitted (server-enforced).
 */
async function signPhotos(
  supabase: ReturnType<typeof getSupabase>,
  listingId: string,
  showComparison: boolean
): Promise<PhotoWithUrls[]> {
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('listing_id', listingId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  return await Promise.all((photos || []).map(async (photo) => {
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
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = getSupabase();

  // Find the share by token
  const { data: share } = await supabase
    .from('shares')
    .select('*')
    .eq('token', token)
    .single();

  if (!share) {
    notFound();
  }

  // Check expiry before loading any data
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    notFound();
  }

  const isPasswordProtected = !!share.password;
  const showComparison = share.show_comparison ?? true;

  const shareSettings: ShareSettings = {
    allow_download: share.allow_download ?? true,
    show_comparison: showComparison,
    allow_approval: share.allow_approval ?? true,
    requirePassword: isPasswordProtected,
  };

  // If password-protected, do NOT fetch listing data or sign any URLs.
  // The client will call /api/share/verify to unlock content.
  if (isPasswordProtected) {
    return (
      <ShareView
        listing={null}
        photos={[]}
        settings={shareSettings}
        shareToken={token}
      />
    );
  }

  // No password required — fetch listing + photos
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', share.listing_id)
    .single();

  if (!listing) {
    notFound();
  }

  const photosWithUrls = await signPhotos(supabase, listing.id, showComparison);

  return (
    <ShareView
      listing={listing}
      photos={photosWithUrls}
      settings={shareSettings}
      shareToken={token}
    />
  );
}
