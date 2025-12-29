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
// FLUX KONTEXT - Main editing model
// FIXED: Lower guidance for subtle edits, higher for dramatic
// ============================================

async function runFluxKontext(
  imageUrl: string, 
  prompt: string, 
  options: { guidance?: number; steps?: number } = {}
): Promise<string> {
  const { guidance = 3.0, steps = 28 } = options;
  
  console.log('[Replicate] Running Flux Kontext...');
  console.log('[Replicate] Prompt:', prompt.substring(0, 100) + '...');
  console.log('[Replicate] Guidance:', guidance, 'Steps:', steps);

  const output = await withTimeout(
    replicate.run('black-forest-labs/flux-kontext-dev', {
      input: {
        input_image: imageUrl,
        prompt,
        guidance,
        num_inference_steps: steps,
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
        output_quality: 95,
      },
    }),
    120000,
    'Flux Kontext',
  );

  console.log('[Replicate] Flux Kontext complete');
  return extractUrl(output);
}

// ============================================
// 1. SKY REPLACEMENT - 4 variants
// ============================================

const SKY_PROMPTS: Record<string, string> = {
  // Default / Blue Sky
  'default': 'Replace the sky with a beautiful clear blue sky with a few soft white clouds. The sky should be bright and inviting. Keep the house, roof, trees, lawn, driveway, and ALL other elements exactly the same. Do not change the lighting on the building. Only replace the sky area.',
  
  // Sunny variant
  'sunny': 'Replace the sky with a bright, vibrant blue sky with scattered fluffy white cumulus clouds. Sunny summer day atmosphere. Keep the house, roof, trees, lawn, and everything else exactly the same. Only replace the sky.',
  'blue': 'Replace the sky with a bright, vibrant blue sky with scattered fluffy white cumulus clouds. Sunny summer day atmosphere. Keep the house, roof, trees, lawn, and everything else exactly the same. Only replace the sky.',
  
  // Sunset variant - BRIGHTER, not dark
  'sunset': 'Replace the sky with a beautiful sunset sky featuring warm orange, pink and golden colors near the horizon, transitioning to light blue higher up. The sunset should be BRIGHT and colorful, not dark. Keep the house, roof, trees, lawn, and everything else exactly the same. Only replace the sky.',
  'golden': 'Replace the sky with a beautiful sunset sky featuring warm orange, pink and golden colors near the horizon, transitioning to light blue higher up. The sunset should be BRIGHT and colorful, not dark. Keep the house, roof, trees, lawn, and everything else exactly the same. Only replace the sky.',
  
  // Dramatic variant
  'dramatic': 'Replace the sky with dramatic clouds - large billowing white and gray clouds against a deep blue sky. Impressive and eye-catching but still daytime. Keep the house, roof, trees, lawn, and everything else exactly the same. Only replace the sky.',
  'clouds': 'Replace the sky with dramatic clouds - large billowing white and gray clouds against a deep blue sky. Impressive and eye-catching but still daytime. Keep the house, roof, trees, lawn, and everything else exactly the same. Only replace the sky.',
  
  // Cloudy variant
  'cloudy': 'Replace the sky with a soft overcast sky - light gray clouds providing even, diffused lighting. Professional real estate look without harsh shadows. Keep the house, roof, trees, lawn, and everything else exactly the same. Only replace the sky.',
  'overcast': 'Replace the sky with a soft overcast sky - light gray clouds providing even, diffused lighting. Professional real estate look without harsh shadows. Keep the house, roof, trees, lawn, and everything else exactly the same. Only replace the sky.',
};

