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
    ANALYSIS_PROVIDER: (env as any).ANALYSIS_PROVIDER || '',
    ANALYSIS_REPLICATE_MODEL: (env as any).ANALYSIS_REPLICATE_MODEL || '',
    AI_ANALYSIS_FAIL_OPEN: (env as any).AI_ANALYSIS_FAIL_OPEN || '',
    ANALYSIS_CONCURRENCY: (env as any).ANALYSIS_CONCURRENCY || '',
    ANALYSIS_BATCH_DELAY_MS: (env as any).ANALYSIS_BATCH_DELAY_MS || '',
  };
  ensureProcessReportStub();
}

import type { Env, JobMessage, QueueMessage, MarketingJobMessage, ProcessingCheckpoint } from './types.js';
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
// PARALLEL PROCESSING CONFIGURATION
// ============================================

const PHOTO_CONCURRENCY = 8; // Process 8 photos simultaneously
// 30 photos / 8 = 4 batches × ~20s = ~80s processing
// 50 photos / 8 = 7 batches × ~20s = ~140s processing
// + analysis time (~60-90s) = total under 3min/5min targets

// ============================================
// RETRY & BACKOFF CONFIGURATION
// Only for catastrophic infrastructure failures
// (Supabase down, queue corruption)
// Tool failures NEVER fail a job — tools skip gracefully
// ============================================

const MAX_JOB_RETRIES = 3;
const BACKOFF_SECONDS = [60, 120, 240];

