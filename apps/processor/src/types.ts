// Job message from queue
export interface JobMessage {
  jobId: string;
  listingId: string;
  userId: string;
  priority: 'standard' | 'rush';
  timestamp: string;
}

// Environment bindings
export interface Env {
  // Bindings
  SNAPR_QUEUE: Queue;
  IMAGES: R2Bucket;
  CHECKPOINTS: KVNamespace;
  
  // Vars from wrangler.toml
  ENVIRONMENT: string;
  
  // Secrets (set via wrangler secret)
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  REPLICATE_API_TOKEN: string;
  OPENAI_API_KEY: string;
  WORKER_ADMIN_KEY?: string;
  ANALYSIS_CONCURRENCY?: string;
  ANALYSIS_BATCH_DELAY_MS?: string;
}

// Processing checkpoint for resume capability
export interface ProcessingCheckpoint {
  jobId: string;
  completedPhotoIds: string[];
  currentStage: 'analyzing' | 'processing' | 'finalizing';
  timestamp: number;
  strategySnapshot?: unknown;
}
