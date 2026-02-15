// CRITICAL: Set up process.env BEFORE any V2 imports
type MessageBatch<T> = {
  messages: Array<{
    body: T;
    ack: () => void;
    retry: (opts?: { delaySeconds?: number }) => void;
  }>;
};

if (!(globalThis as any).process) {
  (globalThis as any).process = { env: {} };
}

// Cloudflare Workers don't implement process.report; force-stub to avoid unenv crashes.
function ensureProcessReportStub() {
  const proc = (globalThis as any).process;
  try {
    Object.defineProperty(proc, 'report', {
      value: { getReport: () => ({}) },
      configurable: true,
      writable: true,
      enumerable: true,
    });
  } catch {
    // Fallback if defineProperty fails (non-configurable), best effort.
    try {
      proc.report = { getReport: () => ({}) };
    } catch {}
  }
  try {
    Object.defineProperty(proc.report, 'getReport', {
      value: () => ({}),
      configurable: true,
      writable: true,
      enumerable: true,
    });
  } catch {
    try {
      proc.report.getReport = () => ({});
    } catch {}
  }
}

ensureProcessReportStub();

// Function to update with real env values
function updateProcessEnv(env: Env) {
  (globalThis as any).process.env = {
    REPLICATE_API_TOKEN: env.REPLICATE_API_TOKEN || '',
    AUTOENHANCE_API_KEY: (env as any).AUTOENHANCE_API_KEY || '',
    OPENAI_API_KEY: env.OPENAI_API_KEY || '',
    SUPABASE_URL: env.SUPABASE_URL || '',
    SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || '',
    NEXT_PUBLIC_SUPABASE_URL: env.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_KEY || '',
    NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_KEY || '',
    ANALYSIS_PROVIDER: (env as any).ANALYSIS_PROVIDER || '',
    ANALYSIS_REPLICATE_MODEL: (env as any).ANALYSIS_REPLICATE_MODEL || '',
    AI_ANALYSIS_FAIL_OPEN: (env as any).AI_ANALYSIS_FAIL_OPEN || '',
    ANALYSIS_CONCURRENCY: (env as any).ANALYSIS_CONCURRENCY || '',
    ANALYSIS_BATCH_DELAY_MS: (env as any).ANALYSIS_BATCH_DELAY_MS || '',
  };
  ensureProcessReportStub();
}

import type { Env, JobMessage, ProcessingCheckpoint } from './types.js';
import type { ToolId } from '../../../lib/ai/router.js';
import type { PhotoAnalysis } from '../../../lib/ai/listing-engine/types.js';

type WorkerDeps = typeof import('./lib/supabase-client.js');
let cachedWorkerDeps: WorkerDeps | null = null;

async function loadWorkerDeps() {
  if (cachedWorkerDeps) return cachedWorkerDeps;
  cachedWorkerDeps = await import('./lib/supabase-client.js');
  return cachedWorkerDeps;
}

type LockedPresets = ReturnType<
  (typeof import('../../../lib/ai/listing-engine/preset-locker.js'))['determineLockedPresets']
>;

type FluxOptions = { guidance?: number; steps?: number };

let cachedModules: {
  analyzePhotos: typeof import('../../../lib/ai/listing-engine/photo-intelligence.js').analyzePhotos;
  buildListingStrategy: typeof import('../../../lib/ai/listing-engine/strategy-builder.js').buildListingStrategy;
  determineLockedPresets: typeof import('../../../lib/ai/listing-engine/preset-locker.js').determineLockedPresets;
  replicate: typeof import('../../../lib/ai/providers/replicate.js');
} | null = null;

async function loadModules() {
  if (cachedModules) return cachedModules;
  const [{ analyzePhotos }, { buildListingStrategy }, { determineLockedPresets }, replicate] = await Promise.all([
    import('../../../lib/ai/listing-engine/photo-intelligence.js'),
    import('../../../lib/ai/listing-engine/strategy-builder.js'),
    import('../../../lib/ai/listing-engine/preset-locker.js'),
    import('../../../lib/ai/providers/replicate.js'),
  ]);

  cachedModules = { analyzePhotos, buildListingStrategy, determineLockedPresets, replicate };
  return cachedModules;
}

// ============================================
// COST TRACKING
// Per-tool cost estimates in cents (from cost-logger.ts)
// Kept inline to avoid cross-environment import issues
// in Cloudflare Worker context
// ============================================

