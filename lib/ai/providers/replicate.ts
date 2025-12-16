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
  console.log('[Replicate] Prompt:', prompt.substring(0, 100) + '...');

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
// TOOLS WITH PRESETS (10 tools)
// ============================================

// 1. SKY REPLACEMENT (4 presets)
export async function skyReplacement(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === SKY REPLACEMENT ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  const prompt = customPrompt 
    ? `${customPrompt}. IMPORTANT: Keep the house, roof, trees, lawn, driveway, and ALL other elements exactly the same. Do not change lighting on the house. Only replace the sky.`
    : 'Replace ONLY the sky with a beautiful clear blue sky with white fluffy clouds. Keep the house, roof, trees, lawn, driveway, and everything else exactly the same. Do not change lighting on the house.';

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === SKY REPLACEMENT COMPLETE ===');
  return result;
}

// 2. VIRTUAL TWILIGHT (4 presets)
export async function virtualTwilight(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL TWILIGHT ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  let prompt: string;
  
  if (customPrompt) {
    if (customPrompt.includes('NIGHT') || customPrompt.includes('DARK BLACK-BLUE') || customPrompt.includes('stars')) {
      prompt = 'Transform this to a NIGHT scene. Make the sky completely DARK BLACK with some stars visible. Turn on ALL lights in the house with bright warm yellow glow from every window. The sky must be very dark like midnight. Keep house structure exactly the same.';
    } else if (customPrompt.includes('DEEP BLUE') || customPrompt.includes('blue hour') || customPrompt.includes('Blue Hour')) {
      prompt = 'Transform this to BLUE HOUR. Make the sky a rich DEEP BLUE color with no orange or sunset colors. All windows should glow with bright warm yellow light. Blue twilight atmosphere. Keep house structure exactly the same.';
    } else if (customPrompt.includes('WARM ORANGE') || customPrompt.includes('golden hour') || customPrompt.includes('Golden Hour')) {
      prompt = 'Transform this to GOLDEN HOUR. Make the sky show warm ORANGE and PINK sunset colors. Golden warm light illuminating the house. Windows glowing warmly. Dramatic golden sunset atmosphere. Keep house structure exactly the same.';
    } else {
      prompt = `${customPrompt}. Add warm light glowing from inside all windows. Keep the house structure exactly the same. Professional real estate twilight photography.`;
    }
  } else {
    prompt = 'Transform this daytime exterior photo into a beautiful twilight/dusk scene. Replace the sky with a deep blue and purple gradient with golden orange sunset glow on the horizon. Add warm yellow-orange light glowing from inside all the windows as if interior lights are on. Keep the house structure, landscaping, and all other elements exactly the same. Professional real estate twilight photography style.';
  }

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === VIRTUAL TWILIGHT COMPLETE ===');
  return result;
}

// 3. LAWN REPAIR (2 presets)
export async function lawnRepair(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === LAWN REPAIR ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  let prompt: string;
  
  if (customPrompt) {
    if (customPrompt.includes('EMERALD') || customPrompt.includes('golf course') || customPrompt.includes('PERFECTLY MANICURED')) {
      prompt = 'Transform the lawn into PERFECTLY MANICURED, VIBRANT EMERALD GREEN grass like a professional golf course putting green. Thick, lush, flawless turf with no brown patches, no weeds, deep rich green color. Keep the house, driveway, landscaping features, and everything else exactly the same. Only make the lawn ultra-green and perfect.';
    } else {
      prompt = 'Transform the lawn into healthy NATURAL looking green grass, like a well-maintained residential lawn. Realistic green color, not too dark or artificial. Normal healthy yard appearance. Keep the house, driveway, landscaping features, and everything else exactly the same. Only improve the grass to look naturally healthy.';
    }
  } else {
    prompt = 'Make the lawn and grass in this photo healthy and green. Transform any brown, patchy, or dead grass into well-maintained green turf. Keep the house, driveway, landscaping features, and everything else exactly the same. Only improve the grass and lawn areas.';
  }

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === LAWN REPAIR COMPLETE ===');
  return result;
}

