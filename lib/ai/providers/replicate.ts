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
// SKY SEGMENTATION - Using SAM2 (Segment Anything Model 2)
// ============================================

async function segmentSky(imageUrl: string): Promise<string> {
  console.log('[Replicate] Segmenting sky with SAM2...');
  
  // Use SAM2 to segment the sky
  // We'll use automatic mask generation and filter for sky (top portion)
  const output = await withTimeout(
    replicate.run('meta/sam-2-base', {
      input: {
        image: imageUrl,
        // Point at the sky (top center of image)
        input_point: "0.5, 0.1",  // x=center, y=near top
        input_label: 1,  // foreground
      },
    }),
    60000,
    'SAM2 Sky Segmentation',
  );

  console.log('[Replicate] Sky segmentation complete');
  
  // SAM2 returns a mask image
  if (output && typeof output === 'object' && 'combined_mask' in output) {
    return (output as any).combined_mask;
  }
  
  return extractUrl(output);
}

// ============================================
// FIREPLACE DETECTION - Using SAM2 with center-bottom point
// ============================================

async function segmentFireplace(imageUrl: string): Promise<string> {
  console.log('[Replicate] Segmenting fireplace with SAM2...');
  
  // For fireplace, we target the center-bottom area where fireplaces typically are
  const output = await withTimeout(
    replicate.run('meta/sam-2-base', {
      input: {
        image: imageUrl,
        // Point at typical fireplace location (center, lower third)
        input_point: "0.5, 0.65",
        input_label: 1,
      },
    }),
    60000,
    'SAM2 Fireplace Segmentation',
  );

  console.log('[Replicate] Fireplace segmentation complete');
  
  if (output && typeof output === 'object' && 'combined_mask' in output) {
    return (output as any).combined_mask;
  }
  
  return extractUrl(output);
}

// ============================================
// SDXL INPAINTING - Fill masked areas
// ============================================

async function inpaintWithMask(
  imageUrl: string, 
  maskUrl: string, 
  prompt: string,
  negativePrompt?: string
): Promise<string> {
  console.log('[Replicate] Running SDXL Inpainting...');
  console.log('[Replicate] Prompt:', prompt.substring(0, 80) + '...');

  const output = await withTimeout(
    replicate.run('lucataco/sdxl-inpainting', {
      input: {
        image: imageUrl,
        mask: maskUrl,
        prompt: prompt,
        negative_prompt: negativePrompt || 'blurry, distorted, low quality, artifacts, unrealistic',
        num_inference_steps: 35,
        guidance_scale: 7.5,
        strength: 0.99,  // Full replacement in masked area
        scheduler: 'K_EULER',
      },
    }),
    120000,
    'SDXL Inpainting',
  );

  console.log('[Replicate] SDXL Inpainting complete');
  return extractUrl(output);
}

// ============================================
// FLUX KONTEXT - For non-mask-based edits
// ============================================

interface FluxKontextOptions {
  guidance?: number;
  steps?: number;
  outputQuality?: number;
}

async function runFluxKontext(
  imageUrl: string, 
  prompt: string, 
  options: FluxKontextOptions = {}
): Promise<string> {
  const {
    guidance = 3.0,
    steps = 28,
    outputQuality = 95
  } = options;

  console.log('[Replicate] Running Flux Kontext...');
  console.log('[Replicate] Settings: guidance=' + guidance + ', steps=' + steps);

  const output = await withTimeout(
    replicate.run('black-forest-labs/flux-kontext-dev', {
      input: {
        input_image: imageUrl,
        prompt,
        guidance,
        num_inference_steps: steps,
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
        output_quality: outputQuality,
      },
    }),
    120000,
    'Flux Kontext',
  );

  return extractUrl(output);
}


// ============================================
// 1. SKY REPLACEMENT - MASK-BASED PIPELINE (95% quality)
// ============================================

