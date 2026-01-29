import { Env, JobMessage, ProcessingCheckpoint } from './types.js';
import { analyzePhotos, buildStrategy } from '../../../lib/ai/listing-engine/photo-intelligence.js';
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
    console.log(`[Worker] Received batch of ${batch.messages.length} messages`);
    
    for (const message of batch.messages) {
      const { jobId, listingId, userId } = message.body;
      
      try {
        console.log(`[Worker] Processing job ${jobId} for listing ${listingId}`);
        await updateJobStatus(jobId, 'processing', env);
        
        // Check for resume
        const checkpoint = await getCheckpoint(jobId, env);
        if (checkpoint) {
          console.log(`[Worker] Resuming from checkpoint`);
        }
        
        // Phase 1: Fetch photos
        console.log(`[Worker] Fetching photos for listing ${listingId}`);
        const photos = await getListingPhotos(listingId, env);
        console.log(`[Worker] Found ${photos.length} photos`);
        
        if (photos.length === 0) {
          throw new Error(`No photos found for listing ${listingId}`);
        }
        
        // Phase 2: Analyze with V2 intelligence
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
        
        // Phase 3: Build strategy
        const strategy = buildStrategy(analyses);
        const presets = determineLockedPresets(analyses);
        console.log(`[Worker] Strategy: ${JSON.stringify(strategy, null, 2)}`);
        
        await createCheckpoint({
          jobId,
          completedPhotoIds: [],
          currentStage: 'processing',
          timestamp: Date.now()
        } as ProcessingCheckpoint, env);
        
        // Phase 4: Mock processing (will implement real in Step 13)
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
        
        // Trigger queue instead of processing directly
        await env.SNAPR_QUEUE.send(body);
        
        return Response.json({ 
          status: "queued", 
          jobId: body.jobId,
          message: "Job sent to queue"
        });
      } catch (error) {
        return Response.json({ error: "Failed to queue job" }, { status: 500 });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
