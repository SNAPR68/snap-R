import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// ============================================
// TIMEOUT UTILITIES
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
  const result = Array.isArray(output) ? output[0] : output;
  if (!result) throw new Error('Replicate returned empty result');
  if (typeof result === 'string') return result;
  if (typeof (result as any).url === 'function') return (result as any).url();
  return String(result);
}

// ============================================
// GROUNDED SAM - Text-prompted segmentation mask
// ============================================

async function getSegmentationMask(imageUrl: string, prompt: string): Promise<string> {
  console.log('[Replicate] Getting segmentation mask via Grounded SAM...');
  console.log('[Replicate] Prompt:', prompt);

  const output = await withTimeout(
    replicate.run('schananas/grounded_sam', {
      input: {
        image: imageUrl,
        mask_prompt: prompt,
      },
    }),
    60000,
    'Grounded SAM',
  );

  const resultUrl = extractUrl(output);
  console.log('[Replicate] Segmentation mask complete');
  return resultUrl;
}

// ============================================
// SDXL INPAINTING - Fill masked area
// ============================================

async function inpaintWithMask(
  imageUrl: string,
  maskUrl: string,
  prompt: string,
  negativePrompt: string = 'blurry, distorted, low quality, artifacts, ugly',
): Promise<string> {
  console.log('[Replicate] Inpainting with SDXL...');
  console.log('[Replicate] Prompt:', prompt.substring(0, 60) + '...');

  const output = await withTimeout(
    replicate.run('lucataco/sdxl-inpainting', {
      input: {
        image: imageUrl,
        mask: maskUrl,
        prompt,
        negative_prompt: negativePrompt,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        strength: 0.99,
        scheduler: 'K_EULER',
      },
    }),
    120000,
    'SDXL Inpainting',
  );

  const resultUrl = extractUrl(output);
  console.log('[Replicate] Inpainting complete');
  return resultUrl;
}

// ============================================
// FLUX KONTEXT - For creative edits
// ============================================

async function runFluxKontext(imageUrl: string, prompt: string): Promise<string> {
  console.log('[Replicate] Running Flux Kontext...');
  console.log('[Replicate] Prompt:', prompt.substring(0, 80) + '...');

  const output = await withTimeout(
    replicate.run('black-forest-labs/flux-kontext-dev', {
      input: {
        input_image: imageUrl,
        prompt,
        guidance: 3.5,
        num_inference_steps: 28,
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
        output_quality: 90,
      },
    }),
    120000,
    'Flux Kontext',
  );

  console.log('[Replicate] Flux Kontext complete');
  return extractUrl(output);
}

// ============================================
// PUBLIC API: SKY REPLACEMENT (Instruction-based - NO MASK)
// ============================================

export async function skyReplacement(
  imageUrl: string,
  skyType: 'sunny' | 'sunset' | 'dramatic' | 'cloudy' = 'sunny',
): Promise<string> {
  console.log('[Replicate] === SKY REPLACEMENT ===');
  console.log('[Replicate] Sky type:', skyType);

  const skyPrompts: Record<string, string> = {
    sunny:
      'Replace the sky with a beautiful clear blue sky with white fluffy clouds. Keep the house, trees, and everything else exactly the same.',
    sunset:
      'Replace the sky with a stunning golden hour sunset sky with orange, pink and purple clouds. Keep the house and everything else exactly the same.',
    dramatic:
      'Replace the sky with a dramatic sky with dark clouds and sunbeams breaking through. Keep the house and everything else exactly the same.',
    cloudy:
      'Replace the sky with a soft overcast sky with gentle white and gray clouds. Keep the house and everything else exactly the same.',
  };

  const result = await runFluxKontext(imageUrl, skyPrompts[skyType] || skyPrompts.sunny);
  console.log('[Replicate] === SKY REPLACEMENT COMPLETE ===');
  return result;
}

// ============================================
// PUBLIC API: VIRTUAL TWILIGHT (Instruction-based - NO MASK)
// ============================================

