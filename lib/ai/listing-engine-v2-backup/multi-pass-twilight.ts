/**
 * SnapR AI Engine V2 - Multi-Pass Twilight
 * =========================================
 * Two-pass twilight processing for superior quality:
 * Pass 1: FLUX for overall twilight atmosphere
 * Pass 2: Window glow enhancement for consistent warm lights
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

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
    
    const pass1Output = await replicate.run('black-forest-labs/flux-kontext-dev', {
      input: {
        prompt: twilightPrompt,
        image: imageUrl,
        guidance: 3.5,
        num_inference_steps: 28,
        output_format: 'jpg',
        output_quality: 95,
        safety_tolerance: 5,
      },
    }) as any;
    
    const pass1Url = Array.isArray(pass1Output) ? pass1Output[0] : pass1Output;
    
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
    
    const pass2Output = await replicate.run('black-forest-labs/flux-kontext-dev', {
      input: {
        prompt: glowPrompt,
        image: pass1Url,
        guidance: 2.0, // Lower guidance for subtle refinement
        num_inference_steps: 20,
        output_format: 'jpg',
        output_quality: 95,
        safety_tolerance: 5,
      },
    }) as any;
    
    const pass2Url = Array.isArray(pass2Output) ? pass2Output[0] : pass2Output;
    
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
    'dusk': `Transform this daytime exterior into EARLY DUSK twilight.
SKY: Gradient from soft blue at top to warm orange-pink at horizon.
LIGHTING: Soft diffused light, beginning of golden hour warmth.
WINDOWS: Start showing warm interior light, not too bright yet.
ATMOSPHERE: Peaceful, inviting early evening feel.
Keep the house structure, landscaping, and all details exactly the same.`,

    'blue-hour': `Transform this daytime exterior into BLUE HOUR twilight.
SKY: Rich deep BLUE color - no orange or pink, pure blue twilight.
LIGHTING: Cool blue ambient light on exterior surfaces.
WINDOWS: ALL windows glowing with bright warm YELLOW-ORANGE light.
CONTRAST: Strong contrast between cool blue exterior and warm window glow.
Keep the house structure, landscaping, and all details exactly the same.`,

    'golden-hour': `Transform this daytime exterior into GOLDEN HOUR twilight.
SKY: Warm sunset colors - ORANGE, PINK, and GOLD gradients.
LIGHTING: Golden warm light bathing the entire scene.
WINDOWS: Warm yellow glow from all windows, complementing sunset.
ATMOSPHERE: Romantic, luxurious, magazine-quality real estate photo.
Keep the house structure, landscaping, and all details exactly the same.`,

    'night': `Transform this daytime exterior into a NIGHT scene.
SKY: Deep DARK blue-black sky, can show stars.
LIGHTING: Nighttime darkness on exterior, no ambient light.
WINDOWS: ALL windows brightly lit with warm interior glow - this is key.
CONTRAST: Maximum contrast between dark exterior and bright windows.
LANDSCAPE LIGHTING: Show subtle pathway lights if visible.
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
