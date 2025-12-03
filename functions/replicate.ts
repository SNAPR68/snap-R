/**
 * SnapR AI Enhancement Pipeline
 * ===============================
 * PRODUCTION-READY - All models verified from Replicate official documentation
 *
 * MODEL SELECTION (Based on Replicate's official comparison blog post):
 *
 * 1. SKY REPLACEMENT / BACKGROUND EDITING:
 *    - bria/generate-background: OFFICIAL, commercial-safe, trained on licensed data
 *    - Automatically removes foreground, generates new background from prompt
 *    - No mask needed - model handles foreground detection automatically
 *
 * 2. VIRTUAL TWILIGHT:
 *    - google/nano-banana: Fast instruction-based editing (Gemini 2.5)
 *    - Excellent at following complex instructions
 *
 * 3. DECLUTTER / OBJECT REMOVAL:
 *    - bria/eraser: OFFICIAL, SOTA object removal, commercial-safe
 *    - Requires mask (user draws on image)
 *    - For auto-declutter: google/nano-banana with instruction
 *
 * 4. HDR / LIGHTING:
 *    - google/nano-banana: Instruction-based lighting adjustments
 *
 * 5. VIRTUAL STAGING:
 *    - bria/genfill: Add furniture to masked region with prompt
 *    - Or google/nano-banana for instruction-based
 *
 * 6. LAWN REPAIR:
 *    - google/nano-banana: Instruction-based grass enhancement
 *
 * 7. UPSCALE:
 *    - nightmareai/real-esrgan: Battle-tested, fast, reliable
 *    - Or recraft-ai/recraft-crisp-upscale: Sharp, print-ready
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const TIMEOUT_MS = 120000; // 2 minutes

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
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

function extractUrl(output: unknown): string {
  if (!output) throw new Error('Replicate returned no output');

  // Handle FileOutput objects (have .url() method)
  if (typeof output === 'object' && output !== null) {
    if (typeof (output as any).url === 'function') {
      return (output as any).url();
    }
    if (typeof (output as any).url === 'string') {
      return (output as any).url;
    }
  }

  // Handle arrays
  if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && first !== null) {
      if (typeof (first as any).url === 'function') return (first as any).url();
      if (typeof (first as any).url === 'string') return (first as any).url;
    }
    return String(first);
  }

  // Handle string
  if (typeof output === 'string') return output;

  return String(output);
}

// ============================================
// BRIA GENERATE-BACKGROUND
// Official model for background replacement
// Automatically detects foreground and replaces background
// ============================================

async function briaGenerateBackground(imageUrl: string, prompt: string): Promise<string> {
  console.log('[Replicate] Running bria/generate-background...');
  console.log('[Replicate] Prompt:', prompt.substring(0, 80));

  const output = await withTimeout(
    replicate.run('bria/generate-background', {
      input: {
        image: imageUrl,
        prompt: prompt,
        refine_prompt: true,
      },
    }),
    TIMEOUT_MS,
    'bria/generate-background',
  );

  console.log('[Replicate] bria/generate-background complete');
  return extractUrl(output);
}

// ============================================
// GOOGLE NANO-BANANA
// Instruction-based image editing (Gemini 2.5)
// Best for: complex instructions, multi-step edits
// ============================================

async function googleNanoBanana(imageUrl: string, instruction: string): Promise<string> {
  console.log('[Replicate] Running google/nano-banana...');
  console.log('[Replicate] Instruction:', instruction.substring(0, 100));

  const output = await withTimeout(
    replicate.run('google/nano-banana', {
      input: {
        image: imageUrl,
        prompt: instruction,
      },
    }),
    TIMEOUT_MS,
    'google/nano-banana',
  );

  console.log('[Replicate] google/nano-banana complete');
  return extractUrl(output);
}

// ============================================
// BRIA ERASER
// SOTA object removal - requires mask
// For user-drawn masks in the UI
// ============================================

async function briaEraser(imageUrl: string, maskUrl: string): Promise<string> {
  console.log('[Replicate] Running bria/eraser...');

  const output = await withTimeout(
    replicate.run('bria/eraser', {
      input: {
        image: imageUrl,
        mask: maskUrl,
      },
    }),
    TIMEOUT_MS,
    'bria/eraser',
  );

  console.log('[Replicate] bria/eraser complete');
  return extractUrl(output);
}

// ============================================
// BRIA GENFILL
// Generative fill - add objects to masked region
// ============================================

async function briaGenfill(imageUrl: string, maskUrl: string, prompt: string): Promise<string> {
  console.log('[Replicate] Running bria/genfill...');
  console.log('[Replicate] Prompt:', prompt.substring(0, 80));

  const output = await withTimeout(
    replicate.run('bria/genfill', {
      input: {
        image: imageUrl,
        mask: maskUrl,
        prompt: prompt,
      },
    }),
    TIMEOUT_MS,
    'bria/genfill',
  );

  console.log('[Replicate] bria/genfill complete');
  return extractUrl(output);
}

// ============================================
// REAL-ESRGAN UPSCALE
// Battle-tested upscaling
// ============================================

async function realEsrganUpscale(imageUrl: string, scale: number = 2): Promise<string> {
  console.log('[Replicate] Running nightmareai/real-esrgan...');
  console.log('[Replicate] Scale:', scale);

  const output = await withTimeout(
    replicate.run('nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa', {
      input: {
        image: imageUrl,
        scale: Math.min(scale, 4),
        face_enhance: false,
      },
    }),
    180000,
    'real-esrgan',
  );

  console.log('[Replicate] real-esrgan complete');
  return extractUrl(output);
}

// ============================================
// PUBLIC API: SKY REPLACEMENT
// Uses bria/generate-background (automatic foreground detection)
// ============================================

export async function skyReplacement(
  imageUrl: string,
  skyType: 'sunny' | 'sunset' | 'dramatic' | 'cloudy' = 'sunny',
): Promise<string> {
  console.log('[Replicate] === SKY REPLACEMENT ===');
  console.log('[Replicate] Sky type:', skyType);

  const prompts: Record<string, string> = {
    sunny:
      'beautiful clear blue sky with white fluffy cumulus clouds, bright sunny day, perfect weather, photorealistic real estate photography',
    sunset:
      'stunning golden hour sunset sky with orange pink and purple clouds, warm dramatic lighting, photorealistic',
    dramatic: 'dramatic stormy sky with dark clouds and sun rays breaking through, moody atmosphere, photorealistic',
    cloudy: 'soft overcast sky with gentle white and gray clouds, diffused natural light, photorealistic',
  };

  return briaGenerateBackground(imageUrl, prompts[skyType] || prompts.sunny);
}

// ============================================
// PUBLIC API: VIRTUAL TWILIGHT
// Uses google/nano-banana for instruction-based edit
// ============================================

export async function virtualTwilight(imageUrl: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL TWILIGHT ===');

  const instruction = `Transform this exterior photo into a beautiful twilight/dusk scene:
- Change the sky to a deep blue and purple twilight gradient with golden orange glow on the horizon
- Add warm yellow-orange light glowing from inside all windows, as if interior lights are on
- Adjust overall lighting to match early evening atmosphere with soft shadows
- Keep the building structure, landscaping, and architecture exactly the same
Professional real estate twilight photography style.`;

  return googleNanoBanana(imageUrl, instruction);
}

// ============================================
// PUBLIC API: LAWN REPAIR
// Uses google/nano-banana for instruction-based edit
// ============================================

export async function lawnRepair(imageUrl: string): Promise<string> {
  console.log('[Replicate] === LAWN REPAIR ===');

  const instruction = `Transform the grass and lawn in this image:
- Change any brown, dead, patchy, or unhealthy grass to lush, vibrant, healthy green grass
- Make the lawn look perfectly manicured with thick green turf
- Keep the house, driveway, trees, landscaping beds, flowers, and all other elements exactly the same
- Only improve the grass/lawn areas
Professional real estate photography quality.`;

  return googleNanoBanana(imageUrl, instruction);
}

// ============================================
// PUBLIC API: DECLUTTER (Auto mode - instruction based)
// Uses google/nano-banana for automatic decluttering
// ============================================

export async function declutter(imageUrl: string): Promise<string> {
  console.log('[Replicate] === DECLUTTER ===');

  const instruction = `Remove clutter and personal items from this room:
- Remove: toys, papers, magazines, dishes, clothes on furniture, shoes, bags, boxes, personal belongings
- Keep: all furniture, fixtures, walls, floors, windows, doors, architectural elements
- Leave clean, organized surfaces
- Maintain the room's original lighting and atmosphere
Professional real estate staging quality.`;

  return googleNanoBanana(imageUrl, instruction);
}

// ============================================
// PUBLIC API: DECLUTTER WITH MASK
// Uses bria/eraser for precise removal with user-drawn mask
// ============================================

export async function declutterWithMask(imageUrl: string, maskUrl: string): Promise<string> {
  console.log('[Replicate] === DECLUTTER WITH MASK ===');
  return briaEraser(imageUrl, maskUrl);
}

// ============================================
// PUBLIC API: HDR ENHANCEMENT
// Uses google/nano-banana for lighting enhancement
// ============================================

export async function hdr(imageUrl: string): Promise<string> {
  console.log('[Replicate] === HDR ENHANCEMENT ===');

  const instruction = `Enhance this real estate photo with professional HDR-style improvements:
- Brighten dark shadow areas to reveal detail
- Balance overexposed highlights (especially windows)
- Make colors more vibrant and saturated
- Improve overall exposure balance
- Keep everything in the scene exactly the same
- Only improve lighting, exposure, and color vibrancy
Professional real estate photography quality.`;

  return googleNanoBanana(imageUrl, instruction);
}

// ============================================
// PUBLIC API: VIRTUAL STAGING
// Uses google/nano-banana for instruction-based staging
// ============================================

export async function virtualStaging(
  imageUrl: string,
  roomType: string = 'living room',
  style: string = 'modern',
): Promise<string> {
  console.log('[Replicate] === VIRTUAL STAGING ===');
  console.log('[Replicate] Room:', roomType, '| Style:', style);

  const instruction = `Add beautiful ${style} style furniture and decor to this empty ${roomType}:
- Add appropriate furniture: sofas, chairs, coffee tables, rugs, lamps, artwork, plants
- Style should be ${style} and appropriate for a ${roomType}
- Furniture should be placed naturally and realistically
- Keep the room architecture, walls, windows, flooring, ceiling exactly the same
- Only add furniture and decorations
Professional real estate virtual staging quality.`;

  return googleNanoBanana(imageUrl, instruction);
}

// ============================================
// PUBLIC API: VIRTUAL STAGING WITH MASK
// Uses bria/genfill for precise placement with user-drawn mask
// ============================================

export async function virtualStagingWithMask(
  imageUrl: string,
  maskUrl: string,
  furniturePrompt: string,
): Promise<string> {
  console.log('[Replicate] === VIRTUAL STAGING WITH MASK ===');
  return briaGenfill(imageUrl, maskUrl, furniturePrompt);
}

// ============================================
// PUBLIC API: UPSCALE
// Uses real-esrgan for reliable upscaling
// ============================================

export async function upscale(
  imageUrl: string,
  options?: { scale?: number } | number,
): Promise<string> {
  let scale = 2;
  if (typeof options === 'number') scale = options;
  else if (options && typeof options.scale === 'number') scale = options.scale;

  console.log('[Replicate] === UPSCALE ===');

  try {
    return await realEsrganUpscale(imageUrl, scale);
  } catch (error: any) {
    if (error.message?.includes('greater than the max size')) {
      throw new Error('Image is already high resolution. Upscaling not needed.');
    }
    throw error;
  }
}

// ============================================
// EXPORT RAW MODEL FUNCTIONS FOR ADVANCED USE
// ============================================

export const models = {
  briaGenerateBackground,
  googleNanoBanana,
  briaEraser,
  briaGenfill,
  realEsrganUpscale,
};