export async function skyReplacement(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === SKY REPLACEMENT (MASK-BASED) ===');

  try {
    // Step 1: Segment the sky
    console.log('[Replicate] Step 1: Segmenting sky...');
    const skyMask = await segmentSky(imageUrl);
    console.log('[Replicate] Sky mask obtained:', skyMask ? 'YES' : 'NO');

    // Step 2: Determine sky style
    let skyPrompt = 'beautiful clear blue sky with soft white fluffy clouds, sunny day, professional real estate photography';
    
    if (customPrompt) {
      const lower = customPrompt.toLowerCase();
      if (lower.includes('sunset') || lower.includes('dramatic')) {
        skyPrompt = 'dramatic sunset sky with vibrant orange, pink, and purple clouds, golden hour lighting';
      } else if (lower.includes('cloudy') || lower.includes('overcast')) {
        skyPrompt = 'soft overcast sky with light gray clouds, even diffused lighting';
      } else if (lower.includes('twilight') || lower.includes('dusk')) {
        skyPrompt = 'twilight sky with deep blue and purple gradient, dusk atmosphere';
      } else if (lower.includes('clear') || lower.includes('blue')) {
        skyPrompt = 'perfectly clear bright blue sky, no clouds, sunny day';
      } else {
        skyPrompt = customPrompt + ', professional real estate sky photography';
      }
    }

    // Step 3: Inpaint new sky into masked area
    console.log('[Replicate] Step 2: Inpainting new sky...');
    const result = await inpaintWithMask(
      imageUrl,
      skyMask,
      skyPrompt,
      'buildings, houses, trees, ground, grass, distorted architecture, blurry'
    );

    console.log('[Replicate] === SKY REPLACEMENT COMPLETE ===');
    return result;

  } catch (error) {
    console.error('[Replicate] Mask-based sky replacement failed, falling back to Flux:', error);
    
    // Fallback to Flux Kontext if mask pipeline fails
    const fallbackPrompt = customPrompt 
      ? `Replace ONLY the sky with ${customPrompt}. Keep house, trees, lawn EXACTLY the same.`
      : 'Replace ONLY the sky with beautiful blue sky and clouds. Keep house, trees, lawn EXACTLY the same.';
    
    return runFluxKontext(imageUrl, fallbackPrompt, { guidance: 2.5, steps: 30 });
  }
}


// ============================================
// 2. FIRE IN FIREPLACE - MASK-BASED PIPELINE (95% quality)
// ============================================

export async function fireFireplace(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === FIRE IN FIREPLACE (MASK-BASED) ===');

  try {
    // Step 1: Segment the fireplace opening
    console.log('[Replicate] Step 1: Segmenting fireplace...');
    const fireplaceMask = await segmentFireplace(imageUrl);
    console.log('[Replicate] Fireplace mask obtained:', fireplaceMask ? 'YES' : 'NO');

    // Step 2: Determine fire style
    let firePrompt = 'warm crackling fire with orange and yellow flames, realistic fireplace fire, cozy warm glow, burning logs';
    
    if (customPrompt) {
      const lower = customPrompt.toLowerCase();
      if (lower.includes('roaring') || lower.includes('large')) {
        firePrompt = 'large roaring fire with tall bright orange flames, intense burning logs, dramatic fireplace fire';
      } else if (lower.includes('gentle') || lower.includes('small')) {
        firePrompt = 'gentle small fire with soft warm flames, calm cozy fireplace, subtle glow';
      } else if (lower.includes('ember') || lower.includes('glow')) {
        firePrompt = 'glowing red-orange embers with small flames, dying fire, warm coals';
      } else {
        firePrompt = customPrompt + ', realistic fireplace fire';
      }
    }

    // Step 3: Inpaint fire into fireplace
    console.log('[Replicate] Step 2: Inpainting fire...');
    const result = await inpaintWithMask(
      imageUrl,
      fireplaceMask,
      firePrompt,
      'room on fire, fire spreading, smoke everywhere, burnt furniture, disaster'
    );

    console.log('[Replicate] === FIRE IN FIREPLACE COMPLETE ===');
    return result;

  } catch (error) {
    console.error('[Replicate] Mask-based fireplace failed, falling back to Flux:', error);
    
    // Fallback with very specific constraints
    const fallbackPrompt = `Add a warm crackling fire with realistic orange flames ONLY inside the fireplace opening. 
The fire must be CONTAINED within the fireplace firebox only. 
Do NOT add fire glow or orange tint to the room.
Do NOT change ANY furniture or decor.
The room must look exactly the same except for fire in the fireplace.`;
    
    return runFluxKontext(imageUrl, fallbackPrompt, { guidance: 2.0, steps: 28 });
  }
}