export async function skyReplacement(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === SKY REPLACEMENT ===');
  console.log('[Replicate] Custom prompt:', customPrompt || 'none');

  let prompt = SKY_PROMPTS['default'];
  
  if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase();
    
    // Match preset keywords
    if (lowerPrompt.includes('sunset') || lowerPrompt.includes('golden') || lowerPrompt.includes('orange')) {
      prompt = SKY_PROMPTS['sunset'];
    } else if (lowerPrompt.includes('dramatic') || lowerPrompt.includes('cloud')) {
      prompt = SKY_PROMPTS['dramatic'];
    } else if (lowerPrompt.includes('overcast') || lowerPrompt.includes('cloudy') || lowerPrompt.includes('soft')) {
      prompt = SKY_PROMPTS['cloudy'];
    } else if (lowerPrompt.includes('sunny') || lowerPrompt.includes('blue') || lowerPrompt.includes('clear')) {
      prompt = SKY_PROMPTS['sunny'];
    } else {
      // Custom prompt - append preservation instructions
      prompt = `${customPrompt}. Keep the house, roof, trees, lawn, driveway, and ALL other elements exactly the same. Only replace the sky.`;
    }
  }

  // Use lower guidance for sky - we want subtle, natural replacement
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 25 });
  console.log('[Replicate] === SKY REPLACEMENT COMPLETE ===');
  return result;
}

// ============================================
// 2. VIRTUAL TWILIGHT - 4 variants
// FIXED: Each variant has distinct, different prompt
// ============================================

const TWILIGHT_PROMPTS: Record<string, string> = {
  // Default twilight
  'default': 'Transform this daytime exterior photo into a beautiful twilight scene. Replace the sky with a gradient from deep blue at top to warm orange-pink at the horizon. Add warm yellow-orange light glowing from inside all windows. The house should have interior lights on. Keep the house structure, landscaping, and all other elements exactly the same. Professional real estate twilight photography.',
  
  // Warm Twilight - orange/pink sky
  'warm': 'Transform this into GOLDEN HOUR twilight. The sky should show warm ORANGE and PINK sunset colors with golden light. Add bright warm yellow light glowing from every window. The scene should feel cozy and inviting with golden warm tones. Keep house structure exactly the same.',
  'golden': 'Transform this into GOLDEN HOUR twilight. The sky should show warm ORANGE and PINK sunset colors with golden light. Add bright warm yellow light glowing from every window. The scene should feel cozy and inviting with golden warm tones. Keep house structure exactly the same.',
  'golden hour': 'Transform this into GOLDEN HOUR twilight. The sky should show warm ORANGE and PINK sunset colors with golden light. Add bright warm yellow light glowing from every window. The scene should feel cozy and inviting with golden warm tones. Keep house structure exactly the same.',
  
  // Blue Hour - deep blue sky, no orange
  'blue': 'Transform this into BLUE HOUR. Make the sky a rich DEEP BLUE color - no orange, no pink, just beautiful deep blue twilight. All windows should glow with bright warm YELLOW light creating contrast against the blue sky. Cool blue atmosphere with warm window glow. Keep house structure exactly the same.',
  'blue hour': 'Transform this into BLUE HOUR. Make the sky a rich DEEP BLUE color - no orange, no pink, just beautiful deep blue twilight. All windows should glow with bright warm YELLOW light creating contrast against the blue sky. Cool blue atmosphere with warm window glow. Keep house structure exactly the same.',
  'cool': 'Transform this into BLUE HOUR. Make the sky a rich DEEP BLUE color - no orange, no pink, just beautiful deep blue twilight. All windows should glow with bright warm YELLOW light creating contrast against the blue sky. Cool blue atmosphere with warm window glow. Keep house structure exactly the same.',
  
  // Night - dark sky with stars
  'night': 'Transform this into a NIGHT scene. Make the sky completely DARK - deep black-blue with visible stars. Turn on ALL lights in the house with BRIGHT warm yellow-orange glow from every window. Strong contrast between dark sky and bright windows. Nighttime atmosphere. Keep house structure exactly the same.',
  'dark': 'Transform this into a NIGHT scene. Make the sky completely DARK - deep black-blue with visible stars. Turn on ALL lights in the house with BRIGHT warm yellow-orange glow from every window. Strong contrast between dark sky and bright windows. Nighttime atmosphere. Keep house structure exactly the same.',
  'stars': 'Transform this into a NIGHT scene. Make the sky completely DARK - deep black-blue with visible stars. Turn on ALL lights in the house with BRIGHT warm yellow-orange glow from every window. Strong contrast between dark sky and bright windows. Nighttime atmosphere. Keep house structure exactly the same.',
  
  // Dramatic - purple/orange dramatic sky
  'dramatic': 'Transform this into DRAMATIC twilight. Create a stunning sky with deep purple, orange, and pink colors - a spectacular sunset. All windows glowing warmly. Dramatic, eye-catching real estate photo. Keep house structure exactly the same.',
  'purple': 'Transform this into DRAMATIC twilight. Create a stunning sky with deep purple, orange, and pink colors - a spectacular sunset. All windows glowing warmly. Dramatic, eye-catching real estate photo. Keep house structure exactly the same.',
};

