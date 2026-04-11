/**
 * SnapR AI Engine V3 - Provider Router
 * =====================================
 * Routes each tool to the BEST provider for that specific task
 * 
 * PROVIDERS:
 * 1. AutoEnhance.ai - Professional real estate, fast, reliable
 * 2. FLUX Kontext - Creative transformations, high quality
 * 3. SDXL Lightning - Fast seasonal changes
 * 4. SAM-2 - Precise segmentation
 * 
 * STRATEGY:
 * - Use AutoEnhance for "technical" fixes (HDR, perspective, lens)
 * - Use FLUX for "creative" edits (sky, twilight, staging)
 * - Use specialized models where they excel
 */

import { ToolId } from '../router';

// ============================================
// PROVIDER HEALTH TRACKING (Circuit Breaker)
// ============================================

/** How long an unhealthy provider stays in "cooldown" before retrying (ms) */
const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000; // 60 seconds

/** Consecutive failures before tripping the circuit breaker */
const CIRCUIT_BREAKER_THRESHOLD = 3;

/** Rolling window size for success rate and latency calculations */
const ROLLING_WINDOW_SIZE = 50;

export interface ProviderHealth {
  lastSuccess: number;          // timestamp (ms)
  lastFailure: number;          // timestamp (ms)
  consecutiveFailures: number;
  successRate: number;           // rolling average 0-1
  avgLatencyMs: number;          // rolling average
  isHealthy: boolean;
  /** Internal rolling window of recent results (true = success) */
  _recentResults: boolean[];
  /** Internal rolling window of recent latencies (ms) */
  _recentLatencies: number[];
}

function createDefaultHealth(): ProviderHealth {
  return {
    lastSuccess: 0,
    lastFailure: 0,
    consecutiveFailures: 0,
    successRate: 1,
    avgLatencyMs: 0,
    isHealthy: true,
    _recentResults: [],
    _recentLatencies: [],
  };
}

const providerHealth: Map<Provider, ProviderHealth> = new Map();

/**
 * Get current health state for a provider (creates default if not tracked yet)
 */
function getHealth(provider: Provider): ProviderHealth {
  let health = providerHealth.get(provider);
  if (!health) {
    health = createDefaultHealth();
    providerHealth.set(provider, health);
  }
  return health;
}

/**
 * Record the outcome of a provider call. Updates rolling success rate,
 * latency, and triggers circuit breaker after consecutive failures.
 */
export function recordProviderResult(
  provider: Provider,
  success: boolean,
  latencyMs: number,
): void {
  const health = getHealth(provider);
  const now = Date.now();

  // Update rolling windows (fixed-size ring buffer behavior)
  health._recentResults.push(success);
  if (health._recentResults.length > ROLLING_WINDOW_SIZE) {
    health._recentResults.shift();
  }

  health._recentLatencies.push(latencyMs);
  if (health._recentLatencies.length > ROLLING_WINDOW_SIZE) {
    health._recentLatencies.shift();
  }

  // Recompute rolling averages
  const totalResults = health._recentResults.length;
  const successes = health._recentResults.filter(Boolean).length;
  health.successRate = totalResults > 0 ? successes / totalResults : 1;

  const totalLatencies = health._recentLatencies.length;
  health.avgLatencyMs =
    totalLatencies > 0
      ? health._recentLatencies.reduce((sum, l) => sum + l, 0) / totalLatencies
      : 0;

  if (success) {
    health.lastSuccess = now;
    health.consecutiveFailures = 0;
    health.isHealthy = true;
  } else {
    health.lastFailure = now;
    health.consecutiveFailures += 1;

    // Trip circuit breaker after threshold consecutive failures
    if (health.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      health.isHealthy = false;
    }
  }
}

/**
 * Check whether a provider is currently considered healthy.
 * An unhealthy provider recovers automatically after the cooldown period.
 */
function isProviderHealthy(provider: Provider): boolean {
  const health = getHealth(provider);
  if (health.isHealthy) return true;

  // Auto-recover after cooldown — allow a retry
  const now = Date.now();
  if (now - health.lastFailure >= CIRCUIT_BREAKER_COOLDOWN_MS) {
    health.isHealthy = true;
    health.consecutiveFailures = 0;
    return true;
  }

  return false;
}

