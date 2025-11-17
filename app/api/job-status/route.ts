export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    // Fetch job status
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (jobError) {
      console.error("Error fetching job:", jobError);
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Fetch associated photos
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("*")
      .eq("job_id", id);

    if (photosError) {
      console.error("Error fetching photos:", photosError);
      // Return job status even if photos fetch fails
      return NextResponse.json({
        status: job?.status || "unknown",
        photos: [],
      });
    }

    return NextResponse.json({
      status: job?.status || "unknown",
      photos: photos || [],
    });
  } catch (error: any) {
    console.error("Job status API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch job status" },
      { status: 500 }
    );
  }
}