const TOOL_COST_CENTS: Record<string, number> = {
  'sky-replacement': 5,
  'virtual-twilight': 6,
  'lawn-repair': 4,
  'declutter': 5,
  'virtual-staging': 8,
  'fire-fireplace': 4,
  'tv-screen': 4,
  'lights-on': 4,
  'window-masking': 5,
  'color-balance': 3,
  'pool-enhance': 4,
  'hdr': 3,
  'auto-enhance': 3,
  'perspective-correction': 3,
  'lens-correction': 3,
  'reflection-removal': 5,
  'power-line-removal': 5,
  'object-removal': 5,
  'flash-fix': 3,
  'snow-removal': 3,
  'seasonal-spring': 3,
  'seasonal-summer': 3,
  'seasonal-fall': 3,
};

// Analysis cost: OpenAI vision call per photo
const ANALYSIS_COST_CENTS = 2;

function getToolCost(tool: string): number {
  return TOOL_COST_CENTS[tool] ?? 5;
}

interface CostTracker {
  toolCosts: Array<{ tool: string; costCents: number; durationMs: number; success: boolean }>;
  analysisCostCents: number;
  totalCostCents: number;
  photosProcessed: number;
  toolsApplied: number;
}

function createCostTracker(): CostTracker {
  return {
    toolCosts: [],
    analysisCostCents: 0,
    totalCostCents: 0,
    photosProcessed: 0,
    toolsApplied: 0,
  };
}

function recordToolCost(tracker: CostTracker, tool: string, durationMs: number, success: boolean) {
  const costCents = success ? getToolCost(tool) : 0;
  tracker.toolCosts.push({ tool, costCents, durationMs, success });
  tracker.totalCostCents += costCents;
  if (success) tracker.toolsApplied++;
}

function recordAnalysisCost(tracker: CostTracker, photoCount: number) {
  tracker.analysisCostCents = photoCount * ANALYSIS_COST_CENTS;
  tracker.totalCostCents += tracker.analysisCostCents;
}

function getCostSummary(tracker: CostTracker) {
  return {
    totalCostCents: tracker.totalCostCents,
    analysisCostCents: tracker.analysisCostCents,
    toolCosts: tracker.toolCosts,
    photosProcessed: tracker.photosProcessed,
    toolsApplied: tracker.toolsApplied,
    totalCostDollars: (tracker.totalCostCents / 100).toFixed(4),
  };
}

// ============================================
// TOOL ROUTING
// ============================================

function getPresetPrompt(tool: ToolId, presets: LockedPresets): string | undefined {
  switch (tool) {
    case 'sky-replacement':
      return presets.skyPrompt;
    case 'virtual-twilight':
      return presets.twilightPrompt;
    case 'lawn-repair':
      return presets.lawnPrompt;
    case 'virtual-staging':
      return presets.stagingPrompt;
    case 'declutter':
      return presets.declutterPrompt;
    default:
      return undefined;
  }
}

function getToolStrength(tool: ToolId, analysis?: PhotoAnalysis): FluxOptions | undefined {
  if (!analysis) return undefined;

  switch (tool) {
    case 'sky-replacement': {
      if (analysis.skyQuality === 'blown_out') return { guidance: 3.2, steps: 30 };
      if (analysis.skyQuality === 'ugly') return { guidance: 3.5, steps: 32 };
      if (analysis.skyQuality === 'overcast') return { guidance: 2.6, steps: 24 };
      return { guidance: 2.5, steps: 25 };
    }
    case 'virtual-twilight': {
      if (analysis.twilightScore >= 90) return { guidance: 3.8, steps: 32 };
      if (analysis.twilightScore >= 80) return { guidance: 3.5, steps: 30 };
      return { guidance: 3.0, steps: 26 };
    }
    case 'lawn-repair': {
      if (analysis.lawnQuality === 'dead') return { guidance: 3.2, steps: 28 };
      if (analysis.lawnQuality === 'brown') return { guidance: 3.0, steps: 26 };
      if (analysis.lawnQuality === 'patchy') return { guidance: 2.6, steps: 24 };
      return { guidance: 2.5, steps: 25 };
    }
    case 'pool-enhance':
      return { guidance: 2.8, steps: 26 };
    case 'declutter': {
      if (analysis.clutterLevel === 'heavy') return { guidance: 3.4, steps: 32 };
      if (analysis.clutterLevel === 'moderate') return { guidance: 3.0, steps: 28 };
      return { guidance: 2.6, steps: 24 };
    }
    case 'virtual-staging':
      return { guidance: 3.6, steps: 32 };
    case 'window-masking': {
      if (analysis.lighting === 'overexposed' || analysis.lighting === 'mixed') {
        return { guidance: 2.8, steps: 26 };
      }
      return { guidance: 2.4, steps: 22 };
    }
    case 'lights-on':
      return { guidance: 2.6, steps: 24 };
    case 'fire-fireplace':
    case 'tv-screen':
      return { guidance: 2.5, steps: 24 };
    case 'hdr': {
      if (analysis.needsHDR) return { guidance: 2.6, steps: 26 };
      if (analysis.lighting === 'dark' || analysis.lighting === 'mixed') {
        return { guidance: 2.3, steps: 24 };
      }
      return { guidance: 2.0, steps: 22 };
    }
    case 'auto-enhance':
      return { guidance: 2.0, steps: 20 };
    case 'perspective-correction':
    case 'lens-correction':
      return { guidance: 2.8, steps: 26 };
    case 'reflection-removal':
    case 'power-line-removal':
    case 'object-removal':
      return { guidance: 2.8, steps: 26 };
    case 'flash-fix':
      return { guidance: 2.6, steps: 24 };
    case 'color-balance':
      return { guidance: 2.0, steps: 20 };
    default:
      return undefined;
  }
}

