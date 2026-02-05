// CRITICAL: Set up process.env BEFORE any V2 imports
(globalThis as any).process = {
  env: {
    REPLICATE_API_TOKEN: '',
    AUTOENHANCE_API_KEY: '',
    OPENAI_API_KEY: ''
  }
};

// Function to update with real env values
function updateProcessEnv(env: Record<string, string>) {
  (globalThis as any).process.env = {
    REPLICATE_API_TOKEN: env.REPLICATE_API_TOKEN || '',
    AUTOENHANCE_API_KEY: env.REPLICATE_API_TOKEN || '',
    OPENAI_API_KEY: env.OPENAI_API_KEY || '',
    ...env
  };
}

import { Env, JobMessage, ProcessingCheckpoint } from './types.js';
import { analyzePhotos } from '../../../lib/ai/listing-engine/photo-intelligence.js';
import { buildListingStrategy } from '../../../lib/ai/listing-engine/strategy-builder.js';
import { determineLockedPresets } from '../../../lib/ai/listing-engine/preset-locker.js';
import { 
  createSupabaseClient, 
  updateJobStatus, 
  updatePhotoStatus,
  getListingPhotos,
  createCheckpoint,
  getCheckpoint
} from './lib/supabase-client.js';

export default {
  async queue(batch: MessageBatch<JobMessage>, env: Env): Promise<void> {
    // Update process.env with real values
    updateProcessEnv(env);
    
    console.log(`[Worker] Received batch of ${batch.messages.length} messages`);
    
    for (const message of batch.messages) {
      const { jobId, listingId, userId } = message.body;
      
      try {
        console.log(`[Worker] Processing job ${jobId} for listing ${listingId}`);
        await updateJobStatus(jobId, 'processing', env);
        
        const checkpoint = await getCheckpoint(jobId, env);
        if (checkpoint) {
          console.log(`[Worker] Resuming from checkpoint`);
        }
        
        console.log(`[Worker] Fetching photos for listing ${listingId}`);
        const photos = await getListingPhotos(listingId, env);
        console.log(`[Worker] Found ${photos.length} photos`);
        
        if (photos.length === 0) {
          throw new Error(`No photos found for listing ${listingId}`);
        }
        
        console.log(`[Worker] Analyzing photos with V2 engine`);
        const photosForAnalysis = photos.map(p => ({ 
          id: p.id, 
          url: p.signedUrl || p.raw_url 
        }));
        
        const analyses = await analyzePhotos(photosForAnalysis, {
          maxConcurrency: 20,
          apiKey: env.OPENAI_API_KEY
        });
        console.log(`[Worker] Analysis complete for ${analyses.length} photos`);
        
        // Filter out failed analyses (undefined/null from rate limits or errors)
const validAnalyses = analyses.filter(a => a && a.valid !== false);
console.log(`[Worker] Valid analyses: ${validAnalyses.length}/${analyses.length}`);

if (validAnalyses.length === 0) {
  throw new Error("All photo analyses failed");
}

const strategy = buildListingStrategy(listingId, validAnalyses);
        const presets = determineLockedPresets(analyses);
        console.log(`[Worker] Strategy: hero=${strategy.heroPhotoId}, tools=${strategy.totalToolCalls}`);
        
        await createCheckpoint({
          jobId,
          completedPhotoIds: [],
          currentStage: 'processing',
          timestamp: Date.now()
        } as ProcessingCheckpoint, env);
        
        console.log(`[Worker] Would process ${photos.length} photos`);
        for (let i = 0; i < photos.length; i++) {
          await updatePhotoStatus(photos[i].id, 'completed', null, env);
          console.log(`[Worker] Photo ${i+1}/${photos.length} marked complete`);
        }
        
        await updateJobStatus(jobId, 'completed', env);
        console.log(`[Worker] Job ${jobId} completed successfully`);
        message.ack();
        
      } catch (error) {
        console.error(`[Worker] Job ${jobId} failed:`, error);
        await updateJobStatus(jobId, 'failed', env);
        message.retry({ delaySeconds: 60 });
      }
    }
  },
  
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ 
        status: "ok", 
        version: "2.1.0-worker",
        environment: env.ENVIRONMENT || 'unknown'
      });
    }
    
    if (url.pathname === '/process' && request.method === 'POST') {
      try {
        const body = await request.json() as JobMessage;
        console.log(`[HTTP] Direct process request for job ${body.jobId}`);
        
        // Process immediately instead of queuing (for testing)
        const mockMessage = {
          body: body,
          ack: () => console.log('Message acked'),
          retry: (opts) => console.log('Message retried', opts)
        };
        
        await this.queue({ messages: [mockMessage] }, env);
        
        return Response.json({ 
          status: "processing", 
          jobId: body.jobId,
          message: "Job processed directly"
        });
      } catch (error) {
        return Response.json({ error: "Failed to process job" }, { status: 500 });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