/**
 * Get the best *healthy* provider for a tool.
 *
 * 1. If the primary provider is healthy, return its config unchanged.
 * 2. If the primary is unhealthy and a fallback exists AND is healthy,
 *    return a config that swaps to the fallback provider.
 * 3. If both are unhealthy, return the primary anyway (fail-open).
 */
export function getHealthyProviderForTool(toolId: ToolId): ProviderConfig {
  const config = getProviderForTool(toolId);

  if (isProviderHealthy(config.provider)) {
    return config;
  }

  // Primary is unhealthy — try fallback
  const fallback = config.fallbackProvider;
  if (fallback && isProviderHealthy(fallback)) {
    return {
      ...config,
      provider: fallback,
      // Slightly lower priority since this is a fallback route
      priority: config.priority + 1,
    };
  }

  // Both unhealthy — fail-open with primary
  return config;
}

/**
 * Get a snapshot of health data for all tracked providers.
 * Useful for diagnostics / status endpoints.
 */
export function getProviderHealthSnapshot(): Map<Provider, Omit<ProviderHealth, '_recentResults' | '_recentLatencies'>> {
  const snapshot = new Map<Provider, Omit<ProviderHealth, '_recentResults' | '_recentLatencies'>>();
  for (const [provider, health] of providerHealth) {
    const { _recentResults: _r, _recentLatencies: _l, ...rest } = health;
    snapshot.set(provider, rest);
  }
  return snapshot;
}

/**
 * Reset health state for a specific provider (useful for testing).
 */
export function resetProviderHealth(provider: Provider): void {
  providerHealth.set(provider, createDefaultHealth());
}

// ============================================
// PROVIDER DEFINITIONS
// ============================================

export type Provider =
  | 'autoenhance'      // Professional real estate API
  | 'flux-kontext'     // Creative transformations
  | 'flux-fill'        // Masked inpainting
  | 'flux-multipass'   // Multi-pass twilight
  | 'sdxl-lightning'   // Fast seasonal
  | 'sam-flux'         // SAM detection + FLUX edit
  | 'sharp';           // Local image processing

export interface ProviderConfig {
  provider: Provider;
  priority: number;        // 1 = highest priority
  avgDuration: number;     // Average processing time in seconds
  costPerImage: number;    // Cost in USD
  reliability: number;     // 0-100 success rate
  qualityScore: number;    // 0-100 typical output quality
  supportsRetry: boolean;
  fallbackProvider?: Provider;
}

// ============================================
// TOOL → PROVIDER ROUTING
// ============================================

