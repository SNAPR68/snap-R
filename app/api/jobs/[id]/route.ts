export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .select(
      `id,user_id,listing_id,variant,status,error,completed_at,created_at,updated_at,
        photos(id,raw_url,processed_url,variant,status,error,created_at,processed_at)
      `
    )
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const photos = Array.isArray(job.photos) ? job.photos : [];
  photos.sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ ...job, photos });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
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

  switch (payload?.action) {
    case "retry":
      await supabase
        .from("jobs")
        .update({ status: "queued", error: null })
        .eq("id", jobId)
        .eq("user_id", user.id);

      await supabase
        .from("photos")
        .update({ status: "pending", error: null, processed_url: null, processed_at: null })
        .eq("job_id", jobId);

      return NextResponse.json({ status: "queued" });
    default:
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }
}
