// ============================================================================
// SNAPR VIRTUAL RENOVATION API - THE DEFINITIVE EDITION
// ============================================================================
//
// "Build it like Da Vinci, Socrates. Build it like Elon, like Steve Jobs."
//
// This is the API that makes SnapR the undisputed leader in real estate
// virtual renovation. While competitors take 24-48 hours and charge $24-$176,
// we deliver in 30 seconds for $2-5.
//
// MODELS:
// 1. adirik/interior-design - Primary for interiors (ControlNet-based)
// 2. FLUX Depth Pro - For exteriors (structure-preserving)
// 3. FLUX Kontext Pro - For targeted single-element changes
// 4. FLUX Fill Pro - For inpainting with masks
// 5. Ideogram v3 - For premium quality renders
//
// COST STRUCTURE:
// - Interior Design: $0.007/image → Charge $2-3 → 285x ROI
// - FLUX Depth Pro: $0.05/image → Charge $5 → 100x ROI
// - FLUX Kontext Pro: $0.04/image → Charge $2 → 50x ROI
//
// COMPETITORS:
// - BoxBrownie: $24/image, 24-48 hours
// - Styldod: $16-23/image, 24 hours
// - SnapR: $2-5/image, 30 SECONDS
//
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// ============================================================================
// TYPES
// ============================================================================

interface RenovationRequest {
  imageUrl: string;
  roomType: 'interior' | 'exterior' | 'kitchen' | 'bathroom' | 'bedroom' | 'living' | 'dining' | 'office';
  style: string;
  selectedRenovations: string[];
  detailedOptions: Record<string, Record<string, string>>;
  model?: 'auto' | 'interior-design' | 'flux-depth' | 'flux-kontext' | 'flux-fill' | 'ideogram';
  promptStrength?: number;
  quality?: 'fast' | 'balanced' | 'quality';
}

// Steps are returned as strings for frontend compatibility
// Format: "Completed: Step name" or "Processing: Step name" or "Failed: Error message"

// ============================================================================
// DESIGN STYLES - Engineered prompts for maximum quality
// ============================================================================

