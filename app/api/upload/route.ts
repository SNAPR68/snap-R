export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILES_PER_JOB = 50;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const listingId = formData.get("listingId")?.toString();
    const variant = formData.get("variant")?.toString()?.trim() || "sky-replacement";

    if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });

    const { data: listing, error: listingError } = await supabase
      .from("listings").select("id").eq("id", listingId).eq("user_id", user.id).single();
    if (listingError || !listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const files: File[] = formData.getAll("files").filter((e): e is File => e instanceof File);
    if (files.length === 0) return NextResponse.json({ error: "No files provided" }, { status: 400 });
    if (files.length > MAX_FILES_PER_JOB) return NextResponse.json({ error: `Max ${MAX_FILES_PER_JOB} files` }, { status: 400 });

    const uploadedPhotos: { id: string; raw_url: string }[] = [];

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type) || file.size > MAX_FILE_SIZE) continue;
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${user.id}/${listingId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("raw-images").upload(fileName, buffer, { contentType: file.type, upsert: false });
        if (uploadError) continue;

        const { data: photo } = await supabase.from("photos").insert({
          listing_id: listingId, user_id: user.id, raw_url: uploadData.path,
          status: "pending", variant, file_name: file.name, file_size: file.size, mime_type: file.type,
        }).select("id, raw_url").single();
        if (photo) uploadedPhotos.push(photo);
      } catch (e) { continue; }
    }

    await supabase.from("listings").update({ updated_at: new Date().toISOString() }).eq("id", listingId);
    return NextResponse.json({ success: true, uploaded: uploadedPhotos.length, photos: uploadedPhotos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
