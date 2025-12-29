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
// FLUX KONTEXT - With configurable settings
// ============================================

interface FluxKontextOptions {
  guidance?: number;      // Lower = more preservation, Higher = more change
  steps?: number;         // More steps = higher quality
  outputQuality?: number; // JPEG quality
}

async function runFluxKontext(
  imageUrl: string, 
  prompt: string, 
  options: FluxKontextOptions = {}
): Promise<string> {
  const {
    guidance = 3.0,      // Default lowered from 3.5 for better preservation
    steps = 28,
    outputQuality = 95   // Increased from 90
  } = options;

  console.log('[Replicate] Running Flux Kontext...');
  console.log('[Replicate] Prompt:', prompt.substring(0, 100) + '...');
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

  console.log('[Replicate] Flux Kontext complete');
  return extractUrl(output);
}

// ============================================
// 1. SKY REPLACEMENT - Use low guidance for localized edit
// ============================================
export async function skyReplacement(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === SKY REPLACEMENT ===');

  let skyDescription = 'a clear blue sky with soft white clouds';
  
  if (customPrompt) {
    if (customPrompt.toLowerCase().includes('sunset') || customPrompt.toLowerCase().includes('dramatic')) {
      skyDescription = 'a dramatic sunset sky with orange, pink, and purple colors';
    } else if (customPrompt.toLowerCase().includes('cloudy') || customPrompt.toLowerCase().includes('overcast')) {
      skyDescription = 'a soft overcast sky with light gray clouds, even lighting';
    } else if (customPrompt.toLowerCase().includes('twilight') || customPrompt.toLowerCase().includes('dusk')) {
      skyDescription = 'a twilight sky with deep blue and purple gradient';
    } else {
      skyDescription = customPrompt;
    }
  }

  const prompt = `This is a real estate photograph. Replace ONLY the sky area with ${skyDescription}. 
CRITICAL: The house, roof, walls, windows, trees, lawn, driveway, cars, and ALL ground-level elements must remain EXACTLY as they are in the original photo. 
Do NOT change the lighting on the building.
Do NOT change any colors except the sky.
Do NOT add or remove any objects.
Only the sky pixels should change.`;

  // Use lower guidance for more preservation
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 30 });
  console.log('[Replicate] === SKY REPLACEMENT COMPLETE ===');
  return result;
}

// ============================================
// 2. VIRTUAL TWILIGHT - Subtle transformation
// ============================================
export async function virtualTwilight(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL TWILIGHT ===');

  let twilightStyle = 'classic twilight with deep blue sky and warm window glow';
  
  if (customPrompt) {
    if (customPrompt.includes('NIGHT') || customPrompt.includes('stars')) {
      twilightStyle = 'nighttime with dark navy-black sky, some stars visible, all windows glowing warm yellow';
    } else if (customPrompt.includes('blue hour') || customPrompt.includes('Blue Hour')) {
      twilightStyle = 'blue hour with rich deep blue sky (no orange), windows glowing warm yellow';
    } else if (customPrompt.includes('golden hour') || customPrompt.includes('Golden Hour')) {
      twilightStyle = 'golden hour with warm orange-pink sunset sky, golden light on building, windows glowing';
    }
  }

  const prompt = `Transform this exterior real estate photo into a professional ${twilightStyle} scene.

CHANGES TO MAKE:
1. Sky: Change to appropriate twilight/dusk colors
2. Windows: Add warm yellow-orange glow as if interior lights are on
3. Ambient: Subtle dusk atmosphere

MUST PRESERVE EXACTLY:
- House structure, shape, and architecture
- Roof, walls, and all building materials
- Landscaping, lawn, trees, bushes
- Driveway, walkways, and hardscape
- All cars, objects, and details
- Building proportions and perspective

This should look like a professional real estate twilight photo, NOT a filter or overlay.`;

  // Use moderate guidance for balanced transformation
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.8, steps: 32 });
  console.log('[Replicate] === VIRTUAL TWILIGHT COMPLETE ===');
  return result;
}