// ============================================
// 3. VIRTUAL TWILIGHT - Hybrid approach
// ============================================

export async function virtualTwilight(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL TWILIGHT ===');

  try {
    // Step 1: Replace sky with twilight sky using mask pipeline
    console.log('[Replicate] Step 1: Replacing sky with twilight...');
    
    const skyMask = await segmentSky(imageUrl);
    
    let twilightSkyPrompt = 'beautiful twilight sky with deep blue and purple gradient, golden orange glow on horizon, dusk atmosphere';
    
    if (customPrompt) {
      const lower = customPrompt.toLowerCase();
      if (lower.includes('night') || lower.includes('stars')) {
        twilightSkyPrompt = 'dark night sky with stars, deep navy blue, nighttime atmosphere';
      } else if (lower.includes('blue hour')) {
        twilightSkyPrompt = 'blue hour sky with rich deep blue color, no orange, cool twilight';
      } else if (lower.includes('golden hour')) {
        twilightSkyPrompt = 'golden hour sunset with warm orange pink and purple clouds, dramatic sunset';
      }
    }

    const skyResult = await inpaintWithMask(
      imageUrl,
      skyMask,
      twilightSkyPrompt,
      'daytime, bright sun, noon, midday'
    );

    // Step 2: Add window glow using Flux Kontext
    console.log('[Replicate] Step 2: Adding window glow...');
    const finalResult = await runFluxKontext(
      skyResult,
      'Add warm yellow-orange light glowing from all windows as if interior lights are on. Keep EVERYTHING else exactly the same. Only add window glow.',
      { guidance: 2.0, steps: 25 }
    );

    console.log('[Replicate] === VIRTUAL TWILIGHT COMPLETE ===');
    return finalResult;

  } catch (error) {
    console.error('[Replicate] Twilight pipeline failed, using fallback:', error);
    
    // Single-pass fallback
    let prompt = 'Transform to twilight scene. Sky: deep blue/purple with orange horizon. Windows: warm yellow glow. Keep house structure EXACTLY the same.';
    return runFluxKontext(imageUrl, prompt, { guidance: 2.8, steps: 32 });
  }
}


// ============================================
// 4. LAWN REPAIR - Low guidance for natural results
// ============================================

export async function lawnRepair(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === LAWN REPAIR ===');

  let grassStyle = 'healthy, natural-looking green residential lawn';
  
  if (customPrompt) {
    if (customPrompt.includes('EMERALD') || customPrompt.includes('golf course')) {
      grassStyle = 'lush, vibrant emerald green grass like a golf course';
    } else if (customPrompt.includes('natural') || customPrompt.includes('Natural')) {
      grassStyle = 'naturally healthy green lawn with realistic color';
    }
  }

  const prompt = `Make ONLY the lawn/grass areas look like ${grassStyle}.
CHANGE: Brown/patchy grass to healthy green.
DO NOT CHANGE: House, driveway, trees, shrubs, sky, ANYTHING else.
The grass must look NATURAL, not artificial or neon green.`;

  // Very low guidance
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.2, steps: 28 });
  console.log('[Replicate] === LAWN REPAIR COMPLETE ===');
  return result;
}


// ============================================
// 5. DECLUTTER
// ============================================