export async function virtualTwilight(imageUrl: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL TWILIGHT ===');

  const result = await runFluxKontext(
    imageUrl,
    'Transform this daytime exterior photo into a beautiful twilight/dusk scene. Replace the sky with a deep blue and purple gradient with golden orange sunset glow on the horizon. Add warm yellow-orange light glowing from inside all the windows as if interior lights are on. Keep the house structure, landscaping, and all other elements exactly the same. Professional real estate twilight photography style.',
  );

  console.log('[Replicate] === VIRTUAL TWILIGHT COMPLETE ===');
  return result;
}

// ============================================
// PUBLIC API: LAWN REPAIR (Instruction-based - NO MASK)
// ============================================

export async function lawnRepair(imageUrl: string): Promise<string> {
  console.log('[Replicate] === LAWN REPAIR ===');

  const result = await runFluxKontext(
    imageUrl,
    'Make the lawn and grass in this photo lush, vibrant, and healthy green. Transform any brown, patchy, or dead grass into thick, perfectly manicured green turf. Keep the house, driveway, landscaping features, and everything else exactly the same. Only improve the grass and lawn areas.',
  );

  console.log('[Replicate] === LAWN REPAIR COMPLETE ===');
  return result;
}

// ============================================
// PUBLIC API: DECLUTTER (Flux Kontext)
// ============================================

export async function declutter(imageUrl: string): Promise<string> {
  console.log('[Replicate] Declutter');
  return runFluxKontext(
    imageUrl,
    'Remove clutter, personal items, and mess from this room. Remove items like: toys, papers, magazines, dishes, clothes on furniture, shoes, bags, and small personal belongings. Keep all furniture, fixtures, walls, floors, architectural elements, and permanent features EXACTLY the same. Only remove loose items and clutter.',
  );
}

// ============================================
// PUBLIC API: HDR (Flux Kontext)
// ============================================

export async function hdr(imageUrl: string): Promise<string> {
  console.log('[Replicate] HDR enhancement');
  return runFluxKontext(
    imageUrl,
    'Enhance this photo: brighten dark shadow areas, balance overexposed highlights, make colors more vibrant and saturated, improve overall exposure balance. Keep EVERYTHING in the scene exactly the same - same furniture, same room, same composition. Only improve lighting, exposure, and color vibrancy.',
  );
}

// ============================================
// PUBLIC API: VIRTUAL STAGING (Flux Kontext)
// ============================================

export async function virtualStaging(
  imageUrl: string,
  roomType: string = 'living room',
  style: string = 'modern',
): Promise<string> {
  console.log('[Replicate] Virtual staging:', roomType, style);
  return runFluxKontext(
    imageUrl,
    `Stage this empty ${roomType} with beautiful ${style} furniture and decor. Add appropriate furniture: sofas, chairs, tables, rugs, lamps, artwork, plants, and decorative accessories. The furniture should be ${style} style and appropriate for a ${roomType}. Keep the room architecture, walls, windows, flooring, and layout EXACTLY the same. Only add furniture and decor. Professional real estate virtual staging quality.`,
  );
}

// ============================================
// PUBLIC API: UPSCALE (Real-ESRGAN)
// ============================================

export async function upscale(
  imageUrl: string,
  options?: { scale?: number } | number,
): Promise<string> {
  let scale = 2;
  if (typeof options === 'number') scale = options;
  else if (options && typeof options.scale === 'number') scale = options.scale;

  console.log('[Replicate] Upscaling with scale:', scale);

  try {
    const output = await withTimeout(
      replicate.run('nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b', {
        input: {
          image: imageUrl,
          scale: Math.min(scale, 4),
          face_enhance: false,
        },
      }),
      180000,
      'Real-ESRGAN',
    );
    console.log('[Replicate] Upscale complete');
    return extractUrl(output);
  } catch (error: any) {
    if (error.message?.includes('greater than the max size')) {
      throw new Error('Image is already high resolution (>2MP). Upscaling not needed.');
    }
    throw error;
  }
}

