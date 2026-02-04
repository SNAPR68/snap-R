import Replicate from 'replicate';
import { SAMMasksClient, generateDeterministicLawnMask } from './sam-masks';
import { enqueueReplicate } from './replicate-queue';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const KONTEXT_MODEL = process.env.AI_KONTEXT_MODEL || 'black-forest-labs/flux-kontext-dev';
const REPLICATE_MIN_INTERVAL_MS = Number(process.env.REPLICATE_MIN_INTERVAL_MS || 12000);

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractUrl(output: unknown): string {
  if (!output) throw new Error('Replicate returned no output');
  const result = Array.isArray(output) ? output[0] : output;
  if (!result) throw new Error('Replicate returned empty result');
  if (typeof result === 'string') return result;
  if (typeof (result as any).url === 'function') return (result as any).url();
  return String(result);
}

async function runWithQueue<T>(fn: () => Promise<T>): Promise<T> {
  return enqueueReplicate(fn, REPLICATE_MIN_INTERVAL_MS);
}

// ============================================
// FLUX KONTEXT - Main editing model
// FIXED: Lower guidance for subtle edits, higher for dramatic
// ============================================

export type FluxOptions = { guidance?: number; steps?: number };
export type FluxFillOptions = { guidance?: number; steps?: number; model?: string };

function withFluxDefaults(
  defaults: Required<FluxOptions>,
  overrides?: FluxOptions
): Required<FluxOptions> {
  return {
    guidance: overrides?.guidance ?? defaults.guidance,
    steps: overrides?.steps ?? defaults.steps,
  };
}

async function runFluxKontext(
  imageUrl: string, 
  prompt: string, 
  options: FluxOptions = {}
): Promise<string> {
  const { guidance = 3.0, steps = 28 } = options;
  const safePrompt = (prompt || '').trim() || 'Apply a subtle professional real estate enhancement. Keep structure unchanged.';
  
  console.log('[Replicate] Running Flux Kontext...');
  console.log('[Replicate] Prompt:', safePrompt.substring(0, 100) + '...');
  console.log('[Replicate] Guidance:', guidance, 'Steps:', steps);

  let output: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      output = await withTimeout(
        runWithQueue(() =>
          replicate.run(KONTEXT_MODEL as `${string}/${string}`, {
      input: {
        input_image: imageUrl,
              prompt: safePrompt,
        guidance,
        num_inference_steps: steps,
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
        output_quality: 95,
      },
          })
        ),
    120000,
    'Flux Kontext',
  );
      break;
    } catch (error: any) {
      const message = error?.message || '';
      if (attempt === 0 && message.includes('429')) {
        const retryAfter = message.match(/retry_after\\":\\s*(\\d+)/i)?.[1];
        const waitMs = retryAfter ? Number(retryAfter) * 1000 : 8000;
        console.warn(`[Replicate] Flux Kontext rate limited, retrying in ${Math.round(waitMs / 1000)}s...`);
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }

  console.log('[Replicate] Flux Kontext complete');
  return extractUrl(output);
}

// ============================================
// FLUX FILL - Masked inpainting (sky/lawn/objects)
// ============================================
export async function fluxFillInpaint(
  imageUrl: string,
  maskUrl: string,
  prompt: string,
  options: FluxFillOptions = {}
): Promise<string> {
  const {
    guidance = 8,
    steps = 40,
    model = process.env.AI_INPAINT_PROVIDER || 'black-forest-labs/flux-fill-pro',
  } = options;

  console.log('[Replicate] Running Flux Fill...');
  console.log('[Replicate] Model:', model);

  let output: any;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      output = await withTimeout(
        runWithQueue(() =>
          replicate.run(model as `${string}/${string}`, {
            input: {
              image: imageUrl,
              mask: maskUrl,
              prompt,
              steps,
              guidance,
              output_format: 'jpg',
              output_quality: 95,
            },
          })
        ),
        180000,
        'Flux Fill',
      );
      break;
    } catch (error: any) {
      const message = error?.message || '';
      if (attempt < maxAttempts && message.toLowerCase().includes('timeout')) {
        console.warn('[Replicate] Flux Fill timeout, retrying...');
        continue;
      }
      throw error;
    }
  }

  console.log('[Replicate] Flux Fill complete');
  return extractUrl(output);
}

