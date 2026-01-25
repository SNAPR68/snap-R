/**
 * SnapR V3 - Tool Executor
 * =========================
 * 
 * Connects V3 strategy decisions to actual tool execution.
 * Maps ToolId to Replicate/Sharp functions.
 */

import { ToolId } from './decision-engine/types';
import { PhotoStrategy } from './decision-engine/types';
import * as replicate from './providers/replicate';
import { autoEnhance as sharpEnhance } from './providers/sharp-enhance';

// ============================================
// TYPES
// ============================================

export interface ToolExecutionResult {
  tool: ToolId;
  success: boolean;
  inputUrl: string;
  outputUrl?: string;
  outputBuffer?: Buffer;
  timeMs: number;
  cost: number;
  error?: string;
}

export interface PhotoExecutionResult {
  photoId: string;
  success: boolean;
  finalUrl?: string;
  toolResults: ToolExecutionResult[];
  totalTimeMs: number;
  totalCost: number;
  error?: string;
}

// ============================================
// TOOL COSTS (from types.ts)
// ============================================

const TOOL_COSTS: Record<ToolId, number> = {
  'sky-replacement': 0.05,
  'virtual-twilight': 0.08,
  'lawn-repair': 0.05,
  'pool-enhance': 0.05,
  'declutter': 0.06,
  'virtual-staging': 0.10,
  'fire-fireplace': 0.04,
  'tv-screen': 0.04,
  'lights-on': 0.04,
  'hdr': 0.03,
  'auto-enhance': 0.00, // FREE with Sharp.js
  'perspective-correction': 0.04,
  'window-masking': 0.06,
  'flash-fix': 0.03,
};

// ============================================
// TOOL EXECUTOR
// ============================================

/**
 * Execute a single tool
 */
export async function executeTool(
  tool: ToolId,
  imageUrl: string,
  preset?: string
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  
  console.log(`[V3 Executor] Running ${tool} on image...`);
  
  try {
    let outputUrl: string;
    
    switch (tool) {
      case 'sky-replacement':
        outputUrl = await replicate.skyReplacement(imageUrl, preset);
        break;
        
      case 'virtual-twilight':
        outputUrl = await replicate.virtualTwilight(imageUrl, preset);
        break;
        
      case 'lawn-repair':
        outputUrl = await replicate.lawnRepair(imageUrl, preset);
        break;
        
      case 'pool-enhance':
        outputUrl = await replicate.poolEnhance(imageUrl);
        break;
        
      case 'declutter':
        outputUrl = await replicate.declutter(imageUrl, preset);
        break;
        
      case 'virtual-staging':
        outputUrl = await replicate.virtualStaging(imageUrl, preset);
        break;
        
      case 'fire-fireplace':
        outputUrl = await replicate.fireFireplace(imageUrl, preset);
        break;
        
      case 'tv-screen':
        outputUrl = await replicate.tvScreen(imageUrl, preset);
        break;
        
      case 'lights-on':
        outputUrl = await replicate.lightsOn(imageUrl, preset);
        break;
        
      case 'hdr':
        outputUrl = await replicate.hdr(imageUrl);
        break;
        
      case 'auto-enhance':
        // Use Sharp.js (FREE) instead of AutoEnhance.ai
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const result = await sharpEnhance(imageBuffer);
        // For now, return original URL since we'd need to upload the buffer
        // In production, upload result.buffer to storage and return URL
        outputUrl = imageUrl; // TODO: Upload enhanced buffer
        break;
        
      case 'perspective-correction':
        outputUrl = await replicate.perspectiveCorrection(imageUrl);
        break;
        
      case 'window-masking':
        outputUrl = await replicate.windowMasking(imageUrl, preset);
        break;
        
      case 'flash-fix':
        // Use color balance as flash fix
        outputUrl = await replicate.colorBalance(imageUrl);
        break;
        
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    const timeMs = Date.now() - startTime;
    console.log(`[V3 Executor] ${tool} complete in ${timeMs}ms`);
    
    return {
      tool,
      success: true,
      inputUrl: imageUrl,
      outputUrl,
      timeMs,
      cost: TOOL_COSTS[tool] || 0.05,
    };
    
  } catch (error) {
    const timeMs = Date.now() - startTime;
    console.error(`[V3 Executor] ${tool} failed:`, error);
    
    return {
      tool,
      success: false,
      inputUrl: imageUrl,
      timeMs,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute all tools for a photo strategy
 */
export async function executePhotoStrategy(
  strategy: PhotoStrategy,
  imageUrl: string
): Promise<PhotoExecutionResult> {
  const startTime = Date.now();
  const toolResults: ToolExecutionResult[] = [];
  let currentUrl = imageUrl;
  let totalCost = 0;
  
  console.log(`[V3 Executor] Processing photo ${strategy.photoId} with ${strategy.toolOrder.length} tools`);
  
  // Execute tools in order (each tool's output becomes next tool's input)
  for (const tool of strategy.toolOrder) {
    // Find preset for this tool
    const decision = strategy.decisions.find(d => d.tool === tool);
    const preset = decision?.preset;
    
    const result = await executeTool(tool, currentUrl, preset);
    toolResults.push(result);
    
    if (result.success && result.outputUrl) {
      currentUrl = result.outputUrl;
      totalCost += result.cost;
    } else {
      // Tool failed - continue with current URL or stop?
      console.warn(`[V3 Executor] Tool ${tool} failed, continuing with previous output`);
    }
  }
  
  const totalTimeMs = Date.now() - startTime;
  const allSuccess = toolResults.every(r => r.success);
  
  return {
    photoId: strategy.photoId,
    success: allSuccess,
    finalUrl: currentUrl,
    toolResults,
    totalTimeMs,
    totalCost,
    error: allSuccess ? undefined : 'Some tools failed',
  };
}

/**
 * Execute strategies for multiple photos
 */
export async function executeListingStrategy(
  strategies: PhotoStrategy[],
  getImageUrl: (photoId: string) => string | Promise<string>,
  options?: {
    concurrency?: number;
    onPhotoComplete?: (result: PhotoExecutionResult) => void;
  }
): Promise<PhotoExecutionResult[]> {
  const results: PhotoExecutionResult[] = [];
  const concurrency = options?.concurrency || 3;
  
  // Process in batches
  for (let i = 0; i < strategies.length; i += concurrency) {
    const batch = strategies.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(async (strategy) => {
        // Skip if no tools to apply
        if (strategy.toolOrder.length === 0) {
          return {
            photoId: strategy.photoId,
            success: true,
            finalUrl: await getImageUrl(strategy.photoId),
            toolResults: [],
            totalTimeMs: 0,
            totalCost: 0,
          };
        }
        
        const imageUrl = await getImageUrl(strategy.photoId);
        const result = await executePhotoStrategy(strategy, imageUrl);
        options?.onPhotoComplete?.(result);
        return result;
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

export default {
  executeTool,
  executePhotoStrategy,
  executeListingStrategy,
};