export async function virtualTwilight(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL TWILIGHT ===');
  console.log('[Replicate] Custom prompt:', customPrompt || 'none');

  let prompt = TWILIGHT_PROMPTS['default'];
  
  if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase();
    
    // Match preset keywords - check most specific first
    if (lowerPrompt.includes('night') || lowerPrompt.includes('dark') || lowerPrompt.includes('star') || lowerPrompt.includes('midnight')) {
      prompt = TWILIGHT_PROMPTS['night'];
      console.log('[Replicate] Using NIGHT preset');
    } else if (lowerPrompt.includes('blue hour') || lowerPrompt.includes('blue') || lowerPrompt.includes('cool')) {
      prompt = TWILIGHT_PROMPTS['blue'];
      console.log('[Replicate] Using BLUE HOUR preset');
    } else if (lowerPrompt.includes('golden') || lowerPrompt.includes('warm') || lowerPrompt.includes('orange') || lowerPrompt.includes('pink')) {
      prompt = TWILIGHT_PROMPTS['warm'];
      console.log('[Replicate] Using WARM/GOLDEN preset');
    } else if (lowerPrompt.includes('dramatic') || lowerPrompt.includes('purple') || lowerPrompt.includes('spectacular')) {
      prompt = TWILIGHT_PROMPTS['dramatic'];
      console.log('[Replicate] Using DRAMATIC preset');
    } else {
      // Custom prompt
      prompt = `${customPrompt}. Add warm light glowing from inside all windows. Keep the house structure exactly the same. Professional real estate twilight photography.`;
      console.log('[Replicate] Using CUSTOM prompt');
    }
  }

  // Higher guidance for twilight - we want more dramatic transformation
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.5, steps: 30 });
  console.log('[Replicate] === VIRTUAL TWILIGHT COMPLETE ===');
  return result;
}

// ============================================
// 3. LAWN REPAIR - 2 variants
// ============================================

const LAWN_PROMPTS: Record<string, string> = {
  'default': 'Make the lawn and grass healthy and green. Transform any brown, patchy, or dead grass into well-maintained green turf. Natural, realistic grass color - not artificial looking. Keep the house, driveway, landscaping features, and everything else exactly the same. Only improve the grass and lawn areas.',
  
  'natural': 'Transform the lawn into healthy NATURAL looking green grass, like a well-maintained residential lawn. Realistic green color, not too dark or artificial. Normal healthy yard appearance. Keep everything else exactly the same.',
  
  'emerald': 'Transform the lawn into PERFECTLY MANICURED, VIBRANT EMERALD GREEN grass like a professional golf course. Thick, lush, flawless turf with no brown patches, deep rich green color. Keep everything else exactly the same.',
  'golf': 'Transform the lawn into PERFECTLY MANICURED, VIBRANT EMERALD GREEN grass like a professional golf course. Thick, lush, flawless turf with no brown patches, deep rich green color. Keep everything else exactly the same.',
  'perfect': 'Transform the lawn into PERFECTLY MANICURED, VIBRANT EMERALD GREEN grass like a professional golf course. Thick, lush, flawless turf with no brown patches, deep rich green color. Keep everything else exactly the same.',
};

export async function lawnRepair(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === LAWN REPAIR ===');
  
  let prompt = LAWN_PROMPTS['default'];
  
  if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase();
    
    if (lowerPrompt.includes('emerald') || lowerPrompt.includes('golf') || lowerPrompt.includes('perfect') || lowerPrompt.includes('manicured')) {
      prompt = LAWN_PROMPTS['emerald'];
    } else if (lowerPrompt.includes('natural') || lowerPrompt.includes('realistic')) {
      prompt = LAWN_PROMPTS['natural'];
    } else {
      prompt = `${customPrompt}. Keep everything else exactly the same. Only improve the grass.`;
    }
  }

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 25 });
  console.log('[Replicate] === LAWN REPAIR COMPLETE ===');
  return result;
}

