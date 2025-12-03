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
// GROUNDED SAM + SDXL INPAINTING - For precise removal
// ============================================

async function getSegmentationMask(imageUrl: string, prompt: string): Promise<string> {
  console.log('[Replicate] Getting segmentation mask via Grounded SAM...');
  console.log('[Replicate] Mask prompt:', prompt);

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

async function inpaintWithMask(
  imageUrl: string,
  maskUrl: string,
  prompt: string,
  negativePrompt: string = 'clutter, mess, objects, items, blurry, distorted',
): Promise<string> {
  console.log('[Replicate] Inpainting with SDXL...');

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
// PUBLIC API: SKY REPLACEMENT
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
// PUBLIC API: VIRTUAL TWILIGHT
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
// PUBLIC API: LAWN REPAIR
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
// PUBLIC API: DECLUTTER (Two-step: Mask + Inpaint for reliability)
// ============================================

export async function declutter(imageUrl: string): Promise<string> {
  console.log('[Replicate] === DECLUTTER ===');

  // Try mask-based approach first (more reliable)
  try {
    console.log('[Replicate] Attempting mask-based declutter...');
    
    // Step 1: Get mask for clutter items
    const maskUrl = await getSegmentationMask(
      imageUrl,
      'clutter, mess, toys, papers, clothes, shoes, bags, dishes, cups, bottles, boxes, personal items, small objects on floor, items on furniture'
    );

    // Step 2: Inpaint to remove clutter
    const result = await inpaintWithMask(
      imageUrl,
      maskUrl,
      'Clean, tidy, empty floor and surfaces. Professional real estate photography. Clean organized room.',
      'clutter, mess, toys, papers, clothes, objects, items, dirty, messy'
    );

    console.log('[Replicate] === DECLUTTER COMPLETE (mask-based) ===');
    return result;
  } catch (maskError: any) {
    console.log('[Replicate] Mask-based failed, falling back to instruction-based:', maskError.message);
  }

  // Fallback: instruction-based with Flux Kontext
  const result = await runFluxKontext(
    imageUrl,
    'IMPORTANT: Remove ALL clutter and mess from this room. Delete these items completely: toys, papers, magazines, books on surfaces, dishes, cups, glasses, clothes draped on furniture, shoes on floor, bags, boxes, personal belongings, toiletries, and any small loose items. The floor should be completely clear. Surfaces should be empty or minimally decorated. Keep all furniture, walls, windows, doors, and permanent fixtures exactly the same. Only remove loose items and clutter. Make it look like a clean, staged real estate photo.',
  );

  console.log('[Replicate] === DECLUTTER COMPLETE (instruction-based) ===');
  return result;
}

// ============================================
// PUBLIC API: HDR
// ============================================

export async function hdr(imageUrl: string): Promise<string> {
  console.log('[Replicate] HDR enhancement');
  return runFluxKontext(
    imageUrl,
    'Enhance this photo: brighten dark shadow areas, balance overexposed highlights, make colors more vibrant and saturated, improve overall exposure balance. Keep EVERYTHING in the scene exactly the same - same furniture, same room, same composition. Only improve lighting, exposure, and color vibrancy.',
  );
}

// ============================================
// PUBLIC API: VIRTUAL STAGING
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
// PUBLIC API: UPSCALE
// ============================================

export async function upscale(
  imageUrl: string,
  options?: { scale?: number } | number,
): Promise<string> {
  let scale = 2;
  if (typeof options === 'number') scale = options;
  else if (options && typeof options.scale === 'number') scale = options.scale;

  console.log('[Replicate] Upscaling with scale:', scale);

  const output = await withTimeout(
    replicate.run('nightmareai/real-esrgan', {
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
}