function buildStrategyAudit(
  listingId: string,
  analysesById: Map<string, PhotoAnalysis>,
  strategy: { heroPhotoId: string | null; photoStrategies: Array<any> },
  presets: LockedPresets
) {
  return {
    listingId,
    heroPhotoId: strategy.heroPhotoId,
    presets: {
      sky: presets.skyPreset,
      twilight: presets.twilightPreset,
      staging: presets.stagingStyle,
      colorTemp: presets.colorTemp,
      declutter: presets.declutterLevel,
    },
    photos: strategy.photoStrategies.map((photoStrategy: any) => {
      const analysis = analysesById.get(photoStrategy.photoId);
      return {
        photoId: photoStrategy.photoId,
        photoType: analysis?.photoType,
        lighting: analysis?.lighting,
        hasSky: analysis?.hasSky,
        skyVisible: analysis?.skyVisible,
        skyQuality: analysis?.skyQuality,
        hasLawn: analysis?.hasLawn,
        lawnVisible: analysis?.lawnVisible,
        lawnQuality: analysis?.lawnQuality,
        clutterLevel: analysis?.clutterLevel,
        hasClutter: analysis?.hasClutter,
        roomEmpty: analysis?.roomEmpty,
        twilightScore: analysis?.twilightScore,
        hasVisibleWindows: analysis?.hasVisibleWindows,
        suggestedTools: analysis?.suggestedTools,
        toolReasons: analysis?.toolReasons,
        toolsApplied: photoStrategy.toolOrder,
        skip: photoStrategy.skip,
        priority: photoStrategy.priority,
      };
    }),
    generatedAt: new Date().toISOString(),
  };
}

async function runTool(
  tool: ToolId,
  imageUrl: string,
  presets: LockedPresets,
  analysis?: PhotoAnalysis
): Promise<string> {
  const presetPrompt = getPresetPrompt(tool, presets);
  const toolOptions = getToolStrength(tool, analysis);
  const { replicate } = await loadModules();

  switch (tool) {
    case 'sky-replacement':
      return replicate.skyReplacement(imageUrl, presetPrompt, toolOptions);
    case 'virtual-twilight':
      return replicate.virtualTwilight(imageUrl, presetPrompt, toolOptions);
    case 'lawn-repair':
      return replicate.lawnRepair(imageUrl, presetPrompt, toolOptions);
    case 'pool-enhance':
      return replicate.poolEnhance(imageUrl, toolOptions);
    case 'declutter':
      return replicate.declutter(imageUrl, presetPrompt, toolOptions);
    case 'virtual-staging':
      return replicate.virtualStaging(imageUrl, presetPrompt, toolOptions);
    case 'fire-fireplace':
      return replicate.fireFireplace(imageUrl, presetPrompt, toolOptions);
    case 'tv-screen':
      return replicate.tvScreen(imageUrl, presetPrompt, toolOptions);
    case 'lights-on':
      return replicate.lightsOn(imageUrl, presetPrompt, toolOptions);
    case 'window-masking':
      return replicate.windowMasking(imageUrl, presetPrompt, toolOptions);
    case 'color-balance':
      return replicate.colorBalance(imageUrl, presetPrompt, toolOptions);
    case 'hdr':
      return replicate.hdr(imageUrl, toolOptions);
    case 'auto-enhance':
      return replicate.autoEnhance(imageUrl, toolOptions);
    case 'perspective-correction':
      return replicate.perspectiveCorrection(imageUrl, toolOptions);
    case 'lens-correction':
      return replicate.lensCorrection(imageUrl, toolOptions);
    case 'reflection-removal':
      return replicate.reflectionRemoval(imageUrl, toolOptions);
    case 'power-line-removal':
      return replicate.powerLineRemoval(imageUrl, toolOptions);
    case 'object-removal':
      return replicate.objectRemoval(imageUrl, presetPrompt, toolOptions);
    case 'flash-fix':
      return replicate.flashFix(imageUrl, toolOptions);
    default:
      return replicate.autoEnhance(imageUrl, toolOptions);
  }
}

