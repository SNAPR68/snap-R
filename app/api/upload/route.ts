export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

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
  const supabase = createRouteHandlerClient({ cookies });
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

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  if (files.length > MAX_FILES_PER_JOB) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES_PER_JOB} files per job` }, { status: 400 });
  }

  const missingCloudinary = [
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ].some((value) => !value);
  if (missingCloudinary) {
    return NextResponse.json({ error: "Cloudinary environment variables missing" }, { status: 500 });
  }

  const cloudflareReady = Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN
  );

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      listing_id: listingId,
      variant,
      status: "queued",
    })
    .select("id, listing_id, variant")
    .single();

  if (jobError || !job) {
    console.error("Job insert error", jobError);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }

  try {
    const photos: Array<{ id: string; raw_url: string | null }> = [];

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const upload = await uploadBuffer(buffer, file.name, `listings/${listingId}`);

      const { data: photo, error: photoError } = await supabase
        .from("photos")
        .insert({
          listing_id: listingId,
          job_id: job.id,
          raw_url: upload.secure_url,
          status: "pending",
          variant,
        })
        .select("id, raw_url")
        .single();

      if (photoError || !photo) {
        throw new Error("Failed to store photo metadata");
      }

      photos.push(photo);
    }

    if (cloudflareReady) {
      await enqueueImageJob({
        jobId: job.id,
        listingId,
        userId: user.id,
        variant,
        photos,
      });
    }

    return NextResponse.json(
      {
        jobId: job.id,
        listingId,
        variant,
        photoCount: photos.length,
        queueDispatched: cloudflareReady,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Upload pipeline failed", error);
    await supabase
      .from("jobs")
      .update({ status: "failed", error: error?.message?.slice(0, 255) })
      .eq("id", job.id);

    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
