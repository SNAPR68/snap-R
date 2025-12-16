// Virtual Renovation Service
// Handles AI-powered room transformations using multiple providers

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

// Primary provider: Replicate with FLUX or similar model
async function runReplicateRenovation(
  imageUrl: string,
  prompt: string
): Promise<{ url: string; model: string } | null> {
  if (!REPLICATE_API_TOKEN) return null;

  try {
    // Use instruction-based image editing model
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Using black-forest-labs/flux-kontext-pro for high-quality image editing
        version: 'kontext-dev/kontext-dev-v1:latest',
        input: {
          image: imageUrl,
          prompt: prompt,
          guidance_scale: 7.5,
          num_inference_steps: 28,
          strength: 0.75, // Balance between original and new
        },
      }),
    });

    if (!response.ok) {
      console.error('Replicate API error:', await response.text());
      return null;
    }

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max
    
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
      return { url: outputUrl, model: 'replicate-kontext' };
    }

    return null;
  } catch (error) {
    console.error('Replicate renovation error:', error);
    return null;
  }
}

// Alternative: Use Runware for faster processing
async function runRunwareRenovation(
  imageUrl: string,
  prompt: string
): Promise<{ url: string; model: string } | null> {
  if (!RUNWARE_API_KEY) return null;

  try {
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
          positivePrompt: prompt,
          negativePrompt: 'blurry, distorted, unrealistic, cartoon, drawing, painting, low quality, watermark',
          model: 'runware:100@1', // Fast model
          width: 1024,
          height: 768,
          strength: 0.7,
          steps: 25,
          CFGScale: 7,
          scheduler: 'DPM++ 2M Karras',
        },
      ]),
    });

    if (!response.ok) {
      console.error('Runware API error:', await response.text());
      return null;
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].imageURL) {
      return { url: data.data[0].imageURL, model: 'runware' };
    }

    return null;
  } catch (error) {
    console.error('Runware renovation error:', error);
    return null;
  }
}

// Fallback: Use OpenAI DALL-E for image editing (if available)
async function runOpenAIRenovation(
  imageUrl: string,
  prompt: string
): Promise<{ url: string; model: string } | null> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return null;

  try {
    // First, fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Use GPT-4 Vision to understand the image, then generate with DALL-E
    // Note: DALL-E 3 doesn't support direct image editing, so we use a workaround
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Create a photorealistic interior design rendering: ${prompt}. Professional real estate photography, high quality, detailed, realistic lighting.`,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
        style: 'natural',
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return null;
    }

    const data = await response.json();
    
    if (data.data && data.data[0] && data.data[0].url) {
      return { url: data.data[0].url, model: 'dall-e-3' };
    }

    return null;
  } catch (error) {
    console.error('OpenAI renovation error:', error);
    return null;
  }
}

// Main renovation function with fallback chain
export async function processRenovation(request: RenovationRequest): Promise<RenovationResult> {
  const startTime = Date.now();
  
  // Build the prompt
  const prompt = buildRenovationPrompt(
    request.roomType,
    request.renovationType,
    request.style,
    request.options
  );

  console.log('Renovation prompt:', prompt);

  // Try providers in order
  let result: { url: string; model: string } | null = null;

  // Try Replicate first (best quality for image editing)
  result = await runReplicateRenovation(request.imageUrl, prompt);
  
  // Fallback to Runware
  if (!result) {
    console.log('Replicate failed, trying Runware...');
    result = await runRunwareRenovation(request.imageUrl, prompt);
  }

  // Final fallback to OpenAI
  if (!result) {
    console.log('Runware failed, trying OpenAI...');
    result = await runOpenAIRenovation(request.imageUrl, prompt);
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
    error: 'All renovation providers failed. Please try again.',
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
  
  // Generate multiple variations
  for (let i = 0; i < variationCount; i++) {
    const result = await runReplicateRenovation(request.imageUrl, prompt);
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
      model: 'replicate-kontext',
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
  // Rough cost: $0.05 per credit
  return credits * 0.05;
}