const DESIGN_STYLES: Record<string, { prompt: string; negative: string }> = {
  'Modern': {
    prompt: 'modern contemporary design, clean lines, minimalist furniture, neutral color palette, sleek finishes, open floor plan, natural light, premium materials, architectural details',
    negative: 'cluttered, ornate, dated, busy patterns, dark, cramped',
  },
  'Contemporary': {
    prompt: 'contemporary style, current design trends, mixed textures, statement furniture pieces, sophisticated neutral palette, artistic accents, layered lighting, curated decor',
    negative: 'outdated, traditional, heavy furniture, dark wood, excessive ornamentation',
  },
  'Traditional': {
    prompt: 'traditional classic design, ornate elegant details, rich warm wood tones, elegant crown molding, symmetrical layout, formal furnishings, refined fabrics, timeless beauty',
    negative: 'ultra-modern, industrial, minimalist, stark, cold',
  },
  'Farmhouse': {
    prompt: 'rustic farmhouse style, shiplap accent walls, barn doors, natural reclaimed wood, vintage accents, cozy comfortable atmosphere, neutral earth tones, exposed beams',
    negative: 'ultra-modern, stark minimalist, industrial metal, high-gloss finishes',
  },
  'Minimalist': {
    prompt: 'minimalist design, essential furniture only, clean uncluttered surfaces, monochromatic palette, hidden storage, architectural simplicity, breathing room, zen aesthetic',
    negative: 'cluttered, ornate, busy patterns, heavy furniture, excessive decor',
  },
  'Luxury': {
    prompt: 'luxury high-end design, premium designer materials, marble surfaces, gold brass accents, crystal chandeliers, velvet upholstery, custom millwork, statement artwork',
    negative: 'cheap materials, plastic, basic, cluttered, dated',
  },
  'Coastal': {
    prompt: 'coastal beach house design, soft blue palette, sandy neutral tones, airy atmosphere, natural textures, sea glass accents, white shiplap, nautical elements, ocean views',
    negative: 'dark colors, heavy furniture, ornate patterns, landlocked aesthetic',
  },
  'Industrial': {
    prompt: 'industrial loft design, exposed brick walls, metal accents, concrete floors, open ductwork, factory windows, Edison bulb lighting, raw materials, urban edge',
    negative: 'traditional, ornate, delicate, soft, suburban',
  },
  'Scandinavian': {
    prompt: 'Scandinavian Nordic design, light natural wood, white palette, cozy hygge atmosphere, functional furniture, wool textiles, greenery, simple elegant lines',
    negative: 'dark heavy furniture, ornate details, cluttered, busy patterns',
  },
  'Mid-Century Modern': {
    prompt: 'mid-century modern design, retro 1950s 1960s aesthetic, organic curves, tapered legs, bold accent colors, walnut wood, iconic designer furniture, vintage charm',
    negative: 'contemporary, ornate traditional, rustic, industrial',
  },
  'Bohemian': {
    prompt: 'bohemian eclectic design, layered textiles, global patterns, macrame, rattan furniture, plants everywhere, collected treasures, warm rich colors, artistic spirit',
    negative: 'minimalist, stark, monochromatic, formal, rigid',
  },
  'Art Deco': {
    prompt: 'art deco glamour design, geometric bold patterns, gold chrome accents, rich jewel tones, mirrored surfaces, statement lighting, sophisticated elegance, gatsby era',
    negative: 'rustic, farmhouse, casual, minimalist, natural materials',
  },
  'Transitional': {
    prompt: 'transitional design, perfect blend of traditional and contemporary, neutral sophisticated palette, comfortable elegance, timeless quality, refined details, balanced proportions',
    negative: 'extreme modern, rustic, busy patterns, dated styles',
  },
  'Mediterranean': {
    prompt: 'Mediterranean villa design, terracotta tiles, wrought iron accents, arched doorways, warm earth tones, textured stucco walls, Old World charm, outdoor living',
    negative: 'cold colors, ultra-modern, industrial, stark minimalist',
  },
  'Japanese': {
    prompt: 'Japanese zen design, minimal furnishings, natural materials, shoji screens, tatami elements, wabi-sabi aesthetic, bamboo accents, peaceful tranquil atmosphere, harmony with nature',
    negative: 'cluttered, ornate, heavy furniture, excessive decor, bright colors',
  },
};

// ============================================================================
// ROOM CONTEXTS - Specific prompts by room type
// ============================================================================

const ROOM_CONTEXTS: Record<string, string> = {
  'interior': 'beautifully designed interior space',
  'kitchen': 'stunning chef kitchen with professional appliances, generous counter space, and optimal workflow',
  'bathroom': 'luxurious spa-like bathroom with premium fixtures, excellent lighting, and elegant finishes',
  'bedroom': 'serene restful master bedroom with comfortable atmosphere and thoughtful design',
  'living': 'inviting living room perfect for entertaining and relaxation with comfortable seating arrangement',
  'dining': 'elegant dining space perfect for gatherings with ambient lighting and sophisticated style',
  'office': 'productive professional home office with ergonomic design and inspiring atmosphere',
  'exterior': 'stunning curb appeal with beautiful architectural details, professional landscaping, and welcoming entrance',
};

// ============================================================================
// RENOVATION ELEMENT BUILDERS - Detailed descriptions for each element
// ============================================================================

