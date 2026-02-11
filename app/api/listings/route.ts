export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function sanitize(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const withPhotos = searchParams.get("photos") === "true";
  const listingId = searchParams.get("id");

  // ============================================
  // SINGLE LISTING FETCH (for Content Studio)
  // ============================================
  if (listingId) {
    console.log(`[Listings API] Fetching single listing: ${listingId}`);
    
    // NOTE: Only select columns that EXIST in your listings table
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

  // ============================================
  // LIST ALL LISTINGS (existing functionality)
  // ============================================
  const query = supabase
    .from("listings")
    .select(
      withPhotos
        ? `id,title,address,city,state,postal_code,description,preparation_status,marketing_status,created_at,photos!photos_listing_id_fkey(id,raw_url,processed_url,variant,status,created_at)`
        : "id,title,address,city,state,postal_code,description,preparation_status,marketing_status,created_at,photos!photos_listing_id_fkey(count)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Listings fetch error", error);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
  }

  const listings = (data ?? []).map((listing: any) => {
    if (withPhotos) {
      const photos = Array.isArray(listing.photos) ? listing.photos : [];
      return { ...listing, photos };
    }
    const count = listing.photos?.[0]?.count ?? 0;
    const { photos, ...rest } = listing;
    return { ...rest, photo_count: count };
  });

  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, address, city, state, postal_code, description } = body;

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      title: sanitize(title),
      address: sanitize(address),
      city: sanitize(city),
      state: sanitize(state),
      postal_code: sanitize(postal_code),
      description: sanitize(description),
      marketing_status: "Coming Soon"
    })
    .select()
    .single();

  if (error) {
    console.error("Listing creation error", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, address, city, state, postal_code, description, marketingStatus, status } = body;

  if (!id) {
    return NextResponse.json({ error: "Listing ID required" }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = sanitize(title);
  if (address !== undefined) updates.address = sanitize(address);
  if (city !== undefined) updates.city = sanitize(city);
  if (state !== undefined) updates.state = sanitize(state);
  if (postal_code !== undefined) updates.postal_code = sanitize(postal_code);
  if (description !== undefined) updates.description = sanitize(description);
  // Prefer marketingStatus; accept legacy status for backward compatibility
  if (marketingStatus !== undefined) updates.marketing_status = marketingStatus;
  else if (status !== undefined) updates.marketing_status = status;

  const { data, error } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Listing update error", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Listing ID required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Listing delete error", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