// 4. DECLUTTER (4 presets)
export async function declutter(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === DECLUTTER ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  // Make prompts very specific based on level
  let prompt: string;
  
  if (customPrompt) {
    if (customPrompt.includes('Light Clean')) {
      prompt = 'Remove ONLY small loose items from this room: papers, magazines, remote controls, cups, glasses, dishes on tables. Keep ALL furniture exactly as-is, keep decorations, keep lamps, keep plants. Only remove small clutter items from surfaces. DO NOT add any new objects. DO NOT change furniture. DO NOT move anything. Everything else stays exactly the same.';
    } else if (customPrompt.includes('Staging Ready')) {
      prompt = 'Remove ALL furniture and ALL items from this room completely. Leave ONLY the empty room with bare walls, floor, windows, and doors. No sofas, no tables, no chairs, no decorations, no rugs, nothing. Completely empty room ready for virtual staging.';
    } else if (customPrompt.includes('Full Clean')) {
      prompt = 'Remove all loose items, personal belongings, decorations, books, plants, and accessories from this room. Keep the main furniture (sofas, tables, beds) but remove everything on surfaces and floors. Clean minimalist look with just furniture. DO NOT add any new objects. DO NOT change or move furniture. Everything structural stays exactly the same.';
    } else if (customPrompt.includes('Moderate')) {
      prompt = 'Remove clutter and personal items from counters, tables, and floors. Remove papers, dishes, clothes, toys, magazines. Keep furniture and large decorations but clear surfaces of small items. DO NOT add anything new.';
    } else {
      prompt = `${customPrompt}. Keep the room structure exactly the same. DO NOT add any new objects.`;
    }
  } else {
    prompt = 'Remove clutter and personal items from this room. Remove papers, magazines, dishes, cups, clothes, toys, and loose items. Keep furniture but clear all surfaces. DO NOT add any new objects. Make it look like a clean, staged real estate photo.';
  }

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === DECLUTTER COMPLETE ===');
  return result;
}

// 5. VIRTUAL STAGING (4 presets)
export async function virtualStaging(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL STAGING ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  const prompt = customPrompt
    ? `${customPrompt}. Keep the room architecture, walls, windows, flooring, and layout EXACTLY the same. Only add furniture and decor. Professional real estate virtual staging quality.`
    : 'Stage this empty room with beautiful modern furniture and decor. Add appropriate furniture: sofas, chairs, tables, rugs, lamps, artwork, plants, and decorative accessories. Keep the room architecture, walls, windows, flooring, and layout EXACTLY the same. Only add furniture and decor. Professional real estate virtual staging quality.';

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === VIRTUAL STAGING COMPLETE ===');
  return result;
}

// 6. FIRE IN FIREPLACE (4 presets)
export async function fireFireplace(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === FIRE IN FIREPLACE ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  const prompt = customPrompt
    ? `${customPrompt}. Keep the rest of the room exactly the same. Only add fire to the fireplace.`
    : 'Add a beautiful warm crackling fire to the fireplace in this room. The fire should have realistic orange and yellow flames with a warm cozy glow. Keep the rest of the room exactly the same. Only add fire to the fireplace.';

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === FIRE IN FIREPLACE COMPLETE ===');
  return result;
}

// 7. TV SCREEN REPLACE (4 presets)
export async function tvScreen(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === TV SCREEN REPLACE ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  const prompt = customPrompt
    ? `${customPrompt}. Keep the TV frame, TV stand, and the rest of the room exactly the same. Only change what's displayed on the TV screen.`
    : 'Replace the TV screen with a beautiful nature landscape scene showing mountains and a lake. Keep the TV frame, TV stand, and the rest of the room exactly the same. Only change what is displayed on the TV screen.';

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === TV SCREEN REPLACE COMPLETE ===');
  return result;
}

// 8. LIGHTS ON (4 presets)
export async function lightsOn(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === LIGHTS ON ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  const prompt = customPrompt
    ? `${customPrompt}. Keep everything else in the room exactly the same. Only turn on the lights.`
    : 'Turn on all the lights in this room. Make all light fixtures, lamps, ceiling lights, and recessed lights appear to be turned on with a warm inviting glow. Keep everything else in the room exactly the same. Only turn on the lights.';

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === LIGHTS ON COMPLETE ===');
  return result;
}