const RENOVATION_ELEMENTS: Record<string, (opts: Record<string, string>) => string> = {
  // Interior Elements
  paint: (opts) => `freshly painted walls in ${opts.color || 'elegant neutral tone'} with ${opts.finish || 'satin'} finish`,
  flooring: (opts) => `beautiful ${opts.material || 'hardwood'} flooring in ${opts.color || 'warm natural'} tone`,
  cabinets: (opts) => `${opts.style || 'shaker style'} cabinets in ${opts.color || 'crisp white'} with ${opts.hardware || 'brushed nickel'} hardware`,
  counters: (opts) => `premium ${opts.material || 'quartz'} countertops in ${opts.color || 'calacatta white with subtle veining'}`,
  backsplash: (opts) => `${opts.style || 'subway tile'} backsplash in ${opts.color || 'classic white'} with ${opts.grout || 'contrasting'} grout`,
  vanity: (opts) => `${opts.style || 'floating modern'} vanity in ${opts.color || 'white'} with ${opts.top || 'marble'} countertop`,
  shower: (opts) => `${opts.style || 'frameless glass'} shower with ${opts.tile || 'large format porcelain'} tiles and ${opts.fixtures || 'rainfall'} showerhead`,
  fireplace: (opts) => `${opts.style || 'contemporary linear'} fireplace with ${opts.surround || 'floor-to-ceiling stone'} surround`,
  lighting: (opts) => `${opts.style || 'statement'} lighting fixtures in ${opts.finish || 'matte black'} finish`,
  furniture: (opts) => `${opts.style || 'designer'} furniture in ${opts.color || 'neutral'} tones with ${opts.fabric || 'premium'} upholstery`,
  appliances: (opts) => `professional-grade ${opts.finish || 'stainless steel'} appliances`,
  fixtures: (opts) => `${opts.style || 'modern'} ${opts.finish || 'brushed nickel'} fixtures`,
  
  // Exterior Elements
  siding: (opts) => `beautiful ${opts.color || 'classic white'} ${opts.type || 'horizontal lap'} exterior siding`,
  roof: (opts) => `${opts.color || 'architectural charcoal'} ${opts.type || 'dimensional shingle'} roofing`,
  landscaping: (opts) => `professional landscaping with ${opts.lawn || 'lush green manicured lawn'}, ${opts.plants || 'mature ornamental plants'}, and ${opts.features || 'decorative stone borders'}`,
  driveway: (opts) => `${opts.material || 'stamped concrete'} driveway in ${opts.color || 'natural gray'} tones`,
  windows: (opts) => `${opts.style || 'large picture'} windows with ${opts.frame || 'black aluminum'} frames`,
  door: (opts) => `${opts.style || 'craftsman'} front door in ${opts.color || 'navy blue'} with ${opts.hardware || 'brushed brass'} hardware`,
  garage: (opts) => `${opts.style || 'carriage house'} garage door in ${opts.color || 'matching'} finish`,
  fence: (opts) => `${opts.style || 'horizontal slat'} fence in ${opts.material || 'cedar'} with ${opts.color || 'natural'} stain`,
  deck: (opts) => `${opts.material || 'composite'} deck in ${opts.color || 'warm gray'} with ${opts.railing || 'cable'} railings`,
  pool: (opts) => `${opts.style || 'modern geometric'} pool with ${opts.finish || 'pebble tech blue'} finish and ${opts.features || 'spa and water features'}`,
};

// ============================================================================
// REPLICATE API POLLING
// ============================================================================

