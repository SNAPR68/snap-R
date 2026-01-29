// Supabase client for Worker environment
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
  console.log(`[Supabase] Would update job ${jobId} to status: ${status}`);
  // TODO: Implement in Step 4
}

export async function updatePhotoStatus(
  photoId: string,
  status: string,
  processedUrl: string | null,
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
): Promise<void> {
  console.log(`[Supabase] Would update photo ${photoId} to status: ${status}`);
  // TODO: Implement in Step 4
}

export async function getListingPhotos(
  listingId: string,
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }
): Promise<Array<{ id: string; raw_url: string }>> {
  console.log(`[Supabase] Would fetch photos for listing ${listingId}`);
  // TODO: Implement in Step 4
  return [];
}

export async function createCheckpoint(
  checkpoint: unknown,
  env: { CHECKPOINTS: KVNamespace }
): Promise<void> {
  console.log(`[KV] Would create checkpoint`);
  // TODO: Implement in Step 4
}

export async function getCheckpoint(
  jobId: string,
  env: { CHECKPOINTS: KVNamespace }
): Promise<unknown | null> {
  console.log(`[KV] Would get checkpoint for job ${jobId}`);
  // TODO: Implement in Step 4
  return null;
}