// 9. WINDOW MASKING (4 presets)
export async function windowMasking(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === WINDOW MASKING ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  const prompt = customPrompt
    ? `${customPrompt}. Keep the interior room, furniture, and everything else exactly the same. Only change what is visible through the windows.`
    : 'Balance the window exposure to show a clear view outside. Replace any blown-out white windows with a beautiful blue sky and green landscaping visible through the windows. Keep the interior room, furniture, and everything else exactly the same. Only change what is visible through the windows.';

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === WINDOW MASKING COMPLETE ===');
  return result;
}

// 10. COLOR BALANCE (2 presets)
export async function colorBalance(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === COLOR BALANCE ===');
  console.log('[Replicate] Custom prompt:', customPrompt ? 'YES' : 'NO');

  const prompt = customPrompt
    ? `${customPrompt}. Keep EVERYTHING in the scene exactly the same - same composition, same objects. Only adjust the color temperature and tones.`
    : 'Apply warm color balance to this photo with cozy golden warmth and inviting atmosphere. Keep EVERYTHING in the scene exactly the same - same composition, same objects. Only adjust the color temperature and tones.';

  const result = await runFluxKontext(imageUrl, prompt);
  console.log('[Replicate] === COLOR BALANCE COMPLETE ===');
  return result;
}

// ============================================
// TOOLS WITHOUT PRESETS (5 tools - one-click)
// ============================================

// 11. POOL ENHANCEMENT (no presets)
export async function poolEnhance(imageUrl: string): Promise<string> {
  console.log('[Replicate] === POOL ENHANCEMENT ===');

  const result = await runFluxKontext(
    imageUrl,
    'Make the swimming pool water crystal clear, clean, and inviting with a beautiful vibrant blue-turquoise color. Remove any debris, leaves, pool cleaners, hoses, or equipment from the pool. The pool should look pristine and ready for a magazine photoshoot. Keep the pool shape, surrounding deck, landscaping, and everything else exactly the same. Only improve the pool water appearance.',
  );

  console.log('[Replicate] === POOL ENHANCEMENT COMPLETE ===');
  return result;
}

// 12. HDR ENHANCEMENT (no presets)
export async function hdr(imageUrl: string): Promise<string> {
  console.log('[Replicate] === HDR ENHANCEMENT ===');

  const result = await runFluxKontext(
    imageUrl,
    'Apply professional HDR enhancement to this real estate photo. Brighten dark shadow areas to reveal detail, balance overexposed highlights, make colors more vibrant and saturated, improve overall exposure balance for a magazine-quality look. Keep EVERYTHING in the scene exactly the same - same furniture, same room, same composition. Only improve lighting, exposure, and color vibrancy.',
  );

  console.log('[Replicate] === HDR ENHANCEMENT COMPLETE ===');
  return result;
}

// 13. PERSPECTIVE CORRECTION (no presets)
export async function perspectiveCorrection(imageUrl: string): Promise<string> {
  console.log('[Replicate] === PERSPECTIVE CORRECTION ===');

  const result = await runFluxKontext(
    imageUrl,
    'Correct the perspective and vertical lines in this architectural photo. Make all vertical lines perfectly straight and parallel. Fix any lens distortion or tilted angles. The walls, doors, windows, and architectural elements should all have proper vertical alignment. Keep everything else exactly the same. Professional architectural photography perspective correction.',
  );

  console.log('[Replicate] === PERSPECTIVE CORRECTION COMPLETE ===');
  return result;
}

// 14. LENS CORRECTION (no presets)
export async function lensCorrection(imageUrl: string): Promise<string> {
  console.log('[Replicate] === LENS CORRECTION ===');

  const result = await runFluxKontext(
    imageUrl,
    'Correct any lens distortion in this photo. Fix barrel distortion and pincushion distortion. Straighten any curved lines that should be straight, especially at the edges of the frame. Remove any vignetting or light falloff at corners. Keep everything else exactly the same. Professional lens correction quality.',
  );

  console.log('[Replicate] === LENS CORRECTION COMPLETE ===');
  return result;
}