async function getRetryCount(jobId: string, env: { CHECKPOINTS: KVNamespace }): Promise<number> {
  try {
    const val = await env.CHECKPOINTS.get(`retry:${jobId}`);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

async function incrementRetryCount(jobId: string, env: { CHECKPOINTS: KVNamespace }): Promise<number> {
  const current = await getRetryCount(jobId, env);
  const next = current + 1;
  try {
    await env.CHECKPOINTS.put(`retry:${jobId}`, String(next), { expirationTtl: 86400 });
  } catch (e) {
    console.error(`[Retry] Failed to store retry count for ${jobId}:`, e);
  }
  return next;
}

async function clearRetryCount(jobId: string, env: { CHECKPOINTS: KVNamespace }): Promise<void> {
  try {
    await env.CHECKPOINTS.delete(`retry:${jobId}`);
  } catch {
    // Best effort
  }
}

function getBackoffSeconds(attempt: number): number {
  return BACKOFF_SECONDS[Math.min(attempt, BACKOFF_SECONDS.length - 1)];
}

// ============================================
// PER-TOOL TIMEOUT CONFIGURATION
// ============================================

const TOOL_TIMEOUT_MS: Record<string, number> = {
  'sky-replacement': 120000,   // SAM mask (~15s) + Kontext fallback (~30s) + queue wait
  'lawn-repair': 120000,       // Mask + Kontext fallback + queue wait
  'virtual-twilight': 120000,  // Kontext + queue wait
  'virtual-staging': 120000,   // Kontext + queue wait
  'declutter': 90000,
  'auto-enhance': 45000,       // Sharp.js via Vercel API — 45s for large images + cold start
  'hdr': 90000,
  'fire-fireplace': 90000,
  'tv-screen': 90000,
  'lights-on': 90000,
  'window-masking': 90000,
  'perspective-correction': 90000,
};

const DEFAULT_TOOL_TIMEOUT_MS = 60000;

function getToolTimeout(tool: string): number {
  return TOOL_TIMEOUT_MS[tool] ?? DEFAULT_TOOL_TIMEOUT_MS;
}

async function withToolTimeout<T>(promise: Promise<T>, tool: string): Promise<T> {
  const ms = getToolTimeout(tool);
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Tool ${tool} timeout after ${ms}ms`)), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
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

const ANALYSIS_COST_CENTS = 2;

function getToolCost(tool: string): number {
  return TOOL_COST_CENTS[tool] ?? 5;
}

interface ToolCostEntry {
  tool: string;
  costCents: number;
  durationMs: number;
  success: boolean;
}

interface CostTracker {
  toolCosts: ToolCostEntry[];
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
// PHOTO PROCESSING RESULT (per-photo report)
// ============================================

interface PhotoResult {
  photoId: string;
  toolsApplied: string[];
  toolsSkipped: Array<{ tool: string; reason: string }>;
  enhanced: boolean;
  storagePath: string | null;
  processingMs: number;
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

// ============================================
// QUICK ENHANCE (Sharp.js via Vercel API)
// Bypasses Replicate queue entirely — ~1-2s vs ~25-30s
// ============================================

async function runQuickEnhance(
  imageUrl: string,
  photoId: string,
  listingId: string,
  userId: string,
  env: Env
): Promise<string> {
  const quickUrl = env.QUICK_ENHANCE_URL;
  if (!quickUrl) {
    throw new Error('QUICK_ENHANCE_URL not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch(`${quickUrl}/api/enhance-quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': env.WORKER_ADMIN_KEY || '',
      },
      body: JSON.stringify({ imageUrl, photoId, listingId, userId }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Quick enhance API error ${res.status}: ${errText}`);
    }

    const data = await res.json() as { signedUrl: string; preset: string; timings: { totalMs: number } };
    console.log(`[Worker] Quick enhance: ${data.preset} preset in ${data.timings.totalMs}ms`);
    return data.signedUrl;
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Quick enhance timeout (40s)');
    }
    throw error;
  }
}

async function runTool(
  tool: ToolId,
  imageUrl: string,
  presets: LockedPresets,
  analysis?: PhotoAnalysis,
  toolContext?: { photoId: string; listingId: string; userId: string; env: Env }
): Promise<string> {
  // Route auto-enhance through Sharp.js API (fast, free, no queue)
  if (tool === 'auto-enhance' && toolContext?.env.QUICK_ENHANCE_URL) {
    return runQuickEnhance(
      imageUrl,
      toolContext.photoId,
      toolContext.listingId,
      toolContext.userId,
      toolContext.env
    );
  }

  const presetPrompt = getPresetPrompt(tool, presets);
  const toolOptions = getToolStrength(tool, analysis);
  const { replicate } = await loadModules();

  // Wrap every tool call in per-tool timeout
  const execute = (): Promise<string> => {
    switch (tool) {
      case 'sky-replacement':
        return replicate.skyReplacement(imageUrl, presetPrompt, undefined, { ...toolOptions, skipMask: true });
      case 'virtual-twilight':
        return replicate.virtualTwilight(imageUrl, presetPrompt, toolOptions);
      case 'lawn-repair':
        return replicate.lawnRepair(imageUrl, presetPrompt, undefined, { ...toolOptions, skipMask: true });
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
        // Fallback if QUICK_ENHANCE_URL not set
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
  };

  return withToolTimeout(execute(), tool);
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

// ============================================
// SINGLE PHOTO PROCESSOR
// Processes one photo's entire tool chain.
// Tool failures skip gracefully — never kill the photo or job.
// ============================================

async function processOnePhoto(
  photo: { id: string; signedUrl?: string; raw_url: string },
  photoIndex: number,
  totalPhotos: number,
  strategyForPhoto: { toolOrder: ToolId[]; skip?: boolean } | undefined,
  analysis: PhotoAnalysis | undefined,
  presets: LockedPresets,
  costTracker: CostTracker,
  supabase: any,
  userId: string,
  listingId: string,
  env: Env
): Promise<PhotoResult> {
  const photoStart = Date.now();
  const { updatePhotoStatus } = await loadWorkerDeps();

  // Skip if no strategy or explicitly skipped
  if (!strategyForPhoto || strategyForPhoto.skip) {
    await updatePhotoStatus(photo.id, 'completed', null, env);
    console.log(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} skipped`);
    return {
      photoId: photo.id,
      toolsApplied: [],
      toolsSkipped: [],
      enhanced: false,
      storagePath: null,
      processingMs: Date.now() - photoStart,
    };
  }

  costTracker.photosProcessed++;
  let currentUrl = photo.signedUrl || photo.raw_url;
  let appliedAny = false;
  const toolsApplied: string[] = [];
  const toolsSkipped: Array<{ tool: string; reason: string }> = [];

  for (const tool of strategyForPhoto.toolOrder) {
    const toolStart = Date.now();
    try {
      const outputUrl = await runTool(tool, currentUrl, presets, analysis, {
            photoId: photo.id, listingId, userId, env,
          });
      const durationMs = Date.now() - toolStart;
      if (outputUrl) {
        currentUrl = outputUrl;
        appliedAny = true;
        toolsApplied.push(tool);
        recordToolCost(costTracker, tool, durationMs, true);
        console.log(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} tool ${tool} ✓ ${durationMs}ms (${getToolCost(tool)}¢)`);
      }
    } catch (toolError: unknown) {
      const message = toolError instanceof Error ? toolError.message : 'Unknown error';
      const durationMs = Date.now() - toolStart;
      const isTimeout = message?.includes('timeout');
      const firstReason = isTimeout ? `timeout (${getToolTimeout(tool)}ms)` : (message || 'unknown error');

      // Retry high-value structural tools once
      const isStructuralTool = ['sky-replacement', 'lawn-repair'].includes(tool);
      if (isStructuralTool) {
        console.warn(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} tool ${tool} RETRYING (first: ${firstReason})`);
        try {
          const retryStart = Date.now();
          const retryUrl = await runTool(tool, currentUrl, presets, analysis, {
            photoId: photo.id, listingId, userId, env,
          });
          if (retryUrl) {
            currentUrl = retryUrl;
            appliedAny = true;
            toolsApplied.push(tool);
            recordToolCost(costTracker, tool, Date.now() - retryStart, true);
            console.log(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} tool ${tool} ✓ RETRY SUCCESS ${Date.now() - retryStart}ms`);
            continue;
          }
        } catch (retryError: unknown) {
          const message = retryError instanceof Error ? retryError.message : 'Request failed';
          console.warn(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} tool ${tool} RETRY ALSO FAILED: ${message}`);
        }
      }

      toolsSkipped.push({ tool, reason: firstReason });
      recordToolCost(costTracker, tool, durationMs, false);
      console.warn(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} tool ${tool} SKIPPED: ${firstReason}`);
    }
  }

  let storagePath: string | null = null;
  if (appliedAny && currentUrl !== (photo.signedUrl || photo.raw_url)) {
    try {
      storagePath = await uploadToSupabase(supabase, userId, listingId, photo.id, currentUrl);
      await updatePhotoStatus(photo.id, 'completed', storagePath, env, toolsApplied);
    } catch (uploadError: unknown) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      console.error(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} upload failed: ${message}`);
      await updatePhotoStatus(photo.id, 'completed', null, env, toolsApplied);
    }
  } else {
    console.warn(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} NO UPLOAD: appliedAny=${appliedAny} urlChanged=${currentUrl !== (photo.signedUrl || photo.raw_url)}`);
    if (currentUrl) console.warn(`[Worker]   currentUrl: ${currentUrl.substring(0, 100)}`);
    console.warn(`[Worker]   originalUrl: ${(photo.signedUrl || photo.raw_url)?.substring(0, 100)}`);
    await updatePhotoStatus(photo.id, 'completed', null, env);
  }

  const processingMs = Date.now() - photoStart;
  console.log(`[Worker] Photo ${photoIndex + 1}/${totalPhotos} done in ${processingMs}ms (${toolsApplied.length} applied, ${toolsSkipped.length} skipped)`);

  return {
    photoId: photo.id,
    toolsApplied,
    toolsSkipped,
    enhanced: appliedAny,
    storagePath,
    processingMs,
  };
}

export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    // Update process.env with real values
    updateProcessEnv(env);

    console.log(`[Worker] Received batch of ${batch.messages.length} messages`);

    for (const message of batch.messages) {
      const body = message.body;

      // Phase 2: Route marketing jobs to dedicated handler
      if (body.type === 'marketing') {
        try {
          const { handleMarketingJob } = await import('./marketing-handler.js');
          await handleMarketingJob(body as MarketingJobMessage, env);
          message.ack();
        } catch (error) {
          console.error(`[Worker] Marketing job ${body.jobId} failed:`, error);
          message.ack(); // Don't retry marketing failures — artifacts are best-effort
        }
        continue;
      }

      // Phase 1: Preparation job (existing logic)
      // Backwards compatible: messages without type are treated as preparation
    }

    // Re-enter the preparation loop (existing logic below)
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

    for (const message of batch.messages) {
      const body = message.body;
      // Skip marketing messages (already handled above)
      if (body.type === 'marketing') continue;

      const { jobId, listingId, userId } = body;
      const costTracker = createCostTracker();
      const jobStart = Date.now();
      
      try {
        // Check retry count — only for infrastructure failures
        const retryCount = await getRetryCount(jobId, env);
        if (retryCount >= MAX_JOB_RETRIES) {
          console.error(`[Worker] Job ${jobId} exceeded max retries (${retryCount}/${MAX_JOB_RETRIES}). Dead-lettering.`);
          await updateJobStatus(jobId, 'failed', env);
          await updateListingPreparationStatus(listingId, 'failed', env);
          const supabase = createSupabaseClient(env);
          await supabase
            .from('jobs')
            .update({
              metadata: {
                ...getCostSummary(costTracker),
                failed: true,
                failureReason: `Exceeded max retries (${MAX_JOB_RETRIES}) due to infrastructure errors`,
                retryCount,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', jobId);
          await clearRetryCount(jobId, env);
          message.ack();
          continue;
        }

        console.log(`[Worker] Processing job ${jobId} for listing ${listingId} (attempt ${retryCount + 1})`);
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
        
        // =============================================
        // PHASE 1: ANALYSIS (parallel, concurrency 8)
        // =============================================
        const analysisStart = Date.now();
        console.log(`[Worker] Analyzing ${photos.length} photos with V2 engine (concurrency: 8)`);
        const photosForAnalysis = photos.map(p => ({
          id: p.id, 
          url: p.signedUrl || p.raw_url 
        }));
        
        // Always use concurrency 8 for analysis — GPT-4o handles it fine
        const analysisConcurrency = env.ANALYSIS_CONCURRENCY
          ? Number(env.ANALYSIS_CONCURRENCY)
          : 8;
        const analysisBatchDelayMs = env.ANALYSIS_BATCH_DELAY_MS
          ? Number(env.ANALYSIS_BATCH_DELAY_MS)
          : 300;

        // Create OpenAI client from worker env — explicit DI, no process.env fallback
        const { default: OpenAI } = await import('openai');
        const openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });

        const analyses = await analyzePhotos(photosForAnalysis, {
          maxConcurrency: Number.isFinite(analysisConcurrency) ? analysisConcurrency : 8,
          batchDelayMs: Number.isFinite(analysisBatchDelayMs) ? analysisBatchDelayMs : 300,
          client: openaiClient,
        });
        const analysisMs = Date.now() - analysisStart;
        console.log(`[Worker] Analysis complete: ${analyses.length} photos in ${(analysisMs / 1000).toFixed(1)}s`);

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

        // Pass ALL analyses to strategy builder — it handles skips internally
        // This ensures every photo gets a strategy (even if it's just auto-enhance)
        const strategy = buildListingStrategy(listingId, analyses);
        const presets = determineLockedPresets(analyses);
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

        // =============================================
        // PHASE 2: PROCESSING (parallel, concurrency 8)
        // Process photos in batches of PHOTO_CONCURRENCY
        // Each photo applies its tools sequentially
        // Tool failures skip gracefully — job ALWAYS completes
        // =============================================
        const processingStart = Date.now();
        console.log(`[Worker] Processing ${photos.length} photos with concurrency: ${PHOTO_CONCURRENCY}`);

        const allPhotoResults: PhotoResult[] = [];

        for (let batchStart = 0; batchStart < photos.length; batchStart += PHOTO_CONCURRENCY) {
          const batchEnd = Math.min(batchStart + PHOTO_CONCURRENCY, photos.length);
          const batch = photos.slice(batchStart, batchEnd);
          const batchNum = Math.floor(batchStart / PHOTO_CONCURRENCY) + 1;
          const totalBatches = Math.ceil(photos.length / PHOTO_CONCURRENCY);

          console.log(`[Worker] Batch ${batchNum}/${totalBatches}: photos ${batchStart + 1}-${batchEnd}`);

          const batchResults = await Promise.all(
            batch.map((photo, idx) => {
              const globalIdx = batchStart + idx;
              const strategyForPhoto = strategy.photoStrategies.find(
                (s: any) => s.photoId === photo.id
              );
              const analysis = analysesById.get(photo.id);

              return processOnePhoto(
                photo,
                globalIdx,
                photos.length,
                strategyForPhoto,
                analysis,
                presets,
                costTracker,
                supabase,
                userId,
                listingId,
                env
              );
            })
          );

          allPhotoResults.push(...batchResults);
        }

        const processingMs = Date.now() - processingStart;
        const totalMs = Date.now() - jobStart;
        const enhancedCount = allPhotoResults.filter(r => r.enhanced).length;
        const skippedToolsTotal = allPhotoResults.reduce((sum, r) => sum + r.toolsSkipped.length, 0);

        console.log(`[Worker] ═══════════════════════════════════════`);
        console.log(`[Worker] JOB COMPLETE: ${jobId}`);
        console.log(`[Worker] Photos: ${photos.length} total, ${enhancedCount} enhanced`);
        console.log(`[Worker] Analysis: ${(analysisMs / 1000).toFixed(1)}s`);
        console.log(`[Worker] Processing: ${(processingMs / 1000).toFixed(1)}s`);
        console.log(`[Worker] Total: ${(totalMs / 1000).toFixed(1)}s`);
        if (skippedToolsTotal > 0) {
          console.log(`[Worker] Skipped tools: ${skippedToolsTotal} (see photo details)`);
        }
        console.log(`[Worker] ═══════════════════════════════════════`);

        // Store cost summary + photo results in job metadata
        const costSummary = getCostSummary(costTracker);
        const jobMetadata = {
          ...costSummary,
          totalDurationMs: totalMs,
          analysisDurationMs: analysisMs,
          processingDurationMs: processingMs,
          photoResults: allPhotoResults.map(r => ({
            photoId: r.photoId,
            enhanced: r.enhanced,
            toolsApplied: r.toolsApplied,
            toolsSkipped: r.toolsSkipped,
            processingMs: r.processingMs,
          })),
        };

        try {
          await supabase
            .from('jobs')
            .update({
              metadata: jobMetadata,
              updated_at: new Date().toISOString(),
            })
            .eq('id', jobId);
        } catch (costWriteError) {
          console.error(`[Worker] Cost metadata write exception:`, costWriteError);
        }

        // Build preparation metadata for UI (confidence, per-photo audit, hero)
        const confidence = photos.length > 0 ? Math.round((enhancedCount / photos.length) * 100) : 0;
        const photoAudit: Record<string, {
          toolsApplied: string[];
          toolsSkipped: Array<{ tool: string; reason: string }>;
          enhanced: boolean;
          processingMs: number;
        }> = {};
        for (const r of allPhotoResults) {
          photoAudit[r.photoId] = {
            toolsApplied: r.toolsApplied,
            toolsSkipped: r.toolsSkipped,
            enhanced: r.enhanced,
            processingMs: r.processingMs,
          };
        }

        // Job ALWAYS completes — tool failures are logged, not fatal
        await updateListingPreparationStatus(listingId, 'prepared', env, {
          confidence,
          photoAudit,
          heroPhotoId: strategy.heroPhotoId,
          totalPhotos: photos.length,
          enhancedPhotos: enhancedCount,
        });
        await updateJobStatus(jobId, 'completed', env);
        await clearRetryCount(jobId, env);
        console.log(`[Worker] Job ${jobId} completed — cost: $${costSummary.totalCostDollars}`);

        // =============================================
        // PHASE 2: AUTO-TRIGGER MARKETING
        // Listing is prepared → enqueue marketing job
        // =============================================
        try {
          const marketingJobId = crypto.randomUUID();
          const supabaseForMarketing = createSupabaseClient(env);
          await supabaseForMarketing
            .from('marketing_jobs')
            .insert({
              id: marketingJobId,
              listing_id: listingId,
              user_id: userId,
              status: 'queued',
            });

          await env.SNAPR_QUEUE.send({
            type: 'marketing' as const,
            jobId: marketingJobId,
            listingId,
            userId,
          });

          console.log(`[Worker] Marketing job ${marketingJobId} auto-triggered for listing ${listingId}`);
        } catch (marketingError) {
          // Marketing trigger failure is non-fatal — preparation is already complete
          console.error(`[Worker] Failed to auto-trigger marketing for listing ${listingId}:`, marketingError);
        }

        message.ack();
        
      } catch (error) {
        // This catch is ONLY for infrastructure failures:
        // - Supabase unreachable
        // - Can't fetch photos
        // - All analyses failed (no valid photos at all)
        // Tool-level failures are handled inside processOnePhoto and never reach here.
        console.error(`[Worker] Job ${jobId} INFRASTRUCTURE ERROR:`, error);

        // Store partial cost data
        const costSummary = getCostSummary(costTracker);
        if (costTracker.totalCostCents > 0) {
          try {
            const supabase = createSupabaseClient(env);
            await supabase
              .from('jobs')
              .update({
                metadata: { ...costSummary, failed: true, error: String(error) },
                updated_at: new Date().toISOString(),
              })
              .eq('id', jobId);
          } catch (costWriteError) {
            console.error(`[Worker] Failed cost write on error path:`, costWriteError);
          }
        }

        // Retry with exponential backoff for infrastructure failures
        const retryCount = await incrementRetryCount(jobId, env);
        if (retryCount >= MAX_JOB_RETRIES) {
          console.error(`[Worker] Job ${jobId} permanently failed after ${retryCount} infrastructure retries.`);
          try {
            await updateJobStatus(jobId, 'failed', env);
            await updateListingPreparationStatus(listingId, 'failed', env);
          } catch (updateError) {
            console.error(`[Worker] Failed to mark job as failed:`, updateError);
          }
          message.ack();
        } else {
          const backoffSeconds = getBackoffSeconds(retryCount - 1);
          console.log(`[Worker] Infrastructure retry ${retryCount}/${MAX_JOB_RETRIES} in ${backoffSeconds}s`);
          try {
            await updateJobStatus(jobId, 'queued', env);
            message.retry({ delaySeconds: backoffSeconds });
          } catch (retryError) {
            console.error(`[Worker] Failed to retry:`, retryError);
            message.ack();
          }
        }
      }
    }
  },
  
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({ 
        status: "ok", 
        version: "3.0.0-worker",
        features: ["parallel-processing", "per-tool-timeout", "retry-backoff", "cost-tracking"],
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
      if (!env.WORKER_ADMIN_KEY || adminKey !== env.WORKER_ADMIN_KEY) {
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
      // Auth check — require WORKER_ADMIN_KEY
      const processAdminKey = request.headers.get('x-admin-key');
      if (!env.WORKER_ADMIN_KEY || processAdminKey !== env.WORKER_ADMIN_KEY) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

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