export const TOOL_ROUTING: Record<ToolId, ProviderConfig> = {
  // ═══════════════════════════════════════════
  // ENHANCEMENT TOOLS - Use AutoEnhance (best for technical)
  // ═══════════════════════════════════════════
  'hdr': {
    provider: 'autoenhance',
    priority: 1,
    avgDuration: 8,
    costPerImage: 0.10,
    reliability: 98,
    qualityScore: 95,
    supportsRetry: true,
    fallbackProvider: 'flux-kontext',
  },
  'auto-enhance': {
    provider: 'autoenhance',
    priority: 1,
    avgDuration: 8,
    costPerImage: 0.10,
    reliability: 98,
    qualityScore: 95,
    supportsRetry: true,
    fallbackProvider: 'flux-kontext',
  },
  'perspective-correction': {
    provider: 'autoenhance',
    priority: 1,
    avgDuration: 10,
    costPerImage: 0.10,
    reliability: 95,
    qualityScore: 92,
    supportsRetry: true,
    fallbackProvider: 'flux-kontext',
  },
  'lens-correction': {
    provider: 'autoenhance',
    priority: 1,
    avgDuration: 10,
    costPerImage: 0.10,
    reliability: 95,
    qualityScore: 90,
    supportsRetry: true,
    fallbackProvider: 'flux-kontext',
  },

  // ═══════════════════════════════════════════
  // EXTERIOR TOOLS - Use FLUX (best for creative)
  // ═══════════════════════════════════════════
  'sky-replacement': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 20,
    costPerImage: 0.05,
    reliability: 92,
    qualityScore: 90,
    supportsRetry: true,
  },
  'virtual-twilight': {
    provider: 'flux-multipass',
    priority: 1,
    avgDuration: 45,  // Two passes
    costPerImage: 0.10,
    reliability: 88,
    qualityScore: 95,
    supportsRetry: true,
    fallbackProvider: 'flux-kontext',
  },
  'lawn-repair': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 20,
    costPerImage: 0.05,
    reliability: 90,
    qualityScore: 88,
    supportsRetry: true,
  },
  'pool-enhance': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 18,
    costPerImage: 0.05,
    reliability: 92,
    qualityScore: 90,
    supportsRetry: true,
  },

  // ═══════════════════════════════════════════
  // INTERIOR TOOLS - Use FLUX
  // ═══════════════════════════════════════════
  'declutter': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 25,
    costPerImage: 0.05,
    reliability: 85,
    qualityScore: 85,
    supportsRetry: true,
  },
  'virtual-staging': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 30,
    costPerImage: 0.05,
    reliability: 82,
    qualityScore: 88,
    supportsRetry: true,
  },
  'fire-fireplace': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 18,
    costPerImage: 0.05,
    reliability: 88,
    qualityScore: 85,
    supportsRetry: true,
  },
  'tv-screen': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 18,
    costPerImage: 0.05,
    reliability: 85,
    qualityScore: 82,
    supportsRetry: true,
  },
  'lights-on': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 18,
    costPerImage: 0.05,
    reliability: 88,
    qualityScore: 85,
    supportsRetry: true,
  },
  'window-masking': {
    provider: 'sam-flux',
    priority: 1,
    avgDuration: 30,
    costPerImage: 0.08,
    reliability: 80,
    qualityScore: 88,
    supportsRetry: true,
    fallbackProvider: 'flux-kontext',
  },
  'color-balance': {
    provider: 'flux-kontext',
    priority: 2,
    avgDuration: 15,
    costPerImage: 0.05,
    reliability: 92,
    qualityScore: 85,
    supportsRetry: true,
  },

  // ═══════════════════════════════════════════
  // SEASONAL TOOLS - Use SDXL (fast)
  // ═══════════════════════════════════════════
  'snow-removal': {
    provider: 'sdxl-lightning',
    priority: 1,
    avgDuration: 8,
    costPerImage: 0.03,
    reliability: 85,
    qualityScore: 80,
    supportsRetry: true,
    fallbackProvider: 'flux-kontext',
  },
  'seasonal-spring': {
    provider: 'sdxl-lightning',
    priority: 1,
    avgDuration: 8,
    costPerImage: 0.03,
    reliability: 85,
    qualityScore: 80,
    supportsRetry: true,
  },
  'seasonal-summer': {
    provider: 'sdxl-lightning',
    priority: 1,
    avgDuration: 8,
    costPerImage: 0.03,
    reliability: 85,
    qualityScore: 80,
    supportsRetry: true,
  },
  'seasonal-fall': {
    provider: 'sdxl-lightning',
    priority: 1,
    avgDuration: 8,
    costPerImage: 0.03,
    reliability: 85,
    qualityScore: 80,
    supportsRetry: true,
  },

  // ═══════════════════════════════════════════
  // FIX TOOLS - Use FLUX
  // ═══════════════════════════════════════════
  'reflection-removal': {
    provider: 'flux-kontext',
    priority: 2,
    avgDuration: 20,
    costPerImage: 0.05,
    reliability: 82,
    qualityScore: 82,
    supportsRetry: true,
  },
  'power-line-removal': {
    provider: 'flux-kontext',
    priority: 2,
    avgDuration: 20,
    costPerImage: 0.05,
    reliability: 85,
    qualityScore: 85,
    supportsRetry: true,
  },
  'object-removal': {
    provider: 'flux-kontext',
    priority: 2,
    avgDuration: 22,
    costPerImage: 0.05,
    reliability: 80,
    qualityScore: 80,
    supportsRetry: true,
  },
  'flash-fix': {
    provider: 'flux-kontext',
    priority: 1,
    avgDuration: 18,
    costPerImage: 0.05,
    reliability: 88,
    qualityScore: 85,
    supportsRetry: true,
  },
};

// ============================================
// ROUTING FUNCTIONS
// ============================================

/**
 * Get the best provider for a specific tool
 */