// ============================================
// 4. DECLUTTER - 4 variants
// ============================================

const DECLUTTER_PROMPTS: Record<string, string> = {
  'default': 'Remove clutter and personal items from this room. Remove papers, magazines, dishes, cups, clothes, toys, and loose items on surfaces. Keep furniture but clear all surfaces. DO NOT add any new objects. Make it look like a clean, staged real estate photo.',
  
  'light': 'Remove ONLY small loose items: papers, magazines, remote controls, cups, glasses, dishes on tables. Keep ALL furniture, decorations, lamps, plants. Only remove small clutter from surfaces. DO NOT add anything new.',
  
  'moderate': 'Remove clutter and personal items from counters, tables, and floors. Remove papers, dishes, clothes, toys, magazines. Keep furniture and large decorations but clear surfaces of small items. DO NOT add anything new.',
  
  'full': 'Remove all loose items, personal belongings, decorations, books, plants, and accessories. Keep the main furniture (sofas, tables, beds) but remove everything on surfaces and floors. Clean minimalist look. DO NOT add anything new.',
  
  'empty': 'Remove ALL furniture and ALL items from this room completely. Leave ONLY the empty room with bare walls, floor, windows, and doors. Completely empty room ready for virtual staging.',
  'staging': 'Remove ALL furniture and ALL items from this room completely. Leave ONLY the empty room with bare walls, floor, windows, and doors. Completely empty room ready for virtual staging.',
};

export async function declutter(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === DECLUTTER ===');
  
  let prompt = DECLUTTER_PROMPTS['default'];
  
  if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase();
    
    if (lowerPrompt.includes('staging') || lowerPrompt.includes('empty') || lowerPrompt.includes('remove all')) {
      prompt = DECLUTTER_PROMPTS['empty'];
    } else if (lowerPrompt.includes('full') || lowerPrompt.includes('deep')) {
      prompt = DECLUTTER_PROMPTS['full'];
    } else if (lowerPrompt.includes('moderate') || lowerPrompt.includes('medium')) {
      prompt = DECLUTTER_PROMPTS['moderate'];
    } else if (lowerPrompt.includes('light') || lowerPrompt.includes('minimal')) {
      prompt = DECLUTTER_PROMPTS['light'];
    } else {
      prompt = `${customPrompt}. Keep the room structure exactly the same. DO NOT add any new objects.`;
    }
  }

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.0, steps: 28 });
  console.log('[Replicate] === DECLUTTER COMPLETE ===');
  return result;
}

// ============================================
// 5. VIRTUAL STAGING - 4 variants
// ============================================

const STAGING_PROMPTS: Record<string, string> = {
  'default': 'Stage this empty room with beautiful modern furniture and decor. Add a sofa, coffee table, rug, side tables, lamps, artwork, and plants. Furniture should be stylish and appropriately sized. Keep the room architecture, walls, windows, flooring exactly the same. Professional real estate staging.',
  
  'modern': 'Stage this empty room with MODERN CONTEMPORARY furniture. Clean lines, neutral colors (gray, white, black, beige), minimalist design. Add modern sofa, sleek coffee table, contemporary artwork, simple rug. Keep room architecture exactly the same.',
  
  'traditional': 'Stage this empty room with TRADITIONAL CLASSIC furniture. Elegant, timeless pieces with rich wood tones, comfortable upholstered furniture, classic patterns. Add traditional sofa, wood coffee table, elegant artwork, ornate rug. Keep room architecture exactly the same.',
  
  'minimalist': 'Stage this empty room with MINIMALIST furniture. Very few pieces, clean and uncluttered. Only essential furniture - simple sofa, one coffee table, one artwork. Lots of open space. Keep room architecture exactly the same.',
  
  'luxury': 'Stage this empty room with LUXURY HIGH-END furniture. Premium designer pieces, rich materials, elegant styling. Add luxury sofa, designer coffee table, high-end artwork, plush rug, statement lighting. Keep room architecture exactly the same.',
};

