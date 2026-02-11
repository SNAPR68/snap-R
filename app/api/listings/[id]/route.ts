export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = params.id;
  console.log(`[Listings API] Fetching single listing: ${listingId}`);

  // Fetch the listing
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, title, address, city, state, postal_code, description, preparation_status, marketing_status, created_at")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .single();

  if (listingError || !listing) {
    console.error("[Listings API] Listing not found:", listingError);
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Fetch all photos for this listing
  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("id, raw_url, processed_url, variant, status, created_at")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });

  if (photosError) {
    console.error("[Listings API] Photos fetch error:", photosError);
  }

  console.log(`[Listings API] Found ${photos?.length || 0} photos`);

  // Create signed URLs for each photo
  const photosWithSignedUrls = await Promise.all(
    (photos || []).map(async (photo: any) => {
      let signedOriginalUrl: string | null = null;
      let signedProcessedUrl: string | null = null;

      // Sign original/raw URL
      if (photo.raw_url) {
        if (photo.raw_url.startsWith('http')) {
          signedOriginalUrl = photo.raw_url;
        } else {
          const { data } = await supabase.storage
            .from('raw-images')
            .createSignedUrl(photo.raw_url, 3600);
          signedOriginalUrl = data?.signedUrl || null;
        }
      }

      // Sign processed/enhanced URL - THE KEY FIX
      if (photo.processed_url) {
        if (photo.processed_url.startsWith('http')) {
          // Already a full URL (from Cloudinary/Runware/etc)
          signedProcessedUrl = photo.processed_url;
        } else {
          // Storage path - create signed URL
          const { data, error } = await supabase.storage
            .from('raw-images')
            .createSignedUrl(photo.processed_url, 3600);
          
          if (data?.signedUrl) {
            signedProcessedUrl = data.signedUrl;
          } else {
            console.error(`[Listings API] Failed to sign: ${photo.processed_url}`, error?.message);
          }
        }
      }

      console.log(`[Listings API] Photo ${photo.id}: processed_url=${photo.processed_url ? 'YES' : 'NO'}, signed=${signedProcessedUrl ? 'YES' : 'NO'}`);

      return {
        ...photo,
        signedOriginalUrl,
        signedProcessedUrl
      };
    })
  );

  const enhancedCount = photosWithSignedUrls.filter(p => p.signedProcessedUrl).length;
  console.log(`[Listings API] Returning ${photosWithSignedUrls.length} photos, ${enhancedCount} with signed enhanced URLs`);

  return NextResponse.json({
    listing,
    photos: photosWithSignedUrls
  });
}
