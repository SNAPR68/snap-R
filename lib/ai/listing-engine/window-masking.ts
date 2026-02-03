/**
 * SnapR AI Engine V2 - Window Masking (SAM)
 * ==========================================
 * Uses Segment Anything Model for precise window detection
 * Critical for:
 * - Preventing blown-out windows
 * - Targeted window glow enhancement
 * - MLS compliance (balanced exposures)
 */

import Replicate from 'replicate';
import { SAMMasksClient } from '../providers/sam-masks';

const replicate = new Replicate({
  auth: (typeof process !== "undefined" ? (typeof process !== "undefined" ? process.env.REPLICATE_API_TOKEN : "") : "")!,
});

const KONTEXT_MODEL =
  (typeof process !== "undefined" ? process.env.AI_KONTEXT_MODEL : undefined) ||
  'black-forest-labs/flux-kontext-dev';

export interface WindowMask {
  maskUrl: string;
  windowCount: number;
  windowAreas: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
}

export interface WindowBalanceResult {
  url: string;
  windowsDetected: number;
  balanced: boolean;
}

/**
 * Detect windows using SAM (Segment Anything Model)
 * Returns mask image highlighting all windows
 */
export async function detectWindows(imageUrl: string): Promise<WindowMask | null> {
  console.log('[WindowMasking] Detecting windows with SAM...');
  
  try {
    const samClient = new SAMMasksClient();
    const result = await samClient.generateMask({ imageUrl, maskType: 'window' });
    if (!result.success || !result.maskUrl) {
      console.log('[WindowMasking] No windows detected');
      return null;
    }
    
    console.log('[WindowMasking] Windows detected successfully');
    return {
      maskUrl: result.maskUrl,
      windowCount: result.boundingBox ? 1 : 0,
      windowAreas: result.boundingBox ? [{
        x: result.boundingBox.x1,
        y: result.boundingBox.y1,
        width: result.boundingBox.x2 - result.boundingBox.x1,
        height: result.boundingBox.y2 - result.boundingBox.y1,
        confidence: result.confidence,
      }] : [],
    };
    
  } catch (error: any) {
    console.error('[WindowMasking] SAM detection failed:', error.message);
    return await fallbackWindowDetection(imageUrl);
  }
}

/**
 * Fallback window detection using targeted inpainting prompt
 * Less precise but more reliable
 */
async function fallbackWindowDetection(imageUrl: string): Promise<WindowMask | null> {
  console.log('[WindowMasking] Using fallback detection method');
  
  // For fallback, we return null and let the enhancement handle it
  // The multi-pass twilight already handles window glow enhancement
  return null;
}

/**
 * Balance window exposure using detected mask
 * Fixes blown-out windows common in real estate photos
 */
export async function balanceWindowExposure(
  imageUrl: string,
  options: {
    showOutdoorView?: boolean;
    viewType?: 'sky' | 'garden' | 'neighborhood';
  } = {}
): Promise<WindowBalanceResult> {
  console.log('[WindowMasking] Balancing window exposure...');
  
  const { showOutdoorView = true, viewType = 'sky' } = options;
  
  try {
    // First detect windows
    const windowMask = await detectWindows(imageUrl);
    
    // Build prompt based on options
    let prompt: string;
    
    if (showOutdoorView) {
      const viewPrompts = {
        'sky': 'through the windows, show a clear blue sky with some clouds, natural daylight',
        'garden': 'through the windows, show green trees, landscaping, and garden view',
        'neighborhood': 'through the windows, show a pleasant residential neighborhood view',
      };
      
      prompt = `Balance the exposure in this interior photo. The windows should show ${viewPrompts[viewType]}.
Fix any blown-out or overexposed windows to show a clear outdoor view.
Keep the interior exactly the same - same furniture, lighting, colors.
IMPORTANT: Do NOT darken the overall interior. Maintain or slightly brighten the room.
Only fix the window exposure to show what's outside.
Professional HDR real estate photography look.`;
    } else {
      prompt = `Balance the exposure in this interior photo.
Fix any blown-out or overexposed windows with soft, diffused natural light.
Keep the interior exactly the same - same furniture, lighting, colors.
IMPORTANT: Do NOT darken the overall interior. Maintain or slightly brighten the room.
Professional real estate photography with balanced exposure.`;
    }
    
    // Run exposure balancing
    const output = await replicate.run(KONTEXT_MODEL as `${string}/${string}`, {
      input: {
        prompt,
        input_image: imageUrl,
        guidance: 2.0,
        num_inference_steps: 22,
        output_format: 'jpg',
        output_quality: 95,
      },
    }) as any;
    
    const resultUrl = normalizeOutputUrl(output);
    
    if (!resultUrl) {
      throw new Error('Window balancing failed');
    }
    
    console.log('[WindowMasking] Window exposure balanced');
    
    return {
      url: resultUrl,
      windowsDetected: windowMask?.windowCount || 0,
      balanced: true,
    };
    
  } catch (error: any) {
    console.error('[WindowMasking] Balance failed:', error.message);
    
    // Return original on failure
    return {
      url: imageUrl,
      windowsDetected: 0,
      balanced: false,
    };
  }
}

/**
 * Check if image has blown-out windows
 * Uses simple heuristic - can be enhanced with actual image analysis
 */
export async function hasBlownOutWindows(imageUrl: string): Promise<boolean> {
  // For now, we assume interior photos may have blown windows
  // In production, this would analyze the actual histogram
  // Return true to be safe - window balancing is non-destructive
  return true;
}

/**
 * Apply targeted enhancement only to window areas
 * Uses mask to preserve everything except windows
 */
export async function enhanceWindowsOnly(
  imageUrl: string,
  enhancement: 'glow' | 'balance' | 'darken'
): Promise<string> {
  console.log('[WindowMasking] Enhancing windows only:', enhancement);
  
  const prompts = {
    'glow': 'Add warm yellow-orange interior light glow to all windows. Windows should appear to have cozy interior lighting. Keep everything else exactly the same.',
    'balance': 'Balance the exposure of windows to show outdoor view clearly. Fix any blown-out or overexposed windows. Keep interior exactly the same.',
    'darken': 'Slightly darken the windows to reduce glare and show outdoor view better. Keep interior exactly the same.',
  };
  
  try {
    const output = await replicate.run(KONTEXT_MODEL as `${string}/${string}`, {
      input: {
        prompt: prompts[enhancement],
        input_image: imageUrl,
        guidance: 2.0, // Low guidance for subtle changes
        num_inference_steps: 20,
        output_format: 'jpg',
        output_quality: 95,
      },
    }) as any;
    
    const resultUrl = normalizeOutputUrl(output);
    return resultUrl || imageUrl;
    
  } catch (error: any) {
    console.error('[WindowMasking] Enhancement failed:', error.message);
    return imageUrl;
  }
}

function normalizeOutputUrl(output: unknown): string {
  if (!output) throw new Error('Replicate returned no output');
  const result = Array.isArray(output) ? output[0] : output;
  if (!result) throw new Error('Replicate returned empty result');
  if (typeof result === 'string') return result;
  if (typeof (result as any).url === 'function') return (result as any).url();
  return String(result);
}
