export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadBuffer } from "@/lib/cloudinary";
import { enqueueImageJob } from "@/lib/queues";

export const runtime = "nodejs";

const MAX_FILES_PER_JOB = 50;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const listingId = formData.get("listingId")?.toString();
  const rawVariant = formData.get("variant")?.toString();
  const variant = rawVariant?.trim() || "sky-replacement";

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const fileEntries = formData.getAll("files");
  const files: File[] = fileEntries.filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (files.length > MAX_FILES_PER_JOB) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES_PER_JOB} files allowed per upload` },
      { status: 400 }
    );
  }

  const uploadedPhotos: { id: string; raw_url: string }[] = [];

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      console.warn(`Skipping unsupported file type: ${file.type}`);
      continue;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const fileName = `${user.id}/${listingId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("raw-images")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        continue;
      }

      const raw_url = uploadData.path;

      // Insert photo record
      const { data: photoRecord, error: photoError } = await supabase
        .from("photos")
        .insert({
          listing_id: listingId,
          user_id: user.id,
          raw_url,
          status: "pending",
        })
        .select("id")
        .single();

      if (photoError) {
        console.error("Photo insert error:", photoError);
        continue;
      }

      uploadedPhotos.push({
        id: photoRecord.id,
        raw_url,
      });
    } catch (err) {
      console.error("Upload processing error:", err);
    }
  }

  if (uploadedPhotos.length === 0) {
    return NextResponse.json(
      { error: "No files were uploaded successfully" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    uploaded: uploadedPhotos.length,
    photos: uploadedPhotos,
  });
}
