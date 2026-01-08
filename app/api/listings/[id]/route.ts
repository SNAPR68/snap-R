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

  const { data: listing, error } = await supabase
    .from("listings")
    .select('id,title,address,city,state,postal_code,description,status,created_at,photos(id,raw_url,processed_url,variant,status,created_at)')
    .eq("id", params.id)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const photos = listing.photos || [];
  const photosWithUrls = await Promise.all(photos.map(async (photo: any) => {
    let signedUrl = null;
    const path = photo.processed_url || photo.raw_url;
    if (path) {
      const { data } = await supabase.storage.from('raw-images').createSignedUrl(path, 3600);
      signedUrl = data?.signedUrl || null;
    }
    return { ...photo, url: signedUrl, signedUrl };
  }));

  return NextResponse.json({ ...listing, photos: photosWithUrls });
}