// 15. AUTO ENHANCE (no presets - uses HDR)
export async function autoEnhance(imageUrl: string): Promise<string> {
  console.log('[Replicate] === AUTO ENHANCE ===');
  return hdr(imageUrl);
}

// ============================================
// UPSCALE (utility function)
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

// ========================================
// SEASONAL TOOLS (4) - Using Qwen (same as declutter)
// ========================================

export async function snowRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Snow Removal');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "beautiful house, lush green grass lawn, full green leafy trees, clear blue sunny sky, professional real estate photography, summer day",
        image: imageUrl,
        strength: 0.4
      }
    }
  );
  const result = Array.isArray(output) ? output[0] : output;
  return String(result);
}

export async function seasonalSpring(imageUrl: string): Promise<string> {
  console.log('[Replicate] Seasonal - Spring');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "beautiful house, fresh green grass, blooming flowers, budding trees with light green leaves, clear blue sky, spring day, professional real estate photography",
        image: imageUrl,
        strength: 0.4
      }
    }
  );
  const result = Array.isArray(output) ? output[0] : output;
  return String(result);
}

export async function seasonalSummer(imageUrl: string): Promise<string> {
  console.log('[Replicate] Seasonal - Summer');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "beautiful house, lush deep green grass, full green trees, bright sunny blue sky with white clouds, summer day, professional real estate photography",
        image: imageUrl,
        strength: 0.4
      }
    }
  );
  const result = Array.isArray(output) ? output[0] : output;
  return String(result);
}

export async function seasonalFall(imageUrl: string): Promise<string> {
  console.log('[Replicate] Seasonal - Fall');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "beautiful house, orange red golden yellow autumn leaves on trees, some fallen leaves on ground, warm autumn sunlight, fall season, professional real estate photography",
        image: imageUrl,
        strength: 0.4
      }
    }
  );
  const result = Array.isArray(output) ? output[0] : output;
  return String(result);
}

// ========================================
// FIX TOOLS (4) - Using Qwen
// ========================================

export async function reflectionRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Reflection Removal');
  const output = await replicate.run(
    "qwen/qwen2.5-vl-72b-instruct:c52c45f74815c51db23e4c2c3ab78e59d3a14d3d3e0c3bc4242c1c43c6a6b28c",
    {
      input: {
        image: imageUrl,
        prompt: "Remove all reflections and glare from the windows. Make the glass crystal clear. Keep everything else exactly the same."
      }
    }
  );
  return String(output);
}

export async function powerLineRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Power Line Removal');
  const output = await replicate.run(
    "qwen/qwen2.5-vl-72b-instruct:c52c45f74815c51db23e4c2c3ab78e59d3a14d3d3e0c3bc4242c1c43c6a6b28c",
    {
      input: {
        image: imageUrl,
        prompt: "Remove all power lines, telephone wires, and electrical cables from the sky. Keep the house and everything else exactly the same."
      }
    }
  );
  return String(output);
}

export async function objectRemoval(imageUrl: string, prompt?: string): Promise<string> {
  console.log('[Replicate] Object Removal');
  const output = await replicate.run(
    "qwen/qwen2.5-vl-72b-instruct:c52c45f74815c51db23e4c2c3ab78e59d3a14d3d3e0c3bc4242c1c43c6a6b28c",
    {
      input: {
        image: imageUrl,
        prompt: prompt || "Remove trash cans, cars, hoses, and clutter from this photo. Keep the house and main features exactly the same."
      }
    }
  );
  return String(output);
}

export async function flashFix(imageUrl: string): Promise<string> {
  console.log('[Replicate] Flash Hotspot Fix');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "professional real estate interior photo, natural even balanced lighting, no harsh shadows, no bright spots",
        image: imageUrl,
        strength: 0.25
      }
    }
  );
  const result = Array.isArray(output) ? output[0] : output;
  return String(result);
}