export function getProviderForTool(toolId: ToolId): ProviderConfig {
  const config = TOOL_ROUTING[toolId];
  if (!config) {
    // Default to FLUX for unknown tools
    return {
      provider: 'flux-kontext',
      priority: 2,
      avgDuration: 25,
      costPerImage: 0.05,
      reliability: 80,
      qualityScore: 80,
      supportsRetry: true,
    };
  }
  return config;
}

/**
 * Get fallback provider if primary fails
 */
export function getFallbackProvider(toolId: ToolId): Provider | null {
  const config = TOOL_ROUTING[toolId];
  return config?.fallbackProvider || null;
}

/**
 * Estimate processing time for a list of tools
 */
export function estimateProcessingTime(tools: ToolId[]): number {
  let totalTime = 0;
  for (const tool of tools) {
    const config = TOOL_ROUTING[tool];
    totalTime += config?.avgDuration || 20;
  }
  return totalTime;
}

/**
 * Estimate cost for a list of tools
 */
export function estimateCost(tools: ToolId[]): number {
  let totalCost = 0;
  for (const tool of tools) {
    const config = TOOL_ROUTING[tool];
    totalCost += config?.costPerImage || 0.05;
  }
  return totalCost;
}

/**
 * Check if a tool should use AutoEnhance
 */
export function shouldUseAutoEnhance(toolId: ToolId): boolean {
  const config = TOOL_ROUTING[toolId];
  return config?.provider === 'autoenhance';
}

/**
 * Check if a tool should use multi-pass processing
 */
export function shouldUseMultiPass(toolId: ToolId): boolean {
  const config = TOOL_ROUTING[toolId];
  return config?.provider === 'flux-multipass';
}

/**
 * Get all tools that use a specific provider
 */
export function getToolsForProvider(provider: Provider): ToolId[] {
  return Object.entries(TOOL_ROUTING)
    .filter(([_, config]) => config.provider === provider)
    .map(([toolId, _]) => toolId as ToolId);
}

// ============================================
// PROVIDER STATUS CHECK
// ============================================

interface ProviderStatus {
  provider: Provider;
  isAvailable: boolean;
  lastChecked: Date;
  errorMessage?: string;
}

const _providerStatuses: Map<Provider, ProviderStatus> = new Map();

/**
 * Check if AutoEnhance API is configured
 */
export function isAutoEnhanceConfigured(): boolean {
  return Boolean(((typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>).AUTOENHANCE_API_KEY);
}

/**
 * Check if Replicate is configured
 */
export function isReplicateConfigured(): boolean {
  return Boolean(((typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>).REPLICATE_API_TOKEN);
}

/**
 * Get provider status summary
 */
export function getProviderStatusSummary(): string {
  const lines: string[] = [];
  
  lines.push('🔌 Provider Status');
  lines.push('━━━━━━━━━━━━━━━━━━');
  
  lines.push(`AutoEnhance.ai: ${isAutoEnhanceConfigured() ? '✅ Configured' : '❌ Not configured'}`);
  lines.push(`Replicate: ${isReplicateConfigured() ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!isAutoEnhanceConfigured()) {
    lines.push('');
    lines.push('⚠️  AutoEnhance not configured - falling back to FLUX for HDR/Perspective');
    lines.push('   Set AUTOENHANCE_API_KEY for best quality on technical fixes');
  }
  
  return lines.join('\n');
}

// ============================================
// ROUTING SUMMARY
// ============================================

export function getRoutingSummary(tools: ToolId[]): string {
  const lines: string[] = [];
  
  const byProvider: Record<Provider, ToolId[]> = {
    'autoenhance': [],
    'flux-kontext': [],
    'flux-fill': [],
    'flux-multipass': [],
    'sdxl-lightning': [],
    'sam-flux': [],
    'sharp': [],
  };
  
  for (const tool of tools) {
    const config = getProviderForTool(tool);
    byProvider[config.provider].push(tool);
  }
  
  lines.push('🛣️  Tool Routing');
  lines.push('━━━━━━━━━━━━━━━');
  
  for (const [provider, toolList] of Object.entries(byProvider)) {
    if (toolList.length > 0) {
      lines.push(`${provider}: ${toolList.join(', ')}`);
    }
  }
  
  lines.push('');
  lines.push(`⏱️  Estimated time: ${estimateProcessingTime(tools)}s`);
  lines.push(`💰 Estimated cost: $${estimateCost(tools).toFixed(2)}`);
  
  return lines.join('\n');
}