// ============================================
// 1. SKY REPLACEMENT - 4 variants
// ============================================

const SKY_PROMPTS: Record<string, string> = {
  // Default / Blue Sky
  'default': 'Replace ONLY the sky with a clean, natural blue sky. Smooth gradient from pale azure at the horizon to deeper blue overhead. NO clouds. Do NOT change exposure, shadows, color, or lighting on the house, trees, lawn, or ground. Only the sky changes.',
  
  // Sunny variant
  'sunny': 'Replace ONLY the sky with a bright, clean blue sky (NO clouds). Smooth gradient, natural midday clarity. Do NOT alter the house, trees, lawn, shadows, or overall exposure. Only the sky changes.',
  'blue': 'Replace ONLY the sky with a bright, clean blue sky (NO clouds). Smooth gradient, natural midday clarity. Do NOT alter the house, trees, lawn, shadows, or overall exposure. Only the sky changes.',
  
  // Sunset variant - BRIGHTER, not dark
  'sunset': 'Replace ONLY the sky with a bright sunset gradient. Horizon: warm peach/gold, mid-sky: soft pink, upper sky: pale blue. NO clouds. Keep the scene bright and realistic—do NOT darken the house or change lighting. Only the sky changes.',
  'golden': 'Replace ONLY the sky with a bright sunset gradient. Horizon: warm peach/gold, mid-sky: soft pink, upper sky: pale blue. NO clouds. Keep the scene bright and realistic—do NOT darken the house or change lighting. Only the sky changes.',
  
  // Dramatic variant
  'dramatic': 'Replace ONLY the sky with a rich blue sky and several large, soft cumulus clouds. Bright and professional, not stormy. Keep house, trees, lawn, shadows, and exposure unchanged. Only the sky changes.',
  'clouds': 'Replace ONLY the sky with a rich blue sky and several large, soft cumulus clouds. Bright and professional, not stormy. Keep house, trees, lawn, shadows, and exposure unchanged. Only the sky changes.',
  
  // Cloudy variant
  'cloudy': 'Replace ONLY the sky with a soft, bright overcast (light gray) sky. Even, diffused look. Do NOT change house lighting or shadows. Only the sky changes.',
  'overcast': 'Replace ONLY the sky with a soft, bright overcast (light gray) sky. Even, diffused look. Do NOT change house lighting or shadows. Only the sky changes.',
  
  // Twilight sky only (no lighting changes)
  'twilight': 'Replace ONLY the sky with a clean twilight dusk gradient: deep indigo/blue overhead fading to magenta/violet near the horizon. NO clouds. Do NOT change house lighting, windows, or exposure. Only the sky changes.',
};

