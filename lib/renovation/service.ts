import { logger } from '@/lib/logger';
// Virtual Renovation Service - Best-in-Class AI + Human Revision
// Multi-model pipeline for surgical precision

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

interface RenovationRequest {
  imageUrl: string;
  roomType: string;
  renovationType: string;
  style: string;
  options: {
    selectedRenovations?: string[];
    detailedOptions?: Record<string, Record<string, string>>;
    customPrompt?: string;
    maskMode?: 'auto' | 'manual';
  };
}

interface RenovationResult {
  success: boolean;
  resultUrl?: string;
  resultUrls?: string[];
  error?: string;
  model?: string;
  processingTime?: number;
  prompt?: string;
  segmentationData?: Record<string, unknown>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface PredictionResult {
  status: string;
  output?: unknown;
  error?: string;
}

async function pollPrediction(predictionUrl: string, maxAttempts: number = 120): Promise<PredictionResult> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(predictionUrl, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
          signal: AbortSignal.timeout(30000),
    });
    const result = await response.json();

    if (result.status === 'succeeded') {
      return result;
    }
    if (result.status === 'failed') {
      throw new Error(result.error || 'Prediction failed');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;

    if (attempts % 15 === 0) {
      logger.info(`Still processing... (${attempts * 2}s)`);
    }
  }

  throw new Error('Prediction timed out');
}

function extractOutputUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    const first = output[0];
    return typeof first === 'string' ? first : null;
  }
  return null;
}

// ============================================
// MODEL 2: GROUNDED SAM
// Find specific elements by text description
// ============================================

async function findElementByText(
  imageUrl: string,
  searchTerms: string[]
): Promise<string | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    logger.info('[GroundedSAM] Searching for:', searchTerms);

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'schananas/grounded_sam:ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a3ab9ebc21c',
        input: {
          image: imageUrl,
          detection_prompt: searchTerms.join('. '),
          segmentation_prompt: searchTerms.join('. '),
        },
      }),
          signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      logger.error('[GroundedSAM] API error');
      return null;
    }

    const prediction = await response.json();
    const result = await pollPrediction(prediction.urls.get, 90);

    if (result.output) {
      const outputs = Array.isArray(result.output) ? result.output : [result.output];
      const maskUrl = outputs.find((url): url is string => typeof url === 'string');
      logger.info('[GroundedSAM] Found mask');
      return maskUrl || null;
    }

    return null;
  } catch (error: unknown) {
    logger.error('[GroundedSAM] Error:', error);
    return null;
  }
}

// ============================================
// MODEL 3: DEPTH ESTIMATION
// Understand 3D structure
// ============================================

async function getDepthMap(imageUrl: string): Promise<string | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    logger.info('[Depth] Generating depth map...');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'cjwbw/midas:a2cc01df-a3af-478b-af8d-8527a0b7c5ad',
        input: {
          image: imageUrl,
          model_type: 'dpt_beit_large_512',
        },
      }),
          signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;

    const prediction = await response.json();
    const result = await pollPrediction(prediction.urls.get, 60);

    if (result.output) {
      logger.info('[Depth] Depth map generated');
      return extractOutputUrl(result.output);
    }

    return null;
  } catch (error: unknown) {
    logger.error('[Depth] Error:', error);
    return null;
  }
}

// ============================================
// MODEL 4: SDXL INPAINTING
// Change only masked areas
// ============================================

async function inpaintArea(
  imageUrl: string,
  maskUrl: string,
  prompt: string
): Promise<string | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    logger.info('[Inpaint] Inpainting with prompt:', prompt.substring(0, 50) + '...');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: `${prompt}, photorealistic, professional photography, high quality, detailed`,
          negative_prompt: 'blurry, distorted, cartoon, drawing, painting, low quality, watermark, ugly',
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
          signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;

    const prediction = await response.json();
    const result = await pollPrediction(prediction.urls.get, 90);

    if (result.output) {
      logger.info('[Inpaint] Inpainting complete');
      return extractOutputUrl(result.output);
    }

    return null;
  } catch (error: unknown) {
    logger.error('[Inpaint] Error:', error);
    return null;
  }
}

// ============================================
// MODEL 5: CONTROLNET DEPTH
// Preserve structure while changing appearance
// ============================================

async function controlNetDepth(
  imageUrl: string,
  depthMapUrl: string,
  prompt: string
): Promise<string | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    logger.info('[ControlNet-Depth] Processing...');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'jagilley/controlnet-depth:922c7bb67b87ec32cbc2fd11b1d5f94f0ba4f5519c4dbd02856376444127cc60',
        input: {
          image: depthMapUrl,
          prompt: `${prompt}, professional real estate photography, high quality, photorealistic`,
          negative_prompt: 'blurry, distorted, low quality, cartoon, drawing',
          num_inference_steps: 30,
          guidance_scale: 9,
        },
      }),
          signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;

    const prediction = await response.json();
    const result = await pollPrediction(prediction.urls.get, 90);

    if (result.output) {
      logger.info('[ControlNet-Depth] Complete');
      return extractOutputUrl(result.output);
    }

    return null;
  } catch (error: unknown) {
    logger.error('[ControlNet-Depth] Error:', error);
    return null;
  }
}