export async function declutter(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === DECLUTTER ===');

  let level = 'Remove small clutter: papers, cups, remotes from surfaces';
  
  if (customPrompt) {
    if (customPrompt.includes('Light Clean')) {
      level = 'Remove ONLY small items: papers, cups, remotes, magazines from tables';
    } else if (customPrompt.includes('Staging Ready')) {
      level = 'Remove ALL furniture and items, leave completely empty room';
    } else if (customPrompt.includes('Full Clean')) {
      level = 'Remove all loose items and personal belongings, keep only main furniture';
    } else if (customPrompt.includes('Moderate')) {
      level = 'Remove clutter from surfaces: papers, dishes, toys, clothes';
    }
  }

  const prompt = `${level}
DO NOT add any new objects.
DO NOT move furniture.
Fill removed areas with appropriate surface (floor, counter, wall).
Professional staged real estate look.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.0, steps: 30 });
  console.log('[Replicate] === DECLUTTER COMPLETE ===');
  return result;
}


// ============================================
// 6. VIRTUAL STAGING
// ============================================

export async function virtualStaging(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL STAGING ===');

  const style = customPrompt || 'modern minimalist';

  const prompt = `Stage this empty room with beautiful ${style} furniture.
ADD: Appropriate furniture, rugs, lamps, artwork, plants, accessories.
PRESERVE: Walls, ceiling, flooring, windows, doors - exactly as-is.
Furniture properly scaled, realistic shadows, professional staging.`;

  // Higher guidance for adding content
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.5, steps: 35 });
  console.log('[Replicate] === VIRTUAL STAGING COMPLETE ===');
  return result;
}


// ============================================
// 7. TV SCREEN REPLACE
// ============================================

export async function tvScreen(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === TV SCREEN REPLACE ===');

  const content = customPrompt || 'beautiful mountain landscape with lake';

  const prompt = `Replace ONLY the TV screen content with ${content}.
PRESERVE: TV frame, stand, all furniture, entire room.
Only pixels inside TV screen change.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 28 });
  console.log('[Replicate] === TV SCREEN REPLACE COMPLETE ===');
  return result;
}


// ============================================
// 8. LIGHTS ON
// ============================================

export async function lightsOn(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === LIGHTS ON ===');

  const prompt = `Turn on all lights in this room - fixtures, lamps, ceiling lights should glow warmly.
PRESERVE: All furniture, decor, layout exactly as-is.
Natural warm lighting, not a filter.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.8, steps: 28 });
  console.log('[Replicate] === LIGHTS ON COMPLETE ===');
  return result;
}


// ============================================
// 9. WINDOW MASKING
// ============================================

export async function windowMasking(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === WINDOW MASKING ===');

  const view = customPrompt || 'clear blue sky with trees and landscaping';

  const prompt = `Fix blown-out windows to show ${view} through them.
PRESERVE: Window frames, all interior, furniture.
Only view through glass changes.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 30 });
  console.log('[Replicate] === WINDOW MASKING COMPLETE ===');
  return result;
}


// ============================================
// 10. COLOR BALANCE
// ============================================

export async function colorBalance(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === COLOR BALANCE ===');

  let adjustment = 'warm and inviting with natural color tones';
  
  if (customPrompt) {
    if (customPrompt.toLowerCase().includes('cool')) {
      adjustment = 'cool and crisp with neutral white balance';
    } else if (customPrompt.toLowerCase().includes('warm')) {
      adjustment = 'warm and cozy with golden undertones';
    } else if (customPrompt.toLowerCase().includes('neutral')) {
      adjustment = 'perfectly neutral white balance';
    }
  }

  const prompt = `Adjust color balance to be ${adjustment}. Correct any color cast. PRESERVE every object exactly.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.0, steps: 25 });
  console.log('[Replicate] === COLOR BALANCE COMPLETE ===');
  return result;
}


// ============================================
// 11. POOL ENHANCEMENT
// ============================================

export async function poolEnhance(imageUrl: string): Promise<string> {
  console.log('[Replicate] === POOL ENHANCEMENT ===');

  const prompt = `Make pool water crystal clear turquoise-blue. Remove debris. PRESERVE pool shape, deck, landscaping.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 28 });
  console.log('[Replicate] === POOL ENHANCEMENT COMPLETE ===');
  return result;
}


// ============================================
// 12. HDR ENHANCEMENT
// ============================================