export async function skyReplacement(
  imageUrl: string,
  customPrompt?: string,
  presetId?: string,
  options?: FluxOptions
): Promise<string> {
  console.log('[Replicate] === SKY REPLACEMENT ===');
  console.log('[Replicate] Custom prompt:', customPrompt || 'none');
  if (presetId) {
    console.log('[Replicate] Preset:', presetId);
  }

  let prompt = SKY_PROMPTS['default'];
  
  if (presetId) {
    if (presetId === 'clear-blue') prompt = SKY_PROMPTS['sunny'];
    else if (presetId === 'sunset') prompt = SKY_PROMPTS['sunset'];
    else if (presetId === 'dramatic-clouds') prompt = SKY_PROMPTS['dramatic'];
    else if (presetId === 'twilight') prompt = SKY_PROMPTS['twilight'];
  } else if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase();
    
    // Match preset keywords (prioritize clear/sunset over dramatic)
    if (lowerPrompt.includes('sunset') || lowerPrompt.includes('golden') || lowerPrompt.includes('orange')) {
      prompt = SKY_PROMPTS['sunset'];
    } else if (lowerPrompt.includes('no clouds') || lowerPrompt.includes('cloudless') || lowerPrompt.includes('clear') || lowerPrompt.includes('sunny') || lowerPrompt.includes('blue sky')) {
      prompt = SKY_PROMPTS['sunny'];
    } else if (lowerPrompt.includes('overcast') || lowerPrompt.includes('cloudy') || lowerPrompt.includes('soft')) {
      prompt = SKY_PROMPTS['cloudy'];
    } else if (lowerPrompt.includes('twilight') || lowerPrompt.includes('dusk')) {
      prompt = SKY_PROMPTS['twilight'];
      console.log('[Replicate] Using TWILIGHT preset');
    } else if (lowerPrompt.includes('dramatic') || lowerPrompt.includes('cloud')) {
      prompt = SKY_PROMPTS['dramatic'];
    } else {
      // Custom prompt - append preservation instructions
      prompt = `${customPrompt}. Keep the house, roof, trees, lawn, driveway, and ALL other elements exactly the same. Only replace the sky.`;
    }
  }

  // Use lower guidance for sky - we want subtle, natural replacement
  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
  console.log('[Replicate] === SKY REPLACEMENT COMPLETE ===');
  return result;
}

// ============================================
// 2. VIRTUAL TWILIGHT - 4 variants
// FIXED: Each variant has distinct, different prompt
// ============================================