async function uploadToSupabase(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string,
  listingId: string,
  photoId: string,
  enhancedUrl: string
): Promise<string> {
  const response = await fetch(enhancedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch enhanced image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const storagePath = `enhanced/${userId}/${listingId}/${photoId}-prepared.jpg`;

  const { error } = await supabase.storage
    .from('raw-images')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return storagePath;
}

export default {
  async queue(batch: MessageBatch<JobMessage>, env: Env): Promise<void> {
    // Update process.env with real values
    updateProcessEnv(env);
    const {
      createSupabaseClient,
      updateJobStatus,
      updatePhotoStatus,
      updateListingPreparationStatus,
      getListingPhotos,
      createCheckpoint,
      getCheckpoint,
    } = await loadWorkerDeps();
    const { analyzePhotos, buildListingStrategy, determineLockedPresets } = await loadModules();
    
    console.log(`[Worker] Received batch of ${batch.messages.length} messages`);
    
    for (const message of batch.messages) {
      const { jobId, listingId, userId } = message.body;
      const costTracker = createCostTracker();
      
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
        
        const analysisConcurrency = env.ANALYSIS_CONCURRENCY
          ? Number(env.ANALYSIS_CONCURRENCY)
          : (env.ENVIRONMENT === 'production' ? 8 : 2);
        const analysisBatchDelayMs = env.ANALYSIS_BATCH_DELAY_MS
          ? Number(env.ANALYSIS_BATCH_DELAY_MS)
          : (env.ENVIRONMENT === 'production' ? 300 : 1500);

        const analyses = await analyzePhotos(photosForAnalysis, {
          maxConcurrency: Number.isFinite(analysisConcurrency) ? analysisConcurrency : 2,
          batchDelayMs: Number.isFinite(analysisBatchDelayMs) ? analysisBatchDelayMs : 1500,
          apiKey: env.OPENAI_API_KEY
        });
        console.log(`[Worker] Analysis complete for ${analyses.length} photos`);

        // Track analysis cost
        recordAnalysisCost(costTracker, analyses.length);

        const analysesById = new Map<string, PhotoAnalysis>();
        for (const analysis of analyses) {
          if (analysis?.photoId) {
            analysesById.set(analysis.photoId, analysis);
          }
        }
        
        const validAnalyses = analyses.filter(a => a && a.isValidPropertyPhoto !== false);
        console.log(`[Worker] Valid analyses: ${validAnalyses.length}/${analyses.length}`);

        if (validAnalyses.length === 0) {
          throw new Error("All photo analyses failed");
        }

        const strategy = buildListingStrategy(listingId, validAnalyses);
        const presets = determineLockedPresets(validAnalyses);
        console.log(`[Worker] Strategy: hero=${strategy.heroPhotoId}, tools=${strategy.photosRequiringWork}`);

        const strategyAudit = buildStrategyAudit(listingId, analysesById, strategy, presets);
        
        await createCheckpoint({
          jobId,
          completedPhotoIds: [],
          currentStage: 'processing',
          timestamp: Date.now(),
          strategySnapshot: strategyAudit
        } as ProcessingCheckpoint, env);
        
        const supabase = createSupabaseClient(env);

        console.log(`[Worker] Processing ${photos.length} photos`);
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const strategyForPhoto = strategy.photoStrategies.find(s => s.photoId === photo.id);
          const analysis = analysesById.get(photo.id);
          if (!strategyForPhoto || strategyForPhoto.skip) {
            await updatePhotoStatus(photo.id, 'completed', null, env);
            console.log(`[Worker] Photo ${i + 1}/${photos.length} skipped`);
            continue;
          }

          costTracker.photosProcessed++;
          let currentUrl = photo.signedUrl || photo.raw_url;
          let appliedAny = false;

          for (const tool of strategyForPhoto.toolOrder) {
            const toolStart = Date.now();
            try {
              const outputUrl = await runTool(tool, currentUrl, presets, analysis);
              const durationMs = Date.now() - toolStart;
              if (outputUrl) {
                currentUrl = outputUrl;
                appliedAny = true;
                recordToolCost(costTracker, tool, durationMs, true);
                console.log(`[Worker] Tool ${tool} completed in ${durationMs}ms (${getToolCost(tool)}¢)`);
              }
            } catch (toolError) {
              const durationMs = Date.now() - toolStart;
              recordToolCost(costTracker, tool, durationMs, false);
              console.error(`[Worker] Tool ${tool} failed for photo ${photo.id} in ${durationMs}ms:`, toolError);
            }
          }

          if (appliedAny && currentUrl !== (photo.signedUrl || photo.raw_url)) {
            const storagePath = await uploadToSupabase(supabase, userId, listingId, photo.id, currentUrl);
            await updatePhotoStatus(photo.id, 'completed', storagePath, env);
            console.log(`[Worker] Photo ${i + 1}/${photos.length} completed`);
          } else {
            await updatePhotoStatus(photo.id, 'completed', null, env);
            console.log(`[Worker] Photo ${i + 1}/${photos.length} completed (no changes)`);
          }
        }
        
        // Store cost summary in job metadata
        const costSummary = getCostSummary(costTracker);
        console.log(`[Worker] Job ${jobId} cost: ${costSummary.totalCostDollars} (${costSummary.toolsApplied} tools, ${costSummary.photosProcessed} photos)`);

        try {
          const { error: costError } = await supabase
            .from('jobs')
            .update({
              metadata: costSummary,
              updated_at: new Date().toISOString(),
            })
            .eq('id', jobId);
          if (costError) {
            console.error(`[Worker] Failed to store cost metadata for job ${jobId}:`, costError.message);
          }
        } catch (costWriteError) {
          console.error(`[Worker] Cost metadata write exception:`, costWriteError);
        }

        await updateListingPreparationStatus(listingId, 'prepared', env);
        await updateJobStatus(jobId, 'completed', env);
        console.log(`[Worker] Job ${jobId} completed successfully`);
        message.ack();
        
      } catch (error) {
        console.error(`[Worker] Job ${jobId} failed:`, error);

        // Store partial cost data even on failure
        const costSummary = getCostSummary(costTracker);
        if (costTracker.totalCostCents > 0) {
          try {
            const supabase = createSupabaseClient(env);
            await supabase
              .from('jobs')
              .update({
                metadata: { ...costSummary, failed: true },
                updated_at: new Date().toISOString(),
              })
              .eq('id', jobId);
          } catch (costWriteError) {
            console.error(`[Worker] Failed cost write on error path:`, costWriteError);
          }
        }

        try {
          await updateJobStatus(jobId, 'failed', env);
          await updateListingPreparationStatus(listingId, 'failed', env);
        } catch (updateError) {
          console.error(`[Worker] Failed to mark job ${jobId} as failed:`, updateError);
        }
        try {
          message.retry({ delaySeconds: 60 });
        } catch (retryError) {
          console.error(`[Worker] Failed to retry job ${jobId}:`, retryError);
        }
      }
    }
  },
  
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ 
        status: "ok", 
        version: "2.2.0-worker",
        environment: env.ENVIRONMENT || 'unknown'
      });
    }

    if (url.pathname === '/audit' && request.method === 'GET') {
      const { getCheckpoint } = await loadWorkerDeps();
      const jobId = url.searchParams.get('jobId');
      if (!jobId) {
        return Response.json({ error: 'jobId is required' }, { status: 400 });
      }

      const adminKey = request.headers.get('x-admin-key');
      if (env.WORKER_ADMIN_KEY && adminKey !== env.WORKER_ADMIN_KEY) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const checkpoint = await getCheckpoint(jobId, env);
      if (!checkpoint) {
        return Response.json({ error: 'No checkpoint found' }, { status: 404 });
      }

      return Response.json({
        jobId,
        currentStage: checkpoint.currentStage,
        timestamp: checkpoint.timestamp,
        strategy: checkpoint.strategySnapshot || null,
      });
    }
    
    
    if (url.pathname === '/process' && request.method === 'POST') {
      try {
        const body = await request.json();
        console.log(`[HTTP] Enqueuing job ${body.jobId}`);

        await env.SNAPR_QUEUE.send(body);

        return Response.json({
          status: "queued",
          jobId: body.jobId,
          message: "Job enqueued successfully"
        });
      } catch (error) {
        console.error('[HTTP] Failed to enqueue job:', error);
        const details = error instanceof Error ? error.message : String(error);
        return Response.json(
          { error: "Failed to enqueue job", details },
          { status: 500 }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
