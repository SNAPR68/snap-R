import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context: any) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return Response.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query job status from Supabase
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) {
      return Response.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get associated photos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('job_id', jobId);

    return Response.json({
      job,
      photos: photos || [],
    });
  } catch (error: any) {
    console.error('Job status error:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}