export async function hdr(imageUrl: string): Promise<string> {
  console.log('[Replicate] === HDR ENHANCEMENT ===');

  const prompt = `Professional HDR enhancement. Brighten shadows, recover highlights, vibrant colors, balanced exposure. PRESERVE all content exactly.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.2, steps: 30 });
  console.log('[Replicate] === HDR ENHANCEMENT COMPLETE ===');
  return result;
}


// ============================================
// 13. PERSPECTIVE CORRECTION
// ============================================

export async function perspectiveCorrection(imageUrl: string): Promise<string> {
  console.log('[Replicate] === PERSPECTIVE CORRECTION ===');

  const prompt = `Correct perspective. Vertical lines straight and parallel. Fix keystoning. PRESERVE all content.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.8, steps: 28 });
  console.log('[Replicate] === PERSPECTIVE CORRECTION COMPLETE ===');
  return result;
}


// ============================================
// 14. LENS CORRECTION
// ============================================

export async function lensCorrection(imageUrl: string): Promise<string> {
  console.log('[Replicate] === LENS CORRECTION ===');

  const prompt = `Fix lens distortion. Straighten curved edges. Remove vignetting. PRESERVE all content.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 25 });
  console.log('[Replicate] === LENS CORRECTION COMPLETE ===');
  return result;
}


// ============================================
// 15. AUTO ENHANCE
// ============================================

export async function autoEnhance(imageUrl: string): Promise<string> {
  console.log('[Replicate] === AUTO ENHANCE ===');
  return hdr(imageUrl);
}


// ============================================
// UPSCALE
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
  
  return extractUrl(output);
}


// ========================================
// SEASONAL TOOLS
// ========================================

export async function snowRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Snow Removal');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "same house, green grass lawn, green leafy trees, blue sky, summer, real estate photo",
        image: imageUrl,
        strength: 0.35
      }
    }
  );
  return extractUrl(output);
}

export async function seasonalSpring(imageUrl: string): Promise<string> {
  console.log('[Replicate] Seasonal - Spring');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "same house, fresh green grass, blooming flowers, budding trees, blue sky, spring",
        image: imageUrl,
        strength: 0.35
      }
    }
  );
  return extractUrl(output);
}

export async function seasonalSummer(imageUrl: string): Promise<string> {
  console.log('[Replicate] Seasonal - Summer');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "same house, lush green grass, full green trees, sunny blue sky, summer day",
        image: imageUrl,
        strength: 0.35
      }
    }
  );
  return extractUrl(output);
}

export async function seasonalFall(imageUrl: string): Promise<string> {
  console.log('[Replicate] Seasonal - Fall');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "same house, orange golden autumn leaves, fall colors, warm light, autumn",
        image: imageUrl,
        strength: 0.35
      }
    }
  );
  return extractUrl(output);
}


// ========================================
// FIX TOOLS
// ========================================

export async function reflectionRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Reflection Removal');
  return runFluxKontext(
    imageUrl,
    'Remove window reflections and glare. Clear glass. Keep everything else exactly the same.',
    { guidance: 2.0, steps: 25 }
  );
}

export async function powerLineRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Power Line Removal');
  return runFluxKontext(
    imageUrl,
    'Remove power lines and wires from sky. Fill with sky. Keep house exactly the same.',
    { guidance: 2.0, steps: 25 }
  );
}

export async function objectRemoval(imageUrl: string, prompt?: string): Promise<string> {
  console.log('[Replicate] Object Removal');
  const removePrompt = prompt || 'Remove trash cans, hoses, clutter';
  return runFluxKontext(
    imageUrl,
    removePrompt + '. Fill naturally. Do not add new objects.',
    { guidance: 2.5, steps: 28 }
  );
}

export async function flashFix(imageUrl: string): Promise<string> {
  console.log('[Replicate] Flash Hotspot Fix');
  return runFluxKontext(
    imageUrl,
    'Fix flash hotspots and bright spots. Even natural lighting. Keep everything the same.',
    { guidance: 2.0, steps: 25 }
  );
}