const TWILIGHT_PROMPTS: Record<string, string> = {
  // Default twilight
  'default': 'Transform this daytime exterior into a professional DUSK look. Keep the scene BRIGHT and clearly visible (not night). Sky: smooth clean gradient from warm peach/orange near the horizon to soft cobalt blue overhead, NO clouds. House remains bright with natural contrast; do NOT darken shadows excessively. Windows: warm amber glow that is subtle and realistic, not blown out. Add soft ambient warmth on the patio/ground immediately around the windows. Keep all architecture, trees, lawn, and composition unchanged.',
  'dusk': 'Transform this daytime exterior into a professional DUSK look. Keep the scene BRIGHT and clearly visible (not night). Sky: smooth clean gradient from warm peach/orange near the horizon to soft cobalt blue overhead, NO clouds. House remains bright with natural contrast; do NOT darken shadows excessively. Windows: warm amber glow that is subtle and realistic, not blown out. Add soft ambient warmth on the patio/ground immediately around the windows. Keep all architecture, trees, lawn, and composition unchanged.',
  
  // Warm Twilight - orange/pink sky
  'golden-hour': 'Transform into BRIGHT GOLDEN HOUR. Sky: clean warm gradient with soft peach, honey-gold, and light pink tones near the horizon, fading to pale blue above. NO clouds. House: warm directional sunlight with gentle golden highlights on walls/roof edges; preserve texture and detail. Windows: warm interior glow, moderate intensity. Keep the scene bright, crisp, and natural. No structural changes.',
  'warm': 'Transform into BRIGHT GOLDEN HOUR. Sky: clean warm gradient with soft peach, honey-gold, and light pink tones near the horizon, fading to pale blue above. NO clouds. House: warm directional sunlight with gentle golden highlights on walls/roof edges; preserve texture and detail. Windows: warm interior glow, moderate intensity. Keep the scene bright, crisp, and natural. No structural changes.',
  'golden': 'Transform into BRIGHT GOLDEN HOUR. Sky: clean warm gradient with soft peach, honey-gold, and light pink tones near the horizon, fading to pale blue above. NO clouds. House: warm directional sunlight with gentle golden highlights on walls/roof edges; preserve texture and detail. Windows: warm interior glow, moderate intensity. Keep the scene bright, crisp, and natural. No structural changes.',
  'golden hour': 'Transform into BRIGHT GOLDEN HOUR. Sky: clean warm gradient with soft peach, honey-gold, and light pink tones near the horizon, fading to pale blue above. NO clouds. House: warm directional sunlight with gentle golden highlights on walls/roof edges; preserve texture and detail. Windows: warm interior glow, moderate intensity. Keep the scene bright, crisp, and natural. No structural changes.',
  
  // Blue Hour - deep blue sky, no orange
  'blue-hour': 'Transform into BLUE HOUR twilight. Sky: deep cobalt/royal blue gradient, NO orange/pink, NO clouds. Keep the house clearly visible with cool ambient light, but NOT dark. Windows: warm yellow glow to contrast the blue sky, realistic intensity (not blown out). Add subtle warm spill on nearby patio/ground. Preserve architecture and landscaping exactly.',
  'blue': 'Transform into BLUE HOUR twilight. Sky: deep cobalt/royal blue gradient, NO orange/pink, NO clouds. Keep the house clearly visible with cool ambient light, but NOT dark. Windows: warm yellow glow to contrast the blue sky, realistic intensity (not blown out). Add subtle warm spill on nearby patio/ground. Preserve architecture and landscaping exactly.',
  'blue hour': 'Transform into BLUE HOUR twilight. Sky: deep cobalt/royal blue gradient, NO orange/pink, NO clouds. Keep the house clearly visible with cool ambient light, but NOT dark. Windows: warm yellow glow to contrast the blue sky, realistic intensity (not blown out). Add subtle warm spill on nearby patio/ground. Preserve architecture and landscaping exactly.',
  'cool': 'Transform into BLUE HOUR twilight. Sky: deep cobalt/royal blue gradient, NO orange/pink, NO clouds. Keep the house clearly visible with cool ambient light, but NOT dark. Windows: warm yellow glow to contrast the blue sky, realistic intensity (not blown out). Add subtle warm spill on nearby patio/ground. Preserve architecture and landscaping exactly.',
  
  // Night - dark sky with stars
  'deep-night': 'Transform into NIGHT. Sky: deep blue‑black with NO clouds, subtle stars allowed. House: still clearly visible with balanced exposure, not crushed blacks. Windows: warm interior glow, moderate intensity, realistic. Add gentle warm spill near windows. Preserve all structure and landscaping.',
  'night': 'Transform into NIGHT. Sky: deep blue‑black with NO clouds, subtle stars allowed. House: still clearly visible with balanced exposure, not crushed blacks. Windows: warm interior glow, moderate intensity, realistic. Add gentle warm spill near windows. Preserve all structure and landscaping.',
  'dark': 'Transform into NIGHT. Sky: deep blue‑black with NO clouds, subtle stars allowed. House: still clearly visible with balanced exposure, not crushed blacks. Windows: warm interior glow, moderate intensity, realistic. Add gentle warm spill near windows. Preserve all structure and landscaping.',
  'stars': 'Transform into NIGHT. Sky: deep blue‑black with NO clouds, subtle stars allowed. House: still clearly visible with balanced exposure, not crushed blacks. Windows: warm interior glow, moderate intensity, realistic. Add gentle warm spill near windows. Preserve all structure and landscaping.',
  
  // Dramatic - purple/orange dramatic sky
  'dramatic': 'Transform into DRAMATIC twilight while keeping the scene realistic. Sky: vivid but smooth gradient with purple/magenta/coral tones, NO clouds. House remains bright and detailed; do NOT darken. Windows glow warm but not overexposed. Subtle warm spill on nearby surfaces. Preserve structure and landscaping.',
  'purple': 'Transform into DRAMATIC twilight while keeping the scene realistic. Sky: vivid but smooth gradient with purple/magenta/coral tones, NO clouds. House remains bright and detailed; do NOT darken. Windows glow warm but not overexposed. Subtle warm spill on nearby surfaces. Preserve structure and landscaping.',
};

