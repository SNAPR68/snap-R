export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getRenderProgress } from '@remotion/lambda/client';
import type { AwsRegion } from '@remotion/lambda';
import { createClient } from '@/lib/supabase/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { videoStatusSchema } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

interface VideoRenderJob {
  id: string;
  user_id: string;
  listing_id: string;
  render_id: string;
  bucket_name: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  video_url: string | null;
  render_time_ms: number | null;
  cost_cents: number | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

interface RenderProgressResponse {
  done: boolean;
  fatalErrorEncountered: boolean;
  outputFile?: string;
  overallProgress: number;
  timeToFinish?: number;
  errors?: Array<{ message: string }>;
}

export async function GET(request: NextRequest) {
  try {
    // Extract and validate renderId from query params
    const renderId = request.nextUrl.searchParams.get('renderId');

    let validatedInput;
    try {
      validatedInput = videoStatusSchema.parse({ renderId });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid request parameters',
            details: error.flatten(),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership and fetch job
    const admin = adminSupabase();
    const { data: job, error: jobError } = await admin
      .from('video_render_jobs')
      .select('*')
      .eq('render_id', validatedInput.renderId)
      .eq('user_id', user.id)
      .single<VideoRenderJob>();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Render job not found' },
        { status: 404 }
      );
    }

    // If job already in terminal state, return cached result
    if (job.status === 'completed') {
      const proxyUrl = `${request.nextUrl.origin}/api/video/watch?id=${job.render_id}`;
      return NextResponse.json({
        renderId: job.render_id,
        status: 'completed',
        progress: 1,
        videoUrl: proxyUrl,
        renderTime: job.render_time_ms,
        error: null,
      });
    }

    if (job.status === 'failed') {
      return NextResponse.json({
        renderId: job.render_id,
        status: 'failed',
        progress: 0,
        videoUrl: null,
        renderTime: null,
        error: job.error,
      });
    }

    // Check Remotion environment variables
    if (!process.env.REMOTION_AWS_REGION || !process.env.REMOTION_LAMBDA_FUNCTION_NAME) {
      return NextResponse.json(
        {
          error: 'Video rendering not configured',
          details: 'Missing REMOTION_AWS_REGION or REMOTION_LAMBDA_FUNCTION_NAME',
        },
        { status: 503 }
      );
    }

    // Query Lambda progress
    const progress = await getRenderProgress({
      renderId: validatedInput.renderId,
      bucketName: job.bucket_name,
      functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME,
      region: process.env.REMOTION_AWS_REGION as AwsRegion,
    }) as RenderProgressResponse;

    // Handle completion
    if (progress.done === true && progress.outputFile) {
      await admin
        .from('video_render_jobs')
        .update({
          status: 'completed',
          video_url: progress.outputFile,
          render_time_ms: progress.timeToFinish ? Math.round(progress.timeToFinish) : null,
          cost_cents: progress.timeToFinish ? Math.round((progress.timeToFinish / 1000) * 0.5) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('render_id', validatedInput.renderId);

      const proxyUrl = `${request.nextUrl.origin}/api/video/watch?id=${validatedInput.renderId}`;
      return NextResponse.json({
        renderId: validatedInput.renderId,
        status: 'completed',
        progress: 1,
        videoUrl: proxyUrl,
        renderTime: progress.timeToFinish ?? null,
        error: null,
      });
    }

    // Handle failure
    if (progress.fatalErrorEncountered === true) {
      const firstError = progress.errors?.[0];
      const errorMessage = firstError?.message ?? 'Render failed with unknown error';
      const errorType = (firstError as Record<string, unknown>)?.type as string | undefined;
      const errorName = (firstError as Record<string, unknown>)?.name as string | undefined;

      console.error('[video/status] Fatal render error:', {
        renderId: validatedInput.renderId,
        errorMessage,
        errorType,
        errorName,
        errorCount: progress.errors?.length ?? 0,
        progress: progress.overallProgress,
      });

      await admin
        .from('video_render_jobs')
        .update({
          status: 'failed',
          error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('render_id', validatedInput.renderId);

      return NextResponse.json({
        renderId: validatedInput.renderId,
        status: 'failed',
        progress: progress.overallProgress,
        videoUrl: null,
        renderTime: null,
        error: errorMessage,
      });
    }

    // Return in-progress status
    return NextResponse.json({
      renderId: validatedInput.renderId,
      status: 'rendering',
      progress: progress.overallProgress,
      videoUrl: null,
      renderTime: null,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[video/status]', error);

    return NextResponse.json(
      {
        error: message,
        code: 'STATUS_CHECK_FAILED',
      },
      { status: 500 }
    );
  }
}
