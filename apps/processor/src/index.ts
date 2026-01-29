import { Env, JobMessage } from './types.js';

export default {
  async queue(batch: MessageBatch<JobMessage>, env: Env): Promise<void> {
    console.log(`[Worker] Received batch of ${batch.messages.length} messages`);
    
    for (const message of batch.messages) {
      const { jobId, listingId, userId } = message.body;
      
      try {
        console.log(`[Worker] Processing job ${jobId} for listing ${listingId}`);
        
        // TODO: Implement processing logic in Step 5
        // For now, just log and acknowledge
        console.log(`[Worker] Job ${jobId} would process here`);
        
        message.ack();
        console.log(`[Worker] Job ${jobId} completed successfully`);
        
      } catch (error) {
        console.error(`[Worker] Job ${jobId} failed:`, error);
        message.retry({ delaySeconds: 60 });
      }
    }
  },
  
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ 
        status: "ok", 
        version: "2.1.0-worker",
        environment: env.ENVIRONMENT || 'unknown'
      });
    }
    
    // Direct process endpoint for testing (bypasses queue)
    if (url.pathname === '/process' && request.method === 'POST') {
      try {
        const body = await request.json() as JobMessage;
        console.log(`[HTTP] Direct process request for job ${body.jobId}`);
        
        // TODO: Implement processing
        return Response.json({ 
          status: "queued", 
          jobId: body.jobId,
          message: "Direct processing not yet implemented" 
        });
      } catch (error) {
        return Response.json({ error: "Invalid request body" }, { status: 400 });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
