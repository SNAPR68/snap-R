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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const withPhotos = url.searchParams.get("withPhotos") === "true";

  const query = supabase
    .from("listings")
    .select(
      withPhotos
        ? `id,title,address,description,created_at,updated_at,photos(id,raw_url,processed_url,variant,status,created_at)`
        : "id,title,address,description,created_at,updated_at,photos(count)"
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
      const sorted = photos.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return { ...listing, photos: sorted };
    }
    const count = listing.photos?.[0]?.count ?? 0;
    const { photos, ...rest } = listing;
    return { ...rest, photo_count: count };
  });

  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = sanitize(payload?.title);
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const insertPayload = {
    user_id: user.id,
    title,
    address: sanitize(payload?.address),
    description: sanitize(payload?.description),
  };

  const { data, error } = await supabase
    .from("listings")
    .insert(insertPayload)
    .select("id,title,address,description,created_at,updated_at")
    .single();

  if (error) {
    console.error("Listing create error", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