// ============================================
// MODEL 6: INSTRUCT-PIX2PIX
// Best for instruction-based editing
// ============================================

async function instructPix2Pix(
  imageUrl: string,
  instruction: string
): Promise<string | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    logger.info('[InstructPix2Pix] Instruction:', instruction.substring(0, 50) + '...');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f',
        input: {
          image: imageUrl,
          prompt: instruction,
          num_inference_steps: 50,
          image_guidance_scale: 1.8,
          guidance_scale: 7.5,
          scheduler: 'K_EULER_ANCESTRAL',
        },
      }),
          signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;

    const prediction = await response.json();
    const result = await pollPrediction(prediction.urls.get, 90);

    if (result.output) {
      logger.info('[InstructPix2Pix] Complete');
      return extractOutputUrl(result.output);
    }

    return null;
  } catch (error: unknown) {
    logger.error('[InstructPix2Pix] Error:', error);
    return null;
  }
}

// ============================================
// MODEL 7: FLUX for High Quality
// ============================================

async function fluxInpaint(
  imageUrl: string,
  maskUrl: string,
  prompt: string
): Promise<string | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    logger.info('[Flux] High quality inpainting...');

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-fill-pro',
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: prompt,
          steps: 50,
          guidance: 30,
          output_format: 'png',
        },
      }),
          signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;

    const prediction = await response.json();
    const result = await pollPrediction(prediction.urls.get, 120);

    if (result.output) {
      logger.info('[Flux] Complete');
      return extractOutputUrl(result.output);
    }

    return null;
  } catch (error: unknown) {
    logger.error('[Flux] Error:', error);
    return null;
  }
}

// ============================================
// ELEMENT MAPPING
// Map renovation types to search terms
// ============================================

const ELEMENT_SEARCH_TERMS: Record<string, string[]> = {
  flooring: ['floor', 'flooring', 'ground surface', 'carpet', 'hardwood floor', 'tile floor'],
  paint: ['wall', 'walls', 'interior wall', 'painted wall'],
  cabinets: ['cabinet', 'cabinets', 'kitchen cabinet', 'cupboard', 'kitchen cupboard'],
  counters: ['countertop', 'counter', 'kitchen counter', 'countertops'],
  backsplash: ['backsplash', 'kitchen backsplash', 'tile backsplash'],
  vanity: ['vanity', 'bathroom vanity', 'sink cabinet', 'bathroom cabinet'],
  shower: ['shower', 'bathtub', 'tub', 'shower enclosure'],
  fireplace: ['fireplace', 'mantle', 'hearth', 'fireplace surround'],
  siding: ['siding', 'house siding', 'exterior wall', 'exterior siding'],
  roof: ['roof', 'rooftop', 'shingles', 'roofing'],
  landscaping: ['lawn', 'grass', 'landscaping', 'yard', 'garden'],
};

// ============================================
// BUILD DETAILED PROMPT
// ============================================

function buildDetailedPrompt(
  renovationType: string,
  options: Record<string, string>,
  style: string
): string {
  const prompts: Record<string, (opts: Record<string, string>, s: string) => string> = {
    flooring: (opts, s) => `${opts.color || 'light oak'} ${opts.type || 'hardwood'} flooring, ${s} style`,
    paint: (opts, s) => `${opts.color || 'white'} painted walls, ${s} interior design`,
    cabinets: (opts, s) => `${opts.color || 'white'} ${opts.style || 'shaker'} style kitchen cabinets, ${s} design`,
    counters: (opts, s) => `${opts.color || 'white'} ${opts.material || 'quartz'} countertops, ${s} kitchen`,
    backsplash: (opts, s) => `${opts.color || 'white'} ${opts.type || 'subway tile'} backsplash, ${s} kitchen`,
    vanity: (opts, s) => `${opts.color || 'white'} ${opts.style || 'modern'} bathroom vanity, ${s} design`,
    shower: (opts, s) => `${opts.type || 'glass enclosed'} shower with ${opts.tile || 'marble'} tile, ${s} bathroom`,
    fireplace: (_opts, s) => `${s} style fireplace with stone surround`,
    siding: (opts, s) => `${opts.color || 'gray'} ${opts.type || 'fiber cement'} house siding, ${s} exterior`,
    roof: (opts, s) => `${opts.color || 'charcoal'} ${opts.type || 'asphalt shingle'} roof, ${s} home`,
    landscaping: (_opts, s) => `beautiful ${s} landscaping with manicured lawn and plants`,
  };

  const promptFn = prompts[renovationType];
  return promptFn ? promptFn(options, style) : `${style} style ${renovationType}`;
}

