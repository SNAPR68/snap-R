export const dynamic = "force-dynamic";
export const runtime = "edge";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
    if (!cloudflareWorkerUrl) {
      return NextResponse.json(
        { error: "CLOUDFLARE_WORKER_URL not configured" },
        { status: 500 }
      );
    }

    // Forward the form data to Cloudflare Worker
    const response = await fetch(`${cloudflareWorkerUrl}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}



