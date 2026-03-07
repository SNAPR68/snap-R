export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';

/**
 * GET /api/video/watch?id=<renderId>
 *
 * Streams a rendered video from S3 through the SnapR domain,
 * so users never see the raw S3/Lambda bucket URL.
 * Supports Range requests for seeking in <video> players.
 */
export async function GET(request: NextRequest) {
  const renderId = request.nextUrl.searchParams.get('id');
  if (!renderId) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const admin = adminSupabase();
  const { data: job } = await admin
    .from('video_render_jobs')
    .select('video_url, status')
    .eq('render_id', renderId)
    .single();

  if (!job?.video_url || job.status !== 'completed') {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const rangeHeader = request.headers.get('range');
  const headers: Record<string, string> = {};
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  const s3Response = await fetch(job.video_url, { headers, signal: AbortSignal.timeout(30000) });

  if (!s3Response.ok && s3Response.status !== 206) {
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 502 });
  }

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', 'video/mp4');
  responseHeaders.set('Cache-Control', 'public, max-age=86400, immutable');
  responseHeaders.set('Content-Disposition', 'inline');

  const contentLength = s3Response.headers.get('content-length');
  if (contentLength) responseHeaders.set('Content-Length', contentLength);

  const contentRange = s3Response.headers.get('content-range');
  if (contentRange) responseHeaders.set('Content-Range', contentRange);

  const acceptRanges = s3Response.headers.get('accept-ranges');
  if (acceptRanges) responseHeaders.set('Accept-Ranges', acceptRanges);

  return new NextResponse(s3Response.body, {
    status: s3Response.status,
    headers: responseHeaders,
  });
}