export async function virtualStaging(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL STAGING ===');
  
  let prompt = STAGING_PROMPTS['default'];
  
  if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase();
    
    if (lowerPrompt.includes('luxury') || lowerPrompt.includes('high-end') || lowerPrompt.includes('premium')) {
      prompt = STAGING_PROMPTS['luxury'];
    } else if (lowerPrompt.includes('minimalist') || lowerPrompt.includes('minimal') || lowerPrompt.includes('simple')) {
      prompt = STAGING_PROMPTS['minimalist'];
    } else if (lowerPrompt.includes('traditional') || lowerPrompt.includes('classic') || lowerPrompt.includes('elegant')) {
      prompt = STAGING_PROMPTS['traditional'];
    } else if (lowerPrompt.includes('modern') || lowerPrompt.includes('contemporary')) {
      prompt = STAGING_PROMPTS['modern'];
    } else {
      prompt = `${customPrompt}. Keep the room architecture exactly the same. Only add furniture and decor.`;
    }
  }

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.5, steps: 32 });
  console.log('[Replicate] === VIRTUAL STAGING COMPLETE ===');
  return result;
}

// ============================================
// 6. FIRE IN FIREPLACE
// FIXED: More controlled prompt to not affect whole room
// ============================================

export async function fireFireplace(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === FIRE IN FIREPLACE ===');

  const prompt = customPrompt
    ? `${customPrompt}. IMPORTANT: Only add fire inside the fireplace opening. Do NOT change the rest of the room at all.`
    : 'Add a realistic crackling fire inside the fireplace. Orange and yellow flames with a natural warm glow. The fire should only be inside the fireplace opening. DO NOT change the rest of the room - keep all furniture, walls, floors, and decorations exactly the same.';

  // Lower guidance to prevent affecting whole room
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 25 });
  console.log('[Replicate] === FIRE IN FIREPLACE COMPLETE ===');
  return result;
}

// ============================================
// 7. TV SCREEN REPLACE
// ============================================

export async function tvScreen(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === TV SCREEN REPLACE ===');

  const prompt = customPrompt
    ? `${customPrompt}. Only change the TV screen content. Keep the TV frame, stand, and rest of room exactly the same.`
    : 'Replace the TV screen with a beautiful nature landscape showing mountains and a lake. Only change what is displayed on the TV screen. Keep the TV frame, TV stand, and the rest of the room exactly the same.';

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 25 });
  console.log('[Replicate] === TV SCREEN REPLACE COMPLETE ===');
  return result;
}

// ============================================
// 8. LIGHTS ON
// ============================================

export async function lightsOn(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === LIGHTS ON ===');

  const prompt = customPrompt
    ? `${customPrompt}. Keep everything else exactly the same.`
    : 'Turn on all the lights in this room. Make all light fixtures, lamps, ceiling lights, and recessed lights appear to be turned on with a warm inviting glow. Keep everything else in the room exactly the same.';

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 25 });
  console.log('[Replicate] === LIGHTS ON COMPLETE ===');
  return result;
}

// ============================================
// 9. WINDOW MASKING
// ============================================

export async function windowMasking(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === WINDOW MASKING ===');

  const prompt = customPrompt
    ? `${customPrompt}. Keep the interior room exactly the same.`
    : 'Balance the window exposure. Replace any blown-out white windows with a clear view of blue sky and green landscaping outside. Keep the interior room, furniture, and everything else exactly the same.';

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 25 });
  console.log('[Replicate] === WINDOW MASKING COMPLETE ===');
  return result;
}

// ============================================
// 10. COLOR BALANCE
// ============================================

export async function colorBalance(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === COLOR BALANCE ===');

  const prompt = customPrompt
    ? `${customPrompt}. Keep everything in the scene exactly the same. Only adjust colors.`
    : 'Apply warm color balance with cozy golden warmth. Keep everything in the scene exactly the same - same composition, same objects. Only adjust the color temperature and tones.';

  // Very low guidance for subtle color adjustment
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.0, steps: 20 });
  console.log('[Replicate] === COLOR BALANCE COMPLETE ===');
  return result;
}

// ============================================
// ONE-CLICK TOOLS (no presets)
// ============================================

