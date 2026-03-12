/**
 * Photo processing handler (Phase 1).
 * Processes photos by applying enhancement tools assigned by the decision engine.
 *
 * NOTE: The main processing logic lives in index.ts (queue handler).
 * This module is a helper used by the queue handler for batch processing.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface PhotoInput {
  id: string;
  signed_url: string;
  analysis?: {
    skyCondition?: string;
    roomType?: string;
  };
}

interface Strategy {
  assignments?: Record<string, string[]>;
}

export async function processPhotos(
  photos: PhotoInput[],
  strategy: Strategy,
  _env: Record<string, unknown>,
  supabase: SupabaseClient
) {
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const tools = strategy.assignments?.[photo.id] || [];

    console.log(`[Worker] Photo ${i + 1}/${photos.length}: ${photo.id}, tools: ${tools.join(', ') || 'none'}`);

    if (tools.length === 0) {
      await supabase.from('photos').update({ status: 'completed' }).eq('id', photo.id);
      continue;
    }

    // Tools are applied by the main queue handler in index.ts
    await supabase.from('photos').update({ status: 'completed' }).eq('id', photo.id);
    console.log(`[Worker] Photo ${i + 1} DONE`);
  }
}