// ============================================
// 3. LAWN REPAIR - Natural green grass
// ============================================
export async function lawnRepair(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === LAWN REPAIR ===');

  let grassStyle = 'healthy, natural-looking green residential lawn';
  
  if (customPrompt) {
    if (customPrompt.includes('EMERALD') || customPrompt.includes('golf course')) {
      grassStyle = 'lush, vibrant emerald green grass like a golf course - thick and perfectly manicured';
    } else if (customPrompt.includes('natural') || customPrompt.includes('Natural')) {
      grassStyle = 'naturally healthy green lawn with realistic color variation';
    }
  }

  const prompt = `In this real estate photo, improve ONLY the lawn/grass areas to look like ${grassStyle}.

GRASS IMPROVEMENTS:
- Make brown or patchy grass look healthy green
- Natural grass color (not neon or artificial looking)
- Realistic grass texture

MUST NOT CHANGE:
- House, building, roof, walls
- Driveway, walkways, patio
- Trees, shrubs, flower beds (only lawn grass)
- Any objects, cars, furniture
- Sky, lighting conditions
- Anything that is not lawn grass

The grass should look NATURAL and REALISTIC, like a well-maintained yard, not fake or overly saturated.`;

  // Very low guidance to only affect grass color
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.2, steps: 28 });
  console.log('[Replicate] === LAWN REPAIR COMPLETE ===');
  return result;
}

// ============================================
// 4. DECLUTTER - Remove items carefully
// ============================================
export async function declutter(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === DECLUTTER ===');

  let declutterLevel = 'Remove small clutter items like papers, cups, remote controls from surfaces';
  
  if (customPrompt) {
    if (customPrompt.includes('Light Clean')) {
      declutterLevel = 'Remove ONLY very small items: papers, cups, remotes, magazines from tables and counters';
    } else if (customPrompt.includes('Staging Ready')) {
      declutterLevel = 'Remove ALL furniture and items, leaving completely empty room with just walls, floor, windows';
    } else if (customPrompt.includes('Full Clean')) {
      declutterLevel = 'Remove all loose items, decorations, and personal belongings. Keep main furniture only';
    } else if (customPrompt.includes('Moderate')) {
      declutterLevel = 'Remove clutter from surfaces: papers, dishes, toys, clothes. Keep furniture and large decor';
    }
  }

  const prompt = `${declutterLevel}

RULES:
1. Do NOT add any new objects
2. Do NOT move or rearrange furniture
3. Do NOT change wall colors, flooring, or architecture
4. Fill removed areas with appropriate background (floor, counter, table surface)
5. Maintain realistic lighting and shadows

This should look like a clean, staged real estate photo.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.0, steps: 30 });
  console.log('[Replicate] === DECLUTTER COMPLETE ===');
  return result;
}

// ============================================
// 5. VIRTUAL STAGING - Add furniture
// ============================================
export async function virtualStaging(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === VIRTUAL STAGING ===');

  const style = customPrompt || 'modern minimalist';

  const prompt = `Add beautiful ${style} furniture and decor to stage this empty room.

ADD:
- Appropriate furniture for the room type (sofa, bed, dining table, etc.)
- Rugs, lamps, artwork, plants
- Tasteful decorative accessories

MUST PRESERVE:
- Room architecture exactly as-is
- Walls, ceiling, flooring
- Windows, doors, built-ins
- Room dimensions and perspective
- Lighting direction

Furniture should be:
- Properly scaled to the room
- Realistically placed with proper shadows
- High quality, professional staging look`;

  // Higher guidance for staging to ensure furniture is added
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.5, steps: 35 });
  console.log('[Replicate] === VIRTUAL STAGING COMPLETE ===');
  return result;
}

// ============================================
// 6. FIRE IN FIREPLACE - Very localized edit
// ============================================
export async function fireFireplace(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === FIRE IN FIREPLACE ===');

  let fireStyle = 'a warm, realistic crackling fire with orange and yellow flames';
  
  if (customPrompt) {
    if (customPrompt.includes('roaring') || customPrompt.includes('Roaring')) {
      fireStyle = 'a large, roaring fire with tall bright flames';
    } else if (customPrompt.includes('gentle') || customPrompt.includes('Gentle')) {
      fireStyle = 'a gentle, small fire with soft warm flames';
    } else if (customPrompt.includes('ember') || customPrompt.includes('Ember')) {
      fireStyle = 'glowing red-orange embers with small flames';
    }
  }

  const prompt = `Add ${fireStyle} ONLY inside the fireplace opening in this room.

CRITICAL RULES:
1. Fire goes ONLY inside the fireplace firebox/opening
2. Fire must NOT spread outside the fireplace
3. Room must remain EXACTLY the same
4. Do NOT change room lighting or add orange glow to walls
5. Do NOT modify furniture, decor, or any other elements
6. The fire should look realistic and contained

The rest of the room must be IDENTICAL to the original photo.`;

  // Very low guidance to minimize changes outside fireplace
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.0, steps: 28 });
  console.log('[Replicate] === FIRE IN FIREPLACE COMPLETE ===');
  return result;
}

// ============================================
// 7. TV SCREEN REPLACE
// ============================================
export async function tvScreen(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === TV SCREEN REPLACE ===');

  const screenContent = customPrompt || 'a beautiful mountain landscape with a lake';

  const prompt = `Replace ONLY the TV screen content with ${screenContent}.

MUST PRESERVE:
- TV frame and bezel exactly as-is
- TV stand/mount
- All furniture in the room
- Walls, decor, everything else

ONLY the pixels inside the TV screen should change to show the new content.
Match the screen perspective and brightness to look natural.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 28 });
  console.log('[Replicate] === TV SCREEN REPLACE COMPLETE ===');
  return result;
}

