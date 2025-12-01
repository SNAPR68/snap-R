import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const UPSCALE_MODEL =
  'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa';

const FLUX_MODEL = 'black-forest-labs/flux-kontext-dev';

const VIRTUAL_STAGING_MODEL =
  'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705571a87f6e8889';

async function runFluxEdit(
  imageUrl: string,
  prompt: string,
  negativePrompt: string,
  strength: number,
) {
  console.log('[Replicate] Running Flux Kontext...');
  const output = await replicate.run(FLUX_MODEL, {
    input: {
      input_image: imageUrl,
      prompt,
    },
  });

  const result = Array.isArray(output) ? output[0] : output;
  if (!result) {
    throw new Error('Replicate returned no output');
  }

  // Handle FileOutput object or string
  const resultUrl =
    typeof result === 'string'
      ? result
      : (result as any).url?.() || String(result);

  return resultUrl;
}

export async function upscale(
  imageUrl: string,
  options?: { scale?: number } | number,
): Promise<string> {
  let scale = 2;
  if (typeof options === 'number') {
    scale = options;
  } else if (options && typeof options.scale === 'number') {
    scale = options.scale;
  }

  console.log('[Replicate] Upscaling with scale:', scale);

  const output = await replicate.run(UPSCALE_MODEL, {
    input: {
      image: imageUrl,
      scale,
      face_enhance: false,
    },
  });

  const resultUrl = Array.isArray(output) ? output[0] : output;
  if (!resultUrl) {
    throw new Error('Replicate returned no upscale output');
  }
  console.log('[Replicate] Upscale complete');
  return resultUrl as string;
}

export async function virtualTwilight(imageUrl: string): Promise<string> {
  console.log('[Replicate] Virtual Twilight');
  return runFluxEdit(
    imageUrl,
    'twilight dusk exterior photo, deep blue purple sky, golden sunset horizon, warm window glow, professional real estate photography, photorealistic, same house same angle',
    'midday, bright sun, different house, distorted architecture, low quality',
    0.7,
  );
}

export async function lawnRepair(imageUrl: string): Promise<string> {
  console.log('[Replicate] Lawn repair');
  return runFluxEdit(
    imageUrl,
    'lush green manicured lawn, vibrant grass, professional landscaping, same house same framing, photorealistic',
    'brown grass, dirt patches, different house, cartoon, distorted',
    0.55,
  );
}

export async function declutter(imageUrl: string): Promise<string> {
  console.log('[Replicate] Declutter');
  return runFluxEdit(
    imageUrl,
    'clean organized interior, no clutter, minimal decor, same room same camera angle, photorealistic real estate photo',
    'messy, personal items, toys, clothes, distorted furniture, different room',
    0.6,
  );
}

export async function virtualStaging(
  imageUrl: string,
  roomType: string = 'living room',
  style: string = 'modern',
): Promise<string> {
  console.log('[Replicate] Virtual staging:', roomType, style);
  const output = await replicate.run(VIRTUAL_STAGING_MODEL, {
    input: {
      image: imageUrl,
      prompt: `A beautifully staged ${roomType} with ${style} furniture, professional real estate photography, photorealistic, high quality interior design`,
      guidance_scale: 15,
      negative_prompt: 'blurry, distorted, low quality, unrealistic, cartoon',
      prompt_strength: 0.8,
      num_inference_steps: 50,
    },
  });

  const result = Array.isArray(output) ? output[0] : output;
  if (!result) {
    throw new Error('Replicate returned no staging output');
  }
  return result as string;
}
