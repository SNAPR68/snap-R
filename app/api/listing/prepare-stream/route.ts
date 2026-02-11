/**
 * SnapR API - Prepare Listing (Streaming) — DEPRECATED
 * ====================================================
 * POST /api/listing/prepare-stream
 *
 * @deprecated Use job-based preparation: POST /api/listing/prepare
 * Returns 410 Gone. Poll /api/listing/status for completion.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return new Response(
    JSON.stringify({
      error: 'Use job-based preparation',
      message: 'Use job-based preparation',
      migration: 'POST /api/listing/prepare with { listingId }, then poll GET /api/listing/status',
    }),
    {
      status: 410,
      headers: {
        'Content-Type': 'application/json',
        'X-Deprecated': 'true',
        'X-Replacement': '/api/listing/prepare',
      },
    }
  );
}