export async function poolEnhance(imageUrl: string): Promise<string> {
  console.log('[Replicate] === POOL ENHANCEMENT ===');
  const result = await runFluxKontext(
    imageUrl,
    'Make the swimming pool water crystal clear and inviting with a beautiful vibrant blue-turquoise color. Remove any debris or equipment from the pool. Keep the pool shape, surrounding deck, and everything else exactly the same.',
    { guidance: 2.5, steps: 25 }
  );
  console.log('[Replicate] === POOL ENHANCEMENT COMPLETE ===');
  return result;
}

export async function hdr(imageUrl: string): Promise<string> {
  console.log('[Replicate] === HDR ENHANCEMENT ===');
  const result = await runFluxKontext(
    imageUrl,
    'Apply professional HDR enhancement. Brighten dark shadows to reveal detail, balance highlights, make colors more vibrant. Keep everything in the scene exactly the same. Only improve lighting and exposure.',
    { guidance: 2.0, steps: 22 }
  );
  console.log('[Replicate] === HDR ENHANCEMENT COMPLETE ===');
  return result;
}

export async function perspectiveCorrection(imageUrl: string): Promise<string> {
  console.log('[Replicate] === PERSPECTIVE CORRECTION ===');
  const result = await runFluxKontext(
    imageUrl,
    'Correct the perspective and vertical lines. Make all vertical lines perfectly straight and parallel. Fix any lens distortion or tilted angles. Keep everything else exactly the same.',
    { guidance: 2.5, steps: 25 }
  );
  console.log('[Replicate] === PERSPECTIVE CORRECTION COMPLETE ===');
  return result;
}

export async function lensCorrection(imageUrl: string): Promise<string> {
  console.log('[Replicate] === LENS CORRECTION ===');
  const result = await runFluxKontext(
    imageUrl,
    'Correct lens distortion. Fix barrel and pincushion distortion. Straighten curved lines. Remove vignetting. Keep everything else exactly the same.',
    { guidance: 2.5, steps: 25 }
  );
  console.log('[Replicate] === LENS CORRECTION COMPLETE ===');
  return result;
}

export async function autoEnhance(imageUrl: string): Promise<string> {
  console.log('[Replicate] === AUTO ENHANCE ===');
  return hdr(imageUrl);
}

// ============================================
// UPSCALE - Real-ESRGAN
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
// SEASONAL TOOLS (4) - SDXL Lightning
// ========================================

export async function snowRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Snow Removal');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "beautiful house, lush green grass lawn, full green leafy trees, clear blue sunny sky, professional real estate photography, summer day",
        image: imageUrl,
        strength: 0.35
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
        strength: 0.35
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
        strength: 0.35
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
        strength: 0.35
      }
    }
  );
  const result = Array.isArray(output) ? output[0] : output;
  return String(result);
}

// ========================================
// FIX TOOLS (4) - Using Flux Kontext
// ========================================

export async function reflectionRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Reflection Removal');
  const result = await runFluxKontext(
    imageUrl,
    'Remove all reflections and glare from the windows. Make the glass clear so you can see through. Keep everything else exactly the same.',
    { guidance: 2.5, steps: 25 }
  );
  return result;
}

export async function powerLineRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Power Line Removal');
  const result = await runFluxKontext(
    imageUrl,
    'Remove all power lines, telephone wires, and electrical cables from the sky. Keep the house and everything else exactly the same.',
    { guidance: 2.5, steps: 25 }
  );
  return result;
}

export async function objectRemoval(imageUrl: string, prompt?: string): Promise<string> {
  console.log('[Replicate] Object Removal');
  const result = await runFluxKontext(
    imageUrl,
    prompt || 'Remove trash cans, cars, hoses, and clutter from this photo. Keep the house and main features exactly the same.',
    { guidance: 2.5, steps: 25 }
  );
  return result;
}

export async function flashFix(imageUrl: string): Promise<string> {
  console.log('[Replicate] Flash Hotspot Fix');
  const result = await runFluxKontext(
    imageUrl,
    'Fix flash hotspots and harsh bright spots. Create natural, even lighting throughout the photo. Remove any overexposed areas. Keep everything else exactly the same.',
    { guidance: 2.0, steps: 22 }
  );
  return result;
}