// ============================================
// 8. LIGHTS ON
// ============================================
export async function lightsOn(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === LIGHTS ON ===');

  const prompt = `Turn on all the lights in this room to create a warm, inviting atmosphere.

CHANGES:
- Light fixtures should appear illuminated
- Lamps should glow warmly
- Ceiling lights, recessed lights activated
- Natural warm light emanating from fixtures

PRESERVE:
- All furniture positions exactly
- Wall colors and decor
- Window views
- Room layout

The lighting should look natural, not like a filter was applied.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.8, steps: 28 });
  console.log('[Replicate] === LIGHTS ON COMPLETE ===');
  return result;
}

// ============================================
// 9. WINDOW MASKING / VIEW REPLACEMENT
// ============================================
export async function windowMasking(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === WINDOW MASKING ===');

  const viewDescription = customPrompt || 'a clear blue sky with trees and landscaping';

  const prompt = `Fix the overexposed/blown-out windows to show ${viewDescription} through them.

CHANGES:
- Replace white/blown-out window areas with visible outdoor view
- Show realistic view through each window
- Balance exposure between interior and window

PRESERVE EXACTLY:
- Window frames, trim, and muntins
- All interior elements
- Furniture, decor, flooring
- Wall colors and materials

Only the view THROUGH the window glass should change.`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 30 });
  console.log('[Replicate] === WINDOW MASKING COMPLETE ===');
  return result;
}

// ============================================
// 10. COLOR BALANCE / WHITE BALANCE
// ============================================
export async function colorBalance(imageUrl: string, customPrompt?: string): Promise<string> {
  console.log('[Replicate] === COLOR BALANCE ===');

  let colorAdjustment = 'warm and inviting with natural color tones';
  
  if (customPrompt) {
    if (customPrompt.includes('cool') || customPrompt.includes('Cool')) {
      colorAdjustment = 'cool and crisp with neutral white balance';
    } else if (customPrompt.includes('warm') || customPrompt.includes('Warm')) {
      colorAdjustment = 'warm and cozy with golden undertones';
    } else if (customPrompt.includes('neutral') || customPrompt.includes('Neutral')) {
      colorAdjustment = 'perfectly neutral white balance, true-to-life colors';
    }
  }

  const prompt = `Adjust the color balance of this photo to be ${colorAdjustment}.

CHANGES:
- Correct any color cast (too yellow, too blue, etc.)
- Balanced, professional color grading
- Natural skin tones if people present

PRESERVE:
- Every single object in the scene
- Composition and framing
- All details and textures

This is color correction, NOT content modification.`;

  // Very low guidance - this is just color adjustment
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.0, steps: 25 });
  console.log('[Replicate] === COLOR BALANCE COMPLETE ===');
  return result;
}

// ============================================
// 11. POOL ENHANCEMENT
// ============================================
export async function poolEnhance(imageUrl: string): Promise<string> {
  console.log('[Replicate] === POOL ENHANCEMENT ===');

  const prompt = `Make the swimming pool water look crystal clear and inviting.

CHANGES:
- Water should be clean, clear turquoise-blue
- Remove any debris, leaves, or pool equipment visible
- Water should look pristine and refreshing

PRESERVE:
- Pool shape and edges exactly
- Pool deck and surrounding area
- Landscaping, furniture, building
- Everything except the pool water itself`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.5, steps: 28 });
  console.log('[Replicate] === POOL ENHANCEMENT COMPLETE ===');
  return result;
}

// ============================================
// 12. HDR ENHANCEMENT - Global improvement
// ============================================
export async function hdr(imageUrl: string): Promise<string> {
  console.log('[Replicate] === HDR ENHANCEMENT ===');

  const prompt = `Enhance this real estate photo with professional HDR processing.

IMPROVEMENTS:
- Brighten dark shadow areas to reveal detail
- Recover blown-out highlights
- Increase color vibrancy naturally
- Improve overall dynamic range
- Magazine-quality exposure balance

PRESERVE:
- Every object and piece of furniture
- Room layout and composition
- Architectural details
- Natural appearance (no over-processed look)`;

  // Higher guidance for global enhancement
  const result = await runFluxKontext(imageUrl, prompt, { guidance: 3.2, steps: 30 });
  console.log('[Replicate] === HDR ENHANCEMENT COMPLETE ===');
  return result;
}

// ============================================
// 13. PERSPECTIVE CORRECTION
// ============================================
export async function perspectiveCorrection(imageUrl: string): Promise<string> {
  console.log('[Replicate] === PERSPECTIVE CORRECTION ===');

  const prompt = `Correct the perspective in this architectural/real estate photo.

CORRECTIONS:
- Make vertical lines perfectly straight and parallel
- Fix any keystoning or tilted angles
- Correct lens distortion
- Professional architectural perspective

PRESERVE:
- All content and objects
- Colors and lighting
- Interior/exterior details`;

  const result = await runFluxKontext(imageUrl, prompt, { guidance: 2.8, steps: 28 });
  console.log('[Replicate] === PERSPECTIVE CORRECTION COMPLETE ===');
  return result;
}

// ============================================
// 14. LENS CORRECTION
// ============================================
export async function lensCorrection(imageUrl: string): Promise<string> {
  console.log('[Replicate] === LENS CORRECTION ===');

  const prompt = `Correct lens distortion in this photo.

CORRECTIONS:
- Fix barrel or pincushion distortion
- Straighten curved lines at edges
- Remove vignetting
- Professional lens correction

PRESERVE:
- All content exactly
- Colors and exposure
- Image details`;

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
// SEASONAL TOOLS - Using SDXL Lightning with LOW strength
// ========================================

export async function snowRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Snow Removal');
  const output = await replicate.run(
    "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
    {
      input: {
        prompt: "same house, green grass lawn, green leafy trees, blue sky, summer, real estate photo",
        image: imageUrl,
        strength: 0.35  // Lowered from 0.4
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
        prompt: "same house, fresh green grass, blooming flowers, budding trees, blue sky, spring, real estate photo",
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
        prompt: "same house, lush green grass, full green trees, sunny blue sky, summer day, real estate photo",
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
        prompt: "same house, orange golden autumn leaves, fall colors, warm light, autumn, real estate photo",
        image: imageUrl,
        strength: 0.35
      }
    }
  );
  return extractUrl(output);
}

// ========================================
// FIX TOOLS - These need proper inpainting (limited with current setup)
// ========================================

export async function reflectionRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Reflection Removal');
  // Note: Qwen is a vision-language model, not an image editor
  // This won't actually edit the image, just describe it
  // Using Flux Kontext instead
  return runFluxKontext(
    imageUrl,
    'Remove window reflections and glare. Make glass clear. Keep everything else exactly the same.',
    { guidance: 2.0, steps: 25 }
  );
}

export async function powerLineRemoval(imageUrl: string): Promise<string> {
  console.log('[Replicate] Power Line Removal');
  return runFluxKontext(
    imageUrl,
    'Remove power lines, telephone wires, and cables from the sky. Fill with sky. Keep house and everything else exactly the same.',
    { guidance: 2.0, steps: 25 }
  );
}

export async function objectRemoval(imageUrl: string, prompt?: string): Promise<string> {
  console.log('[Replicate] Object Removal');
  const removePrompt = prompt || 'Remove trash cans, hoses, and clutter. Keep house and main features.';
  return runFluxKontext(
    imageUrl,
    removePrompt + ' Fill removed areas naturally. Do not add new objects.',
    { guidance: 2.5, steps: 28 }
  );
}

export async function flashFix(imageUrl: string): Promise<string> {
  console.log('[Replicate] Flash Hotspot Fix');
  return runFluxKontext(
    imageUrl,
    'Fix flash hotspots and harsh bright spots. Create even, natural lighting. Keep all furniture and objects exactly the same.',
    { guidance: 2.0, steps: 25 }
  );
}
