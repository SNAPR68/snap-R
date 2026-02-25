// Preparation job message (Phase 1)
export interface PreparationJobMessage {
  type: 'preparation';
  jobId: string;
  listingId: string;
  userId: string;
  priority: 'standard' | 'rush';
  timestamp: string;
}

// Marketing job message (Phase 2)
export interface MarketingJobMessage {
  type: 'marketing';
  jobId: string;
  listingId: string;
  userId: string;
  /** Video template hint — auto-selected if omitted (defaults to property-showcase) */
  videoTemplate?: 'property-showcase' | 'just-listed' | 'open-house' | 'price-drop' | 'sold';
  /** Required when videoTemplate is 'price-drop' */
  previousPrice?: number;
  /** Required when videoTemplate is 'sold' */
  daysOnMarket?: number;
}

// Discriminated union — queue routes by message.type
export type QueueMessage = PreparationJobMessage | MarketingJobMessage;

// Legacy alias — existing code references JobMessage
export type JobMessage = PreparationJobMessage;

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
  QUICK_ENHANCE_URL?: string;
  ANALYSIS_CONCURRENCY?: string;
  ANALYSIS_BATCH_DELAY_MS?: string;

  // Optional provider config
  AUTOENHANCE_API_KEY?: string;
  ANALYSIS_PROVIDER?: string;
  ANALYSIS_REPLICATE_MODEL?: string;
  AI_ANALYSIS_FAIL_OPEN?: string;

  // Video pipeline (Phase 5)
  NEXT_PUBLIC_BASE_URL?: string;
  CRON_SECRET?: string;
}

// Processing checkpoint for resume capability
export interface ProcessingCheckpoint {
  jobId: string;
  completedPhotoIds: string[];
  currentStage: 'analyzing' | 'processing' | 'finalizing';
  timestamp: number;
  strategySnapshot?: unknown;
}
