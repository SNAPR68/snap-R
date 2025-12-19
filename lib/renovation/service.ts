// Virtual Renovation Service
// Handles AI-powered room transformations using image-to-image models

import { buildRenovationPrompt, RENOVATION_TYPES } from './config';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY;

interface RenovationRequest {
  imageUrl: string;
  roomType: string;
  renovationType: string;
  style: string;
  options: Record<string, string>;
}

interface RenovationResult {
  success: boolean;
  resultUrl?: string;
  resultUrls?: string[];
  error?: string;
  model?: string;
  processingTime?: number;
  prompt?: string;
}

// Primary: Instruct-Pix2Pix - Best for instruction-based image editing
async function runInstructPix2Pix(
  imageUrl: string,
  prompt: string
): Promise<{ url: string; model: string } | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    console.log('Trying Instruct-Pix2Pix...');
    
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
          prompt: prompt,
          num_inference_steps: 50,
          image_guidance_scale: 1.5, // How much to follow original image (higher = more faithful)
          guidance_scale: 7.5,
          scheduler: 'K_EULER_ANCESTRAL',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instruct-Pix2Pix API error:', errorText);
      return null;
    }

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 90; // 3 minutes max
    
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
      });
      result = await pollResponse.json();
      attempts++;
      
      if (attempts % 10 === 0) {
        console.log(`Instruct-Pix2Pix status: ${result.status}, attempt ${attempts}`);
      }
    }

    if (result.status === 'succeeded' && result.output) {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      console.log('Instruct-Pix2Pix succeeded!');
      return { url: outputUrl, model: 'instruct-pix2pix' };
    }

    console.error('Instruct-Pix2Pix failed:', result.error || result.status);
    return null;
  } catch (error) {
    console.error('Instruct-Pix2Pix error:', error);
    return null;
  }
}

// Secondary: SDXL img2img - Good quality, maintains structure
async function runSDXLImg2Img(
  imageUrl: string,
  prompt: string
): Promise<{ url: string; model: string } | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    console.log('Trying SDXL img2img...');
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        input: {
          image: imageUrl,
          prompt: `Interior design photography, ${prompt}, professional real estate photo, high quality, photorealistic, detailed, well-lit`,
          negative_prompt: 'blurry, distorted, unrealistic, cartoon, drawing, painting, low quality, watermark, text, logo, deformed',
          prompt_strength: 0.7, // 0.7 = 70% new, 30% original structure
          num_inference_steps: 40,
          guidance_scale: 7.5,
          scheduler: 'K_EULER',
          refine: 'expert_ensemble_refiner',
          high_noise_frac: 0.8,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SDXL API error:', errorText);
      return null;
    }

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 90;
    
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
      });
      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === 'succeeded' && result.output) {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      console.log('SDXL img2img succeeded!');
      return { url: outputUrl, model: 'sdxl-img2img' };
    }

    console.error('SDXL failed:', result.error || result.status);
    return null;
  } catch (error) {
    console.error('SDXL img2img error:', error);
    return null;
  }
}