async function pollPrediction(predictionUrl: string, maxAttempts: number = 180): Promise<any> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(predictionUrl, {
      headers: { 
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Poll failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log(`[Poll ${attempts}] Status: ${result.status}`);
    
    if (result.status === 'succeeded') {
      return result;
    }
    
    if (result.status === 'failed') {
      console.error('[Poll] Failed:', result.error);
      throw new Error(result.error || 'Prediction failed');
    }
    
    if (result.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
  
  throw new Error('Prediction timed out after 6 minutes');
}

function extractOutputUrl(result: any): string {
  if (typeof result.output === 'string') {
    return result.output;
  }
  if (Array.isArray(result.output) && result.output.length > 0) {
    return result.output[0];
  }
  throw new Error('No output URL in result');
}

// ============================================================================
// MODEL 1: adirik/interior-design
// Primary model for interior renovations
// Uses ControlNets (segmentation + MLSD) to preserve room structure
// Cost: ~$0.007/image | Speed: ~8 seconds
// ============================================================================

async function processWithInteriorDesign(
  imageUrl: string,
  prompt: string,
  negativePrompt: string,
  promptStrength: number = 0.8
): Promise<string> {
  console.log('[Interior Design] Starting - room structure will be preserved via ControlNets');
  console.log('[Interior Design] Prompt:', prompt.slice(0, 200));
  
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6cac7e',
      input: {
        image: imageUrl,
        prompt: prompt,
        negative_prompt: negativePrompt || 'lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, ugly',
        num_inference_steps: 50,
        guidance_scale: 15,
        prompt_strength: promptStrength,
        num_outputs: 1,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Interior Design API error: ${error}`);
  }

  const prediction = await response.json();
  console.log('[Interior Design] Prediction started:', prediction.id);
  
  const result = await pollPrediction(prediction.urls.get);
  return extractOutputUrl(result);
}

// ============================================================================
// MODEL 2: FLUX Depth Pro
// For exterior renovations - preserves exact 3D structure via depth maps
// Cost: ~$0.05/image | Speed: ~10 seconds
// ============================================================================

async function processWithFluxDepth(
  imageUrl: string,
  prompt: string
): Promise<string> {
  console.log('[FLUX Depth Pro] Starting - structure-preserving transformation via depth map');
  console.log('[FLUX Depth Pro] Prompt:', prompt.slice(0, 200));
  
  const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-depth-pro/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        image: imageUrl,
        prompt: prompt,
        guidance: 30,
        steps: 50,
        output_format: 'png',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FLUX Depth Pro API error: ${error}`);
  }

  const prediction = await response.json();
  console.log('[FLUX Depth Pro] Prediction started:', prediction.id);
  
  const result = await pollPrediction(prediction.urls.get);
  return extractOutputUrl(result);
}

// ============================================================================
// MODEL 3: FLUX Kontext Pro
// For targeted single-element changes
// Cost: ~$0.04/image | Speed: ~6 seconds
// ============================================================================

async function processWithFluxKontext(
  imageUrl: string,
  editInstruction: string
): Promise<string> {
  console.log('[FLUX Kontext Pro] Starting - targeted text-guided edit');
  console.log('[FLUX Kontext Pro] Instruction:', editInstruction.slice(0, 200));
  
  const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        image: imageUrl,
        prompt: editInstruction,
        aspect_ratio: 'match_input_image',
        guidance: 3.5,
        steps: 28,
        safety_tolerance: 5,
        output_format: 'png',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FLUX Kontext Pro API error: ${error}`);
  }

  const prediction = await response.json();
  console.log('[FLUX Kontext Pro] Prediction started:', prediction.id);
  
  const result = await pollPrediction(prediction.urls.get);
  return extractOutputUrl(result);
}

// ============================================================================
// MODEL 4: FLUX Fill Pro
// For inpainting with masks
// Cost: ~$0.05/image | Speed: ~8 seconds
// ============================================================================

async function processWithFluxFill(
  imageUrl: string,
  maskUrl: string,
  prompt: string
): Promise<string> {
  console.log('[FLUX Fill Pro] Starting - inpainting with mask');
  console.log('[FLUX Fill Pro] Prompt:', prompt.slice(0, 200));
  
  const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-fill-pro/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        image: imageUrl,
        mask: maskUrl,
        prompt: prompt,
        steps: 50,
        guidance: 60,
        output_format: 'png',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FLUX Fill Pro API error: ${error}`);
  }

  const prediction = await response.json();
  console.log('[FLUX Fill Pro] Prediction started:', prediction.id);
  
  const result = await pollPrediction(prediction.urls.get);
  return extractOutputUrl(result);
}

// ============================================================================
// MODEL 5: Ideogram v3 Balanced
// For premium quality renders
// Cost: ~$0.08/image | Speed: ~12 seconds
// ============================================================================

