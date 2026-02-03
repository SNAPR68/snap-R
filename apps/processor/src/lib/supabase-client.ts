// Supabase client for Worker environment

// Processing checkpoint type
export interface ProcessingCheckpoint {
  jobId: string;
  completedPhotoIds: string[];
  currentStage: 'analyzing' | 'processing' | 'finalizing';
  timestamp: number;
  strategySnapshot?: unknown;
}


// WARNING: USE SERVICE ROLE KEY ONLY - NEVER COMMIT TO GIT

import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase credentials in environment');
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Placeholder functions - will implement in Step 4
export async function updateJobStatus(
  jobId: string, 
  status: string, 
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
): Promise<void> {
  const supabase = createSupabaseClient(env);
  
  const { error } = await supabase
    .from('jobs')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', jobId);
    
  if (error) {
    throw new Error(`Failed to update job ${jobId}: ${error.message}`);
  }
}

export async function updatePhotoStatus(
  photoId: string,
  status: string,
  processedUrl: string | null,
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
): Promise<void> {
  const supabase = createSupabaseClient(env);
  
  const updateData: Record<string, unknown> = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (status === 'completed') {
    updateData.processed_url = processedUrl;
    // processed_at field not in schema
  }
  
  const { error } = await supabase
    .from('photos')
    .update(updateData)
    .eq('id', photoId);
    
  if (error) {
    throw new Error(`Failed to update photo ${photoId}: ${error.message}`);
  }
}

export async function getListingPhotos(
  listingId: string,
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
): Promise<Array<{ id: string; raw_url: string; status?: string; signedUrl?: string | null }>> {
  const supabase = createSupabaseClient(env);
  
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, raw_url, status')
    .eq('listing_id', listingId)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(50);
    
  if (error) {
    throw new Error(`Failed to fetch photos for listing ${listingId}: ${error.message}`);
  }
  
  if (!photos || photos.length === 0) {
    return [];
  }
  
  const photosWithSignedUrls = await Promise.all(
    photos.map(async (photo) => {
      const isExternal = typeof photo.raw_url === 'string' && /^https?:\/\//i.test(photo.raw_url);
      if (isExternal) {
        return {
          id: photo.id,
          raw_url: photo.raw_url,
          status: photo.status,
          signedUrl: photo.raw_url,
        };
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('raw-images')
        .createSignedUrl(photo.raw_url, 3600);

      return {
        id: photo.id,
        raw_url: photo.raw_url,
        status: photo.status,
        signedUrl: signedError ? null : signedData?.signedUrl
      };
    })
  );
  
  return photosWithSignedUrls;
}


export async function createCheckpoint(
  checkpoint: ProcessingCheckpoint,
  env: { CHECKPOINTS: KVNamespace }
): Promise<void> {
  try {
    await env.CHECKPOINTS.put(
      `checkpoint:${checkpoint.jobId}`,
      JSON.stringify(checkpoint),
      { expirationTtl: 86400 } // 24 hours
    );
  } catch (error) {
    console.error(`[KV] Failed to create checkpoint: ${error}`);
    // Don't throw - checkpoint is best-effort
  }
}

export async function getCheckpoint(
  jobId: string,
  env: { CHECKPOINTS: KVNamespace }
): Promise<ProcessingCheckpoint | null> {
  try {
    const data = await env.CHECKPOINTS.get(`checkpoint:${jobId}`);
    if (!data) return null;
    return JSON.parse(data) as ProcessingCheckpoint;
  } catch (error) {
    console.error(`[KV] Failed to get checkpoint: ${error}`);
    return null;
  }
}