export async function virtualTwilight(
  imageUrl: string,
  customPrompt?: string,
  presetId?: string,
  options?: FluxOptions
): Promise<string> {
  console.log('[Replicate] === VIRTUAL TWILIGHT ===');
  console.log('[Replicate] Custom prompt:', customPrompt || 'none');
  if (presetId) {
    console.log('[Replicate] Preset:', presetId);
  }

  let prompt = TWILIGHT_PROMPTS['default'];
  
  if (presetId) {
    if (presetId === 'dusk') prompt = TWILIGHT_PROMPTS['dusk'];
    else if (presetId === 'blue-hour') prompt = TWILIGHT_PROMPTS['blue-hour'];
    else if (presetId === 'golden-hour') prompt = TWILIGHT_PROMPTS['golden-hour'];
    else if (presetId === 'deep-night') prompt = TWILIGHT_PROMPTS['deep-night'];
  } else if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase();
    
    // Match preset keywords - check most specific first
    if (lowerPrompt.includes('night') || lowerPrompt.includes('dark') || lowerPrompt.includes('star') || lowerPrompt.includes('midnight')) {
      prompt = TWILIGHT_PROMPTS['night'];
      console.log('[Replicate] Using NIGHT preset');
    } else if (lowerPrompt.includes('dusk') || lowerPrompt.includes('early') || lowerPrompt.includes('soft')) {
      prompt = TWILIGHT_PROMPTS['dusk'];
      console.log('[Replicate] Using DUSK preset');
    } else if (lowerPrompt.includes('blue hour') || lowerPrompt.includes('blue') || lowerPrompt.includes('cool')) {
      prompt = TWILIGHT_PROMPTS['blue-hour'];
      console.log('[Replicate] Using BLUE HOUR preset');
    } else if (lowerPrompt.includes('golden') || lowerPrompt.includes('warm') || lowerPrompt.includes('orange') || lowerPrompt.includes('pink')) {
      prompt = TWILIGHT_PROMPTS['golden-hour'];
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
  const fluxOptions = withFluxDefaults({ guidance: 3.5, steps: 30 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
  console.log('[Replicate] === VIRTUAL TWILIGHT COMPLETE ===');
  return result;
}

// ============================================
// 3. LAWN REPAIR - 2 variants
// ============================================

const LAWN_PROMPTS: Record<string, string> = {
  'default': 'Improve ONLY the grass/lawn areas. Restore patchy/brown grass to healthy green turf with realistic texture and subtle variation. Do NOT add any new plants, flowers, shrubs, or grass beyond the existing lawn. Do NOT change shrubs, trees, flowers, soil, driveway, patio, walls, roof, windows, pool, or shadows. Avoid painting green onto concrete, mulch, stone, or planters. NO structure changes. Keep everything else identical.',
  
  'natural': 'Improve ONLY the lawn/grass to a natural residential green. Mid‑green tone with subtle variation, visible grass texture, no neon. Do NOT add any new plants, flowers, shrubs, or grass beyond the existing lawn. Do NOT alter shrubs, trees, soil, mulch, driveway, patio, walls, roof, windows, pool, or shadows. NO structure changes. Keep all other elements unchanged.',
  
  'emerald': 'Improve ONLY the lawn/grass to a premium lush emerald green (golf‑course quality) but still realistic. Dense, even turf with natural texture, no neon. Do NOT add any new plants, flowers, shrubs, or grass beyond the existing lawn. Do NOT affect shrubs, trees, soil, mulch, driveway, patio, walls, roof, windows, pool, or shadows. NO structure changes. Keep everything else identical.',
  'golf': 'Improve ONLY the lawn/grass to a premium lush emerald green (golf‑course quality) but still realistic. Dense, even turf with natural texture, no neon. Do NOT add any new plants, flowers, shrubs, or grass beyond the existing lawn. Do NOT affect shrubs, trees, soil, mulch, driveway, patio, walls, roof, windows, pool, or shadows. NO structure changes. Keep everything else identical.',
  'perfect': 'Improve ONLY the lawn/grass to a premium lush emerald green (golf‑course quality) but still realistic. Dense, even turf with natural texture, no neon. Do NOT add any new plants, flowers, shrubs, or grass beyond the existing lawn. Do NOT affect shrubs, trees, soil, mulch, driveway, patio, walls, roof, windows, pool, or shadows. NO structure changes. Keep everything else identical.',
};

export async function lawnRepair(
  imageUrl: string,
  customPrompt?: string,
  presetId?: string,
  options?: (FluxOptions & { useMask?: boolean; requireMask?: boolean })
): Promise<string> {
  console.log('[Replicate] === LAWN REPAIR ===');
  if (presetId) {
    console.log('[Replicate] Preset:', presetId);
  }
  const minMaskArea = Number(process.env.AI_LAWN_MASK_MIN_AREA || 4);
  const minMaskConfidence = Number(process.env.AI_LAWN_MASK_MIN_CONFIDENCE || 0.75);
  
  let prompt = LAWN_PROMPTS['default'];
  
  if (presetId) {
    if (presetId === 'natural-green') prompt = LAWN_PROMPTS['natural'];
    else if (presetId === 'lush-green') prompt = LAWN_PROMPTS['emerald'];
  } else if (customPrompt) {
    const lowerPrompt = customPrompt.toLowerCase();
    
    if (lowerPrompt.includes('emerald') || lowerPrompt.includes('golf') || lowerPrompt.includes('perfect') || lowerPrompt.includes('manicured')) {
      prompt = LAWN_PROMPTS['emerald'];
    } else if (lowerPrompt.includes('natural') || lowerPrompt.includes('realistic')) {
      prompt = LAWN_PROMPTS['natural'];
    } else {
      prompt = `${customPrompt}. Keep everything else exactly the same. Only improve the grass.`;
    }
  }

  const { useMask = true, requireMask = false, ...fluxOverrides } = options || {};
  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, fluxOverrides);
  const forceDeterministicMask = String(process.env.AI_LAWN_MASK_FORCE_DETERMINISTIC || '').toLowerCase() === 'true';

  if (useMask) {
    try {
      const maskResult = forceDeterministicMask
        ? await generateDeterministicLawnMask(imageUrl)
        : await new SAMMasksClient().generateMask({ imageUrl, maskType: 'lawn' });
      if (
        maskResult.success &&
        maskResult.maskUrl &&
        maskResult.area >= minMaskArea &&
        maskResult.confidence >= minMaskConfidence
      ) {
        const inpainted = await fluxFillInpaint(imageUrl, maskResult.maskUrl, prompt, {
          guidance: 7,
          steps: 32,
        });
        console.log('[Replicate] === LAWN REPAIR (MASKED) COMPLETE ===');
        return inpainted;
      }
      if (maskResult.success) {
        console.warn(
          `[Replicate] Lawn mask rejected (area ${maskResult.area.toFixed(1)}%, confidence ${maskResult.confidence.toFixed(2)})`
        );
      }
    } catch (error: any) {
      console.warn('[Replicate] Lawn mask failed:', error?.message);
    }
  }

  if (useMask && (requireMask || forceDeterministicMask)) {
    throw new Error('Mask required for lawn repair');
  }

  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
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

export async function declutter(
  imageUrl: string,
  customPrompt?: string,
  options?: FluxOptions
): Promise<string> {
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

  const fluxOptions = withFluxDefaults({ guidance: 3.0, steps: 28 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
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

export async function virtualStaging(
  imageUrl: string,
  customPrompt?: string,
  options?: FluxOptions
): Promise<string> {
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

  const fluxOptions = withFluxDefaults({ guidance: 3.5, steps: 32 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
  console.log('[Replicate] === VIRTUAL STAGING COMPLETE ===');
  return result;
}

// ============================================
// 6. FIRE IN FIREPLACE
// FIXED: More controlled prompt to not affect whole room
// ============================================

export async function fireFireplace(
  imageUrl: string,
  customPrompt?: string,
  options?: FluxOptions
): Promise<string> {
  console.log('[Replicate] === FIRE IN FIREPLACE ===');

  const prompt = customPrompt
    ? `${customPrompt}. STRICT: Only add fire inside the existing fireplace opening. Do NOT change any walls, mantle, hearth, furniture, room layout, or proportions. Do NOT expand or resize the fireplace.`
    : 'Add a small realistic fire ONLY inside the existing fireplace opening. Keep the fireplace size, mantle, hearth, walls, and room geometry exactly the same. Do NOT expand the opening, change structure, or alter any furniture. Subtle warm glow only from within the opening.';

  // Lower guidance to prevent affecting whole room
  const fluxOptions = withFluxDefaults({ guidance: 2.0, steps: 22 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
  console.log('[Replicate] === FIRE IN FIREPLACE COMPLETE ===');
  return result;
}

// ============================================
// 7. TV SCREEN REPLACE
// ============================================

export async function tvScreen(
  imageUrl: string,
  customPrompt?: string,
  options?: FluxOptions
): Promise<string> {
  console.log('[Replicate] === TV SCREEN REPLACE ===');

  const prompt = customPrompt
    ? `${customPrompt}. Only change the TV screen content. Keep the TV frame, stand, and rest of room exactly the same.`
    : 'Replace the TV screen with a beautiful nature landscape showing mountains and a lake. Only change what is displayed on the TV screen. Keep the TV frame, TV stand, and the rest of the room exactly the same.';

  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
  console.log('[Replicate] === TV SCREEN REPLACE COMPLETE ===');
  return result;
}

// ============================================
// 8. LIGHTS ON
// ============================================

export async function lightsOn(
  imageUrl: string,
  customPrompt?: string,
  options?: FluxOptions
): Promise<string> {
  console.log('[Replicate] === LIGHTS ON ===');

  const prompt = customPrompt
    ? `${customPrompt}. Keep everything else exactly the same.`
    : 'Turn on all the lights in this room. Make all light fixtures, lamps, ceiling lights, and recessed lights appear to be turned on with a warm inviting glow. Keep everything else in the room exactly the same.';

  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
  console.log('[Replicate] === LIGHTS ON COMPLETE ===');
  return result;
}

// ============================================
// 9. WINDOW MASKING
// ============================================

export async function windowMasking(
  imageUrl: string,
  customPrompt?: string,
  options?: FluxOptions
): Promise<string> {
  console.log('[Replicate] === WINDOW MASKING ===');

  const prompt = customPrompt
    ? `${customPrompt}. Keep the interior room exactly the same.`
    : 'Balance the window exposure. Replace any blown-out white windows with a clear view of blue sky and green landscaping outside. Keep the interior room, furniture, and everything else exactly the same.';

  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
  console.log('[Replicate] === WINDOW MASKING COMPLETE ===');
  return result;
}

// ============================================
// 10. COLOR BALANCE
// ============================================

export async function colorBalance(
  imageUrl: string,
  customPrompt?: string,
  options?: FluxOptions
): Promise<string> {
  console.log('[Replicate] === COLOR BALANCE ===');

  const prompt = customPrompt
    ? `${customPrompt}. Keep everything in the scene exactly the same. Only adjust colors.`
    : 'Apply warm color balance with cozy golden warmth. Keep everything in the scene exactly the same - same composition, same objects. Only adjust the color temperature and tones.';

  // Very low guidance for subtle color adjustment
  const fluxOptions = withFluxDefaults({ guidance: 2.0, steps: 20 }, options);
  const result = await runFluxKontext(imageUrl, prompt, fluxOptions);
  console.log('[Replicate] === COLOR BALANCE COMPLETE ===');
  return result;
}

// ============================================
// ONE-CLICK TOOLS (no presets)
// ============================================

export async function poolEnhance(imageUrl: string, options?: FluxOptions): Promise<string> {
  console.log('[Replicate] === POOL ENHANCEMENT ===');
  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(
    imageUrl,
    'Enhance the pool water to look crystal clear and premium. Rich turquoise-blue water with natural light reflections, no murkiness. Clean the pool surface. IMPORTANT: Do NOT darken the overall scene. Keep the pool shape, deck, landscaping, and everything else exactly the same.',
    fluxOptions
  );
  console.log('[Replicate] === POOL ENHANCEMENT COMPLETE ===');
  return result;
}

export async function hdr(imageUrl: string, options?: FluxOptions): Promise<string> {
  console.log('[Replicate] === HDR ENHANCEMENT ===');
  const fluxOptions = withFluxDefaults({ guidance: 2.0, steps: 22 }, options);
  const result = await runFluxKontext(
    imageUrl,
    'Apply professional HDR enhancement. Brighten dark shadows to reveal detail, balance highlights, make colors more vibrant. Keep everything in the scene exactly the same. Only improve lighting and exposure.',
    fluxOptions
  );
  console.log('[Replicate] === HDR ENHANCEMENT COMPLETE ===');
  return result;
}

export async function perspectiveCorrection(imageUrl: string, options?: FluxOptions): Promise<string> {
  console.log('[Replicate] === PERSPECTIVE CORRECTION ===');
  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(
    imageUrl,
    'Correct the perspective and vertical lines. Make all vertical lines perfectly straight and parallel. Fix any lens distortion or tilted angles. Keep everything else exactly the same.',
    fluxOptions
  );
  console.log('[Replicate] === PERSPECTIVE CORRECTION COMPLETE ===');
  return result;
}

export async function lensCorrection(imageUrl: string, options?: FluxOptions): Promise<string> {
  console.log('[Replicate] === LENS CORRECTION ===');
  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(
    imageUrl,
    'Correct lens distortion. Fix barrel and pincushion distortion. Straighten curved lines. Remove vignetting. Keep everything else exactly the same.',
    fluxOptions
  );
  console.log('[Replicate] === LENS CORRECTION COMPLETE ===');
  return result;
}

export async function autoEnhance(imageUrl: string, options?: FluxOptions): Promise<string> {
  console.log('[Replicate] === AUTO ENHANCE ===');
  return hdr(imageUrl, options);
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

export async function reflectionRemoval(imageUrl: string, options?: FluxOptions): Promise<string> {
  console.log('[Replicate] Reflection Removal');
  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(
    imageUrl,
    'Remove all reflections and glare from the windows. Make the glass clear so you can see through. Keep everything else exactly the same.',
    fluxOptions
  );
  return result;
}

export async function powerLineRemoval(imageUrl: string, options?: FluxOptions): Promise<string> {
  console.log('[Replicate] Power Line Removal');
  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(
    imageUrl,
    'Remove all power lines, telephone wires, and electrical cables from the sky. Keep the house and everything else exactly the same.',
    fluxOptions
  );
  return result;
}

export async function objectRemoval(
  imageUrl: string,
  prompt?: string,
  options?: FluxOptions
): Promise<string> {
  console.log('[Replicate] Object Removal');
  const fluxOptions = withFluxDefaults({ guidance: 2.5, steps: 25 }, options);
  const result = await runFluxKontext(
    imageUrl,
    prompt || 'Remove trash cans, cars, hoses, and clutter from this photo. Keep the house and main features exactly the same.',
    fluxOptions
  );
  return result;
}

export async function flashFix(imageUrl: string, options?: FluxOptions): Promise<string> {
  console.log('[Replicate] Flash Hotspot Fix');
  const fluxOptions = withFluxDefaults({ guidance: 2.0, steps: 22 }, options);
  const result = await runFluxKontext(
    imageUrl,
    'Fix flash hotspots and harsh bright spots. Create natural, even lighting throughout the photo. Remove any overexposed areas. Keep everything else exactly the same.',
    fluxOptions
  );
  return result;
}