// Tertiary: Runware with proper img2img
async function runRunwareImg2Img(
  imageUrl: string,
  prompt: string
): Promise<{ url: string; model: string } | null> {
  if (!RUNWARE_API_KEY) return null;

  try {
    console.log('Trying Runware img2img...');
    
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNWARE_API_KEY}`,
      },
      body: JSON.stringify([
        {
          taskType: 'imageInference',
          taskUUID: crypto.randomUUID(),
          inputImage: imageUrl,
          positivePrompt: `Interior design photography, ${prompt}, professional real estate photo, high quality, photorealistic`,
          negativePrompt: 'blurry, distorted, unrealistic, cartoon, drawing, painting, low quality, watermark, deformed, ugly',
          model: 'civitai:101055@128078', // RealisticVision V5.1 - good for interiors
          width: 1024,
          height: 768,
          strength: 0.65, // Keep 35% of original structure
          steps: 30,
          CFGScale: 7,
          scheduler: 'DPM++ 2M Karras',
          seedImage: imageUrl,
        },
      ]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Runware API error:', errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].imageURL) {
      console.log('Runware img2img succeeded!');
      return { url: data.data[0].imageURL, model: 'runware-realistic-vision' };
    }

    console.error('Runware response missing imageURL:', data);
    return null;
  } catch (error) {
    console.error('Runware img2img error:', error);
    return null;
  }
}

// Interior design specialized model
async function runInteriorDesignModel(
  imageUrl: string,
  prompt: string
): Promise<{ url: string; model: string } | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    console.log('Trying Interior Design model...');
    
    // Use adirik/interior-design model specifically trained for room transformations
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38',
        input: {
          image: imageUrl,
          prompt: prompt,
          guidance_scale: 15,
          negative_prompt: 'lowres, watermark, banner, logo, contactinfo, text, deformed, blurry, blur, out of focus, out of frame, surreal, ugly',
          prompt_strength: 0.8,
          num_inference_steps: 50,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Interior Design model API error:', errorText);
      return null;
    }

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 90;
    
    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
      });
      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === 'succeeded' && result.output) {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      console.log('Interior Design model succeeded!');
      return { url: outputUrl, model: 'interior-design' };
    }

    return null;
  } catch (error) {
    console.error('Interior Design model error:', error);
    return null;
  }
}

// Main renovation function with proper fallback chain
export async function processRenovation(request: RenovationRequest): Promise<RenovationResult> {
  const startTime = Date.now();
  
  // Build the prompt
  const prompt = buildRenovationPrompt(
    request.roomType,
    request.renovationType,
    request.style,
    request.options
  );

  console.log('Processing renovation with prompt:', prompt);

  let result: { url: string; model: string } | null = null;

  // Try specialized interior design model first (best for room renovations)
  result = await runInteriorDesignModel(request.imageUrl, prompt);
  
  // Fallback to Instruct-Pix2Pix (good for instruction-based editing)
  if (!result) {
    console.log('Interior model failed, trying Instruct-Pix2Pix...');
    result = await runInstructPix2Pix(request.imageUrl, prompt);
  }
  
  // Fallback to SDXL img2img
  if (!result) {
    console.log('Instruct-Pix2Pix failed, trying SDXL img2img...');
    result = await runSDXLImg2Img(request.imageUrl, prompt);
  }

  // Final fallback to Runware
  if (!result) {
    console.log('SDXL failed, trying Runware...');
    result = await runRunwareImg2Img(request.imageUrl, prompt);
  }

  const processingTime = Date.now() - startTime;

  if (result) {
    return {
      success: true,
      resultUrl: result.url,
      model: result.model,
      processingTime,
      prompt,
    };
  }

  return {
    success: false,
    error: 'All renovation providers failed. Please try again later.',
    processingTime,
    prompt,
  };
}

// Generate multiple variations
export async function processRenovationWithVariations(
  request: RenovationRequest,
  variationCount: number = 3
): Promise<RenovationResult> {
  const startTime = Date.now();
  const prompt = buildRenovationPrompt(
    request.roomType,
    request.renovationType,
    request.style,
    request.options
  );

  const results: string[] = [];
  
  // Generate multiple variations using interior design model
  for (let i = 0; i < variationCount; i++) {
    const result = await runInteriorDesignModel(request.imageUrl, prompt);
    if (result?.url) {
      results.push(result.url);
    }
  }

  const processingTime = Date.now() - startTime;

  if (results.length > 0) {
    return {
      success: true,
      resultUrl: results[0],
      resultUrls: results,
      model: 'interior-design',
      processingTime,
      prompt,
    };
  }

  // Fallback to single generation
  return processRenovation(request);
}

// Calculate credits for a renovation
export function calculateCredits(renovationType: string): number {
  const type = RENOVATION_TYPES[renovationType as keyof typeof RENOVATION_TYPES];
  return type?.credits || 3;
}

// Estimate cost for analytics
export function estimateCost(renovationType: string): number {
  const credits = calculateCredits(renovationType);
  // Rough cost estimate per provider
  return credits * 0.08; // ~$0.08 per credit for img2img models
}
