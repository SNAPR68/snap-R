import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function sanitize(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id,title,address,city,state,postal_code,description,created_at,updated_at,photos(count)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Listings fetch error", error);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
  }

  const listings = (data ?? []).map((listing: any) => {
    const count = listing.photos?.[0]?.count ?? 0;
    const { photos, ...rest } = listing;
    return { ...rest, photo_count: count };
  });

  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
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
    city: sanitize(payload?.city),
    state: sanitize(payload?.state),
    postal_code: sanitize(payload?.postal_code),
    description: sanitize(payload?.description),
  };

  const { data, error } = await supabase
    .from("listings")
    .insert(insertPayload)
    .select("id,title,address,city,state,postal_code,description,created_at,updated_at")
    .single();

  if (error) {
    console.error("Listing create error", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