async function processWithIdeogram(
  imageUrl: string,
  prompt: string
): Promise<string> {
  console.log('[Ideogram v3] Starting - premium quality render');
  console.log('[Ideogram v3] Prompt:', prompt.slice(0, 200));
  
  const response = await fetch('https://api.replicate.com/v1/models/ideogram-ai/ideogram-v3-balanced/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        image: imageUrl,
        prompt: prompt,
        magic_prompt_option: 'AUTO',
        style_type: 'REALISTIC',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ideogram v3 API error: ${error}`);
  }

  const prediction = await response.json();
  console.log('[Ideogram v3] Prediction started:', prediction.id);
  
  const result = await pollPrediction(prediction.urls.get);
  return extractOutputUrl(result);
}

// ============================================================================
// INTELLIGENT MODEL SELECTION
// Picks the best model based on renovation type
// ============================================================================

type ModelChoice = 'interior-design' | 'flux-depth' | 'flux-kontext' | 'flux-fill' | 'ideogram';

function selectOptimalModel(
  roomType: string,
  selectedRenovations: string[],
  forceModel?: string,
  quality?: string
): ModelChoice {
  // Allow forcing a specific model
  if (forceModel && forceModel !== 'auto') {
    return forceModel as ModelChoice;
  }
  
  // Premium quality → Ideogram
  if (quality === 'quality') {
    return 'ideogram';
  }
  
  // Exterior renovations → FLUX Depth Pro (preserves house structure)
  const exteriorElements = ['siding', 'roof', 'landscaping', 'driveway', 'windows', 'door', 'garage', 'fence', 'deck', 'pool'];
  if (roomType === 'exterior' || selectedRenovations.some(r => exteriorElements.includes(r))) {
    return 'flux-depth';
  }
  
  // Single simple element → FLUX Kontext (faster, cheaper)
  if (selectedRenovations.length === 1 && ['paint', 'lighting'].includes(selectedRenovations[0])) {
    return 'flux-kontext';
  }
  
  // Fast mode → FLUX Kontext
  if (quality === 'fast') {
    return 'flux-kontext';
  }
  
  // Default: Interior Design (best for multi-element interior renovations)
  return 'interior-design';
}

// ============================================================================
// PROMPT BUILDER
// Constructs optimal prompts for each model
// ============================================================================

function buildPrompt(
  roomType: string,
  style: string,
  selectedRenovations: string[],
  detailedOptions: Record<string, Record<string, string>>
): { prompt: string; negative: string } {
  const styleInfo = DESIGN_STYLES[style] || DESIGN_STYLES['Modern'];
  const roomContext = ROOM_CONTEXTS[roomType] || ROOM_CONTEXTS['interior'];
  
  // Build renovation descriptions
  const renovationDescriptions = selectedRenovations
    .map(reno => {
      const builder = RENOVATION_ELEMENTS[reno];
      if (builder) {
        const options = detailedOptions[reno] || {};
        return builder(options);
      }
      return null;
    })
    .filter(Boolean)
    .join(', ');
  
  // Construct the full prompt
  let prompt = `Professional real estate photography of a ${roomContext}, ${styleInfo.prompt}`;
  
  if (renovationDescriptions) {
    prompt += `, featuring ${renovationDescriptions}`;
  }
  
  // Add quality modifiers
  prompt += `, magazine quality, high-end professional photography, natural lighting, 8k resolution, photorealistic, architectural digest worthy`;
  
  return {
    prompt,
    negative: `${styleInfo.negative}, lowres, watermark, banner, logo, text, deformed, blurry, blur, out of focus, surreal, ugly, distorted, amateur, low quality, grainy, overexposed, underexposed`,
  };
}

// ============================================================================
// CREDITS & PRICING
// ============================================================================

function calculateCredits(selectedRenovations: string[]): number {
  const creditMap: Record<string, number> = {
    // Interior (lower cost)
    paint: 2,
    flooring: 3,
    cabinets: 4,
    counters: 3,
    backsplash: 2,
    vanity: 3,
    shower: 4,
    fireplace: 3,
    lighting: 2,
    furniture: 3,
    appliances: 2,
    fixtures: 2,
    // Exterior (higher cost - uses FLUX Depth)
    siding: 5,
    roof: 5,
    landscaping: 4,
    driveway: 3,
    windows: 3,
    door: 2,
    garage: 3,
    fence: 3,
    deck: 4,
    pool: 5,
  };
  
  return selectedRenovations.reduce((sum, reno) => sum + (creditMap[reno] || 3), 0);
}

function estimateCost(model: ModelChoice): number {
  const costMap: Record<ModelChoice, number> = {
    'interior-design': 0.007,
    'flux-depth': 0.05,
    'flux-kontext': 0.04,
    'flux-fill': 0.05,
    'ideogram': 0.08,
  };
  return costMap[model];
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const steps: string[] = [];
  
  const addStep = (name: string, status: 'completed' | 'processing' | 'failed' = 'completed') => {
    const prefix = status === 'completed' ? 'Completed' : status === 'processing' ? 'Processing' : 'Failed';
    steps.push(`${prefix}: ${name}`);
    console.log(`[Step] ${prefix}: ${name} (${Date.now() - startTime}ms)`);
  };
  
  try {
    // Parse request
    addStep('Parsing request');
    const body: RenovationRequest = await request.json();
    
    const {
      imageUrl,
      roomType = 'interior',
      style = 'Modern',
      selectedRenovations = [],
      detailedOptions = {},
      model: requestedModel,
      promptStrength = 0.8,
      quality = 'balanced',
    } = body;
    
    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image URL is required' 
      }, { status: 400 });
    }
    
    if (selectedRenovations.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'At least one renovation type must be selected' 
      }, { status: 400 });
    }
    
    // Select optimal model
    addStep('Selecting optimal AI model');
    const selectedModel = selectOptimalModel(roomType, selectedRenovations, requestedModel, quality);
    console.log(`[Model Selection] Using: ${selectedModel}`);
    
    // Build prompt
    addStep('Building optimized prompt');
    const { prompt, negative: negativePrompt } = buildPrompt(
      roomType,
      style,
      selectedRenovations,
      detailedOptions
    );
    console.log(`[Prompt] ${prompt.slice(0, 300)}...`);
    
    // Process with selected model
    addStep(`Processing with ${selectedModel}`, 'processing');
    let resultUrl: string;
    let modelUsed: string;
    
    try {
      switch (selectedModel) {
        case 'interior-design':
          resultUrl = await processWithInteriorDesign(imageUrl, prompt, negativePrompt, promptStrength);
          modelUsed = 'Interior Design AI (adirik/interior-design)';
          break;
          
        case 'flux-depth':
          resultUrl = await processWithFluxDepth(imageUrl, prompt);
          modelUsed = 'FLUX Depth Pro (structure-preserving)';
          break;
          
        case 'flux-kontext':
          // For Kontext, use instruction-style prompt
          const instruction = `Transform this ${roomType} to ${style} style with ${selectedRenovations.join(', ')}. Maintain the exact room structure and layout.`;
          resultUrl = await processWithFluxKontext(imageUrl, instruction);
          modelUsed = 'FLUX Kontext Pro (targeted edit)';
          break;
          
        case 'ideogram':
          resultUrl = await processWithIdeogram(imageUrl, prompt);
          modelUsed = 'Ideogram v3 (premium quality)';
          break;
          
        default:
          resultUrl = await processWithInteriorDesign(imageUrl, prompt, negativePrompt, promptStrength);
          modelUsed = 'Interior Design AI (default)';
      }
      
      addStep(modelUsed);
      
    } catch (modelError) {
      console.error(`[${selectedModel}] Failed:`, modelError);
      addStep(`${selectedModel} failed, trying fallback`, 'processing');
      
      // Fallback: Try interior-design if another model failed
      if (selectedModel !== 'interior-design') {
        console.log('[Fallback] Trying Interior Design model...');
        resultUrl = await processWithInteriorDesign(imageUrl, prompt, negativePrompt, promptStrength);
        modelUsed = 'Interior Design AI (fallback)';
        addStep('Fallback succeeded');
      } else {
        throw modelError;
      }
    }
    
    // Calculate metrics
    const processingTime = Date.now() - startTime;
    const credits = calculateCredits(selectedRenovations);
    const estimatedApiCost = estimateCost(selectedModel);
    
    // Log success
    console.log('============================================');
    console.log('RENOVATION COMPLETE');
    console.log('Model:', modelUsed);
    console.log('Time:', Math.round(processingTime / 1000), 'seconds');
    console.log('Credits:', credits);
    console.log('API Cost:', `$${estimatedApiCost.toFixed(4)}`);
    console.log('============================================');
    
    return NextResponse.json({
      success: true,
      resultUrl,
      model: modelUsed,
      steps,
      processingTime,
      credits,
      estimatedApiCost,
      prompt: prompt.slice(0, 500),
    });
    
  } catch (error) {
    console.error('Renovation API error:', error);
    addStep(error instanceof Error ? error.message : 'Unknown error', 'failed');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Renovation failed',
      steps,
      processingTime: Date.now() - startTime,
    }, { status: 500 });
  }
}

// ============================================================================
// API DOCUMENTATION ENDPOINT
// ============================================================================

export async function GET() {
  return NextResponse.json({
    name: 'SnapR Virtual Renovation API - The Definitive Edition',
    version: '4.0.0',
    tagline: 'Transform any room in 30 seconds. Competitors take 24-48 hours.',
    
    models: {
      'interior-design': {
        name: 'adirik/interior-design',
        description: 'Primary model - Built specifically for interior design with ControlNets (segmentation + MLSD)',
        bestFor: ['Full room redesign', 'Multiple renovations', 'Kitchen/bathroom', 'Style transformation'],
        preserves: ['Room structure', 'Windows', 'Doors', 'Architectural elements'],
        cost: '$0.007/image',
        speed: '~8 seconds',
      },
      'flux-depth': {
        name: 'black-forest-labs/flux-depth-pro',
        description: 'Structure-preserving retexturing using depth maps',
        bestFor: ['Exterior renovations', 'When exact structure must stay identical'],
        preserves: ['3D spatial relationships', 'Perspective', 'Depth', 'House silhouette'],
        cost: '$0.05/image',
        speed: '~10 seconds',
      },
      'flux-kontext': {
        name: 'black-forest-labs/flux-kontext-pro',
        description: 'Text-guided targeted edits',
        bestFor: ['Single element changes', 'Quick edits', 'Paint/lighting only'],
        preserves: ['Most of original image'],
        cost: '$0.04/image',
        speed: '~6 seconds',
      },
      'flux-fill': {
        name: 'black-forest-labs/flux-fill-pro',
        description: 'Professional inpainting with masks',
        bestFor: ['Object replacement', 'Area-specific changes', 'With custom mask'],
        preserves: ['Everything outside mask'],
        cost: '$0.05/image',
        speed: '~8 seconds',
      },
      'ideogram': {
        name: 'ideogram-ai/ideogram-v3-balanced',
        description: 'Premium quality renders with excellent prompt following',
        bestFor: ['Marketing materials', 'Highest quality output', 'Presentation-ready'],
        preserves: ['Style accuracy'],
        cost: '$0.08/image',
        speed: '~12 seconds',
      },
    },
    
    styles: Object.keys(DESIGN_STYLES),
    
    renovations: {
      interior: ['paint', 'flooring', 'cabinets', 'counters', 'backsplash', 'vanity', 'shower', 'fireplace', 'lighting', 'furniture', 'appliances', 'fixtures'],
      exterior: ['siding', 'roof', 'landscaping', 'driveway', 'windows', 'door', 'garage', 'fence', 'deck', 'pool'],
    },
    
    roomTypes: Object.keys(ROOM_CONTEXTS),
    
    qualityLevels: {
      'fast': { model: 'flux-kontext', cost: '$0.04', speed: '~6s' },
      'balanced': { model: 'auto-selected', cost: '$0.007-0.05', speed: '~8-10s' },
      'quality': { model: 'ideogram', cost: '$0.08', speed: '~12s' },
    },
    
    usage: {
      method: 'POST',
      body: {
        imageUrl: 'string (required) - URL of the image to renovate',
        roomType: 'string - interior/exterior/kitchen/bathroom/bedroom/living/dining/office',
        style: 'string - Modern/Farmhouse/Luxury/Scandinavian/etc.',
        selectedRenovations: 'string[] - Array of renovation types',
        detailedOptions: 'object - Specific options per renovation type',
        model: 'string (optional) - auto/interior-design/flux-depth/flux-kontext/flux-fill/ideogram',
        promptStrength: 'number (0-1) - How much to transform (default 0.8)',
        quality: 'string - fast/balanced/quality',
      },
    },
    
    competitors: {
      'BoxBrownie': { time: '24-48 hours', price: '$24-176/image' },
      'Styldod': { time: '24 hours', price: '$16-35/image' },
      'SnapR': { time: '30 seconds', price: '$2-5/image', margin: '28,000% ROI' },
    },
    
    roi: {
      'interior-design': { cost: '$0.007', charge: '$2.00', profit: '$1.99', roi: '28,428%' },
      'flux-depth': { cost: '$0.05', charge: '$5.00', profit: '$4.95', roi: '9,900%' },
      'flux-kontext': { cost: '$0.04', charge: '$2.00', profit: '$1.96', roi: '4,900%' },
    },
  });
}
