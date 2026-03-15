/**
 * SnapR API v1 — Video Status
 * GET /api/v1/video/:renderId — Get video render status
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-v1/middleware'

function extractRenderId(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split('/')
  // /api/v1/video/[renderId] → segments[4]
  return segments[4] ?? null
}

export const GET = withApiAuth(async (ctx) => {
  const renderId = extractRenderId(ctx.request)
  if (!renderId) {
    return NextResponse.json(
      { error: { message: 'Render ID required', code: 'validation_error' } },
      { status: 400 }
    )
  }

  // Look up render job
  const { data: job, error } = await ctx.supabase
    .from('video_render_jobs')
    .select('id, render_id, status, output_url, error, created_at, updated_at')
    .eq('render_id', renderId)
    .eq('user_id', ctx.userId)
    .single()

  if (error || !job) {
    return NextResponse.json(
      { error: { message: 'Render job not found', code: 'not_found' } },
      { status: 404 }
    )
  }

  return NextResponse.json({
    data: {
      render_id: job.render_id,
      status: job.status,
      output_url: job.output_url,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at,
    },
  })
})