// ============================================
// MAIN PROCESSING PIPELINE
// ============================================

export async function processRenovation(request: RenovationRequest): Promise<RenovationResult> {
  const startTime = Date.now();
  const selectedRenovations = request.options?.selectedRenovations || [request.renovationType];
  const detailedOptions = request.options?.detailedOptions || {};

  logger.info('============================================');
  logger.info('VIRTUAL RENOVATION - MULTI-MODEL PIPELINE');
  logger.info('============================================');
  logger.info('Room type:', request.roomType);
  logger.info('Style:', request.style);
  logger.info('Selected renovations:', selectedRenovations);

  let resultUrl: string | null = null;
  let currentImage = request.imageUrl;
  let modelUsed = 'pipeline';

  // APPROACH 1: Sequential element-by-element processing
  logger.info('\n--- APPROACH 1: Element-by-Element Inpainting ---');

  for (const renoType of selectedRenovations) {
    const searchTerms = ELEMENT_SEARCH_TERMS[renoType];
    if (!searchTerms) {
      logger.info(`[Skip] No search terms for: ${renoType}`);
      continue;
    }

    logger.info(`\n[Processing] ${renoType}...`);

    const maskUrl = await findElementByText(currentImage, searchTerms);

    if (maskUrl) {
      const elementPrompt = buildDetailedPrompt(
        renoType,
        detailedOptions[renoType] || {},
        request.style
      );

      let newImage = await fluxInpaint(currentImage, maskUrl, elementPrompt);

      if (!newImage) {
        newImage = await inpaintArea(currentImage, maskUrl, elementPrompt);
      }

      if (newImage) {
        currentImage = newImage;
        logger.info(`[Success] ${renoType} updated`);
      } else {
        logger.info(`[Failed] Could not update ${renoType}`);
      }
    } else {
      logger.info(`[Skip] Could not find ${renoType} in image`);
    }
  }

  if (currentImage !== request.imageUrl) {
    resultUrl = currentImage;
    modelUsed = 'element-by-element-inpainting';
  }

  // APPROACH 2: If element-by-element failed, try Instruct-Pix2Pix
  if (!resultUrl) {
    logger.info('\n--- APPROACH 2: Instruct-Pix2Pix ---');

    let instruction = `Transform this ${request.roomType}: `;
    selectedRenovations.forEach(renoType => {
      const opts = detailedOptions[renoType] || {};
      instruction += buildDetailedPrompt(renoType, opts, request.style) + '. ';
    });
    instruction += 'Keep the same room layout, furniture, and structure.';

    resultUrl = await instructPix2Pix(request.imageUrl, instruction);
    if (resultUrl) {
      modelUsed = 'instruct-pix2pix';
    }
  }

  // APPROACH 3: If still no result, try ControlNet with depth
  if (!resultUrl) {
    logger.info('\n--- APPROACH 3: ControlNet Depth ---');

    const depthMap = await getDepthMap(request.imageUrl);
    if (depthMap) {
      const prompt = request.options?.customPrompt ||
        `${request.style} style ${request.roomType} with updated finishes`;
      resultUrl = await controlNetDepth(request.imageUrl, depthMap, prompt);
      if (resultUrl) {
        modelUsed = 'controlnet-depth';
      }
    }
  }

  const processingTime = Date.now() - startTime;

  logger.info('\n============================================');
  logger.info('RESULT:', resultUrl ? 'SUCCESS' : 'FAILED');
  logger.info('Model:', modelUsed);
  logger.info('Time:', processingTime, 'ms');
  logger.info('============================================');

  if (resultUrl) {
    return {
      success: true,
      resultUrl,
      model: modelUsed,
      processingTime,
      prompt: request.options?.customPrompt,
    };
  }

  return {
    success: false,
    error: 'All AI methods failed. You can request a FREE human revision.',
    processingTime,
    prompt: request.options?.customPrompt,
  };
}

// ============================================
// CREDITS & PRICING
// ============================================

export function calculateCredits(renovationType: string): number {
  if (renovationType.includes('+')) {
    const types = renovationType.split('+');
    return types.reduce((sum, type) => sum + getSingleTypeCredits(type), 0);
  }
  return getSingleTypeCredits(renovationType);
}

function getSingleTypeCredits(type: string): number {
  const creditMap: Record<string, number> = {
    'cabinets': 3,
    'counters': 3,
    'backsplash': 2,
    'flooring': 3,
    'paint': 2,
    'appliances': 2,
    'vanity': 3,
    'shower': 3,
    'fixtures': 2,
    'fireplace': 3,
    'lighting': 2,
    'siding': 3,
    'roof': 3,
    'landscaping': 3,
  };
  return creditMap[type] || 3;
}

export function estimateCost(renovationType: string): number {
  const credits = calculateCredits(renovationType);
  return credits * 0.15;
}
