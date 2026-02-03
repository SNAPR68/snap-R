/**
 * SnapR AI Engine V2 - Multi-Pass Twilight
 * =========================================
 * Two-pass twilight processing for superior quality:
 * Pass 1: FLUX for overall twilight atmosphere
 * Pass 2: Window glow enhancement for consistent warm lights
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: (typeof process !== "undefined" ? (typeof process !== "undefined" ? process.env.REPLICATE_API_TOKEN : "") : "")!,
});

const TWILIGHT_MODEL =
  (typeof process !== "undefined" ? process.env.AI_TWILIGHT_MODEL : undefined) ||
  (typeof process !== "undefined" ? process.env.AI_KONTEXT_MODEL : undefined) ||
  'black-forest-labs/flux-kontext-dev';

function normalizeOutputUrl(output: unknown): string {
  if (!output) throw new Error('Replicate returned no output');
  const result = Array.isArray(output) ? output[0] : output;
  if (!result) throw new Error('Replicate returned empty result');
  if (typeof result === 'string') return result;
  if (typeof (result as any).url === 'function') return (result as any).url();
  return String(result);
}

export interface TwilightOptions {
  preset: 'dusk' | 'blue-hour' | 'golden-hour' | 'night';
  enhanceWindowGlow: boolean;
  glowIntensity: 'subtle' | 'medium' | 'bright';
}

const DEFAULT_OPTIONS: TwilightOptions = {
  preset: 'blue-hour',
  enhanceWindowGlow: true,
  glowIntensity: 'medium',
};

/**
 * Multi-pass twilight processing
 * 
 * Pass 1: Transform entire scene to twilight using FLUX Kontext
 * Pass 2: Enhance window glow for consistent warm light effect
 */
export async function multiPassTwilight(
  imageUrl: string,
  options: Partial<TwilightOptions> = {}
): Promise<{ url: string; passes: number; success: boolean }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('[MultiPassTwilight] Starting multi-pass twilight processing');
  console.log('[MultiPassTwilight] Preset:', opts.preset);
  console.log('[MultiPassTwilight] Enhance glow:', opts.enhanceWindowGlow);
  
  try {
    // ========================================
    // PASS 1: Overall Twilight Transformation
    // ========================================
    console.log('[MultiPassTwilight] === PASS 1: Twilight Atmosphere ===');
    
    const twilightPrompt = getTwilightPrompt(opts.preset);
    
    const pass1Output = await replicate.run(TWILIGHT_MODEL as `${string}/${string}`, {
      input: {
        prompt: twilightPrompt,
        input_image: imageUrl,
        guidance: 3.5,
        num_inference_steps: 28,
        output_format: 'jpg',
        output_quality: 95,
        safety_tolerance: 5,
      },
    }) as any;
    
    const pass1Url = normalizeOutputUrl(pass1Output);
    
    if (!pass1Url) {
      throw new Error('Pass 1 failed - no output');
    }
    
    console.log('[MultiPassTwilight] Pass 1 complete');
    
    // If window glow enhancement is disabled, return after pass 1
    if (!opts.enhanceWindowGlow) {
      return { url: pass1Url, passes: 1, success: true };
    }
    
    // ========================================
    // PASS 2: Window Glow Enhancement
    // ========================================
    console.log('[MultiPassTwilight] === PASS 2: Window Glow Enhancement ===');
    
    const glowPrompt = getWindowGlowPrompt(opts.glowIntensity);
    
    const pass2Output = await replicate.run(TWILIGHT_MODEL as `${string}/${string}`, {
      input: {
        prompt: glowPrompt,
        input_image: pass1Url,
        guidance: 2.0, // Lower guidance for subtle refinement
        num_inference_steps: 20,
        output_format: 'jpg',
        output_quality: 95,
        safety_tolerance: 5,
      },
    }) as any;
    
    const pass2Url = normalizeOutputUrl(pass2Output);
    
    if (!pass2Url) {
      console.warn('[MultiPassTwilight] Pass 2 failed, returning Pass 1 result');
      return { url: pass1Url, passes: 1, success: true };
    }
    
    console.log('[MultiPassTwilight] Pass 2 complete - Full multi-pass twilight done');
    
    return { url: pass2Url, passes: 2, success: true };
    
  } catch (error: any) {
    console.error('[MultiPassTwilight] Error:', error.message);
    throw error;
  }
}

/**
 * Get twilight prompt based on preset
 */
function getTwilightPrompt(preset: TwilightOptions['preset']): string {
  const prompts: Record<TwilightOptions['preset'], string> = {
    'dusk': `Transform this daytime exterior into BRIGHT EARLY DUSK twilight.
SKY: Clean, natural dusk gradient with NO clouds (no dramatic or fake clouds).
LIGHTING: Warm, inviting, and BRIGHT — not dark.
WINDOWS: Warm interior glow visible in all windows.
ATMOSPHERE: Peaceful, professional real estate twilight.
Keep the house structure, landscaping, and all details exactly the same.`,

    'blue-hour': `Transform this daytime exterior into BRIGHT BLUE HOUR twilight.
SKY: Clean, natural blue-hour gradient with NO clouds (no dramatic or fake clouds).
LIGHTING: Cool blue ambience but keep the house clearly visible and bright.
WINDOWS: ALL windows glowing with warm yellow-orange light.
CONTRAST: Crisp contrast between cool exterior and warm windows.
Keep the house structure, landscaping, and all details exactly the same.`,

    'golden-hour': `Transform this daytime exterior into BRIGHT GOLDEN HOUR twilight.
SKY: Clean, natural golden-hour gradient with NO clouds (no dramatic or fake clouds).
LIGHTING: Golden warm light bathing the scene, house clearly visible.
WINDOWS: Warm yellow glow from all windows.
ATMOSPHERE: Luxurious, magazine-quality real estate photo.
Keep the house structure, landscaping, and all details exactly the same.`,

    'night': `Transform this daytime exterior into a NIGHT scene but keep the house BRIGHTLY visible.
SKY: Deep blue-black with NO clouds, stars are ok (no dramatic or fake clouds).
LIGHTING: House remains clearly visible, not crushed dark.
WINDOWS: ALL windows brightly lit with warm interior glow.
CONTRAST: Strong but not overly dark.
Keep the house structure, landscaping, and all details exactly the same.`,
  };
  
  return prompts[preset];
}

/**
 * Get window glow enhancement prompt
 */
function getWindowGlowPrompt(intensity: TwilightOptions['glowIntensity']): string {
  const intensityDesc = {
    'subtle': 'subtle, soft warm glow',
    'medium': 'clear, visible warm yellow-orange glow',
    'bright': 'bright, prominent warm golden glow',
  };
  
  return `Enhance the window lighting in this twilight photo.
Make ALL windows show ${intensityDesc[intensity]} from interior lights.
The window glow should be CONSISTENT across all windows - same color temperature.
Windows should appear to have warm interior lighting, creating an inviting look.
DO NOT change anything else - keep sky, house exterior, landscaping exactly the same.
Only enhance the warmth and brightness of light coming through windows.`;
}

/**
 * Single-pass twilight (fallback, faster)
 */
export async function singlePassTwilight(
  imageUrl: string,
  preset: TwilightOptions['preset'] = 'blue-hour'
): Promise<string> {
  console.log('[SinglePassTwilight] Running single-pass twilight');
  
  const result = await multiPassTwilight(imageUrl, {
    preset,
    enhanceWindowGlow: false,
  });
  
  return result.url;
}
