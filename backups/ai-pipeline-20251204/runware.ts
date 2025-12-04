import { randomUUID } from 'node:crypto';

const RUNWARE_API = 'https://api.runware.ai/v1';
const DEFAULT_MODEL = 'runware:100@1';
const REQUEST_TIMEOUT = 60000;

export interface RunwareOptions {
  prompt: string;
  strength?: number;
  model?: string;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Runware request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

interface ImageInfo {
  base64: string;
  width: number;
  height: number;
}

async function imageToBase64WithDimensions(imageUrl: string): Promise<ImageInfo> {
  if (imageUrl.startsWith('data:image')) {
    return {
      base64: imageUrl.split(',')[1],
      width: 1344,
      height: 896,
    };
  }

  console.log('[Runware] Downloading image...');
  const response = await fetchWithTimeout(imageUrl, {}, 30000);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  console.log('[Runware] Downloaded:', (buffer.byteLength / 1024).toFixed(0), 'KB');

  let width = 0;
  let height = 0;

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i < bytes.length - 9) {
      if (bytes[i] === 0xff) {
        const marker = bytes[i + 1];
        if (marker >= 0xc0 && marker <= 0xc3) {
          height = (bytes[i + 5] << 8) | bytes[i + 6];
          width = (bytes[i + 7] << 8) | bytes[i + 8];
          break;
        }
        const length = (bytes[i + 2] << 8) | bytes[i + 3];
        i += 2 + length;
      } else {
        i++;
      }
    }
  } else if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  }

  if (width === 0 || height === 0) {
    console.log('[Runware] Could not detect dimensions, using defaults');
    width = 1344;
    height = 896;
  } else {
    console.log(`[Runware] Detected dimensions: ${width}x${height}`);
    const maxDim = 2048;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      console.log(`[Runware] Scaled to: ${width}x${height}`);
    }
    width = Math.round(width / 8) * 8;
    height = Math.round(height / 8) * 8;
  }

  return {
    base64: Buffer.from(buffer).toString('base64'),
    width,
    height,
  };
  }

async function runwareRequest(tasks: any[]): Promise<any> {
  console.log('[Runware] API request:', tasks[0]?.taskType);
  const response = await fetchWithTimeout(
    RUNWARE_API,
    {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RUNWARE_API_KEY}`,
      },
      body: JSON.stringify(tasks),
    },
    REQUEST_TIMEOUT,
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Runware] API error:', response.status, errorText);
    throw new Error(`Runware API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors && data.errors.length > 0) {
    throw new Error(`Runware error: ${data.errors[0].message || JSON.stringify(data.errors[0])}`);
  }

  return data;
}

export async function runwareEnhance(imageUrl: string, options: RunwareOptions): Promise<string> {
  const { prompt, strength = 0.7, model = DEFAULT_MODEL } = options;

  console.log('[Runware] Enhancement starting...');
  console.log('[Runware] Prompt:', prompt.substring(0, 50) + '...');

  const imageInfo = await imageToBase64WithDimensions(imageUrl);

  const data = await runwareRequest([
    {
      taskType: 'imageInference',
      taskUUID: randomUUID(),
      model,
      positivePrompt: prompt,
      negativePrompt: 'blurry, distorted, low quality, artifacts',
      seedImage: `data:image/jpeg;base64,${imageInfo.base64}`,
      strength,
      width: imageInfo.width,
      height: imageInfo.height,
      steps: 25,
      CFGScale: 7,
      outputFormat: 'JPEG',
    },
  ]);

  const imageURL = data?.data?.[0]?.imageURL;
  
  if (!imageURL) {
    console.error('[Runware] No imageURL in response:', JSON.stringify(data).substring(0, 300));
    throw new Error('Runware returned no image URL');
  }

  console.log('[Runware] Enhancement complete');
  return imageURL;
}

export async function runwareSkyReplacement(
  imageUrl: string,
  skyType: 'sunny' | 'sunset' | 'dramatic' | 'cloudy' = 'sunny',
): Promise<string> {
  console.log('[Runware] Sky Replacement starting...');

  const imageInfo = await imageToBase64WithDimensions(imageUrl);
  const base64Uri = `data:image/jpeg;base64,${imageInfo.base64}`;

  console.log('[Runware] Step 1/3: Uploading image...');
  const uploadData = await runwareRequest([
    {
      taskType: 'imageUpload',
      taskUUID: randomUUID(),
      image: base64Uri,
    },
  ]);

  const imageUUID = uploadData?.data?.[0]?.imageUUID;
  if (!imageUUID) {
    throw new Error('Runware did not return imageUUID');
  }
  console.log('[Runware] Image UUID:', imageUUID);

  console.log('[Runware] Step 2/3: Creating sky mask...');
  const maskData = await runwareRequest([
    {
      taskType: 'imageBackgroundRemoval',
      taskUUID: randomUUID(),
      inputImage: imageUUID,
      outputFormat: 'PNG',
      returnOnlyMask: true,
      postProcessMask: true,
      rgba: [0, 0, 0, 0],
    },
  ]);

  const maskUUID = maskData?.data?.[0]?.imageUUID;
  if (!maskUUID) {
    throw new Error('Failed to create sky mask');
  }
  console.log('[Runware] Mask UUID:', maskUUID);

  const prompts: Record<string, string> = {
    sunny: 'beautiful clear blue sky, bright sunny day, white fluffy cumulus clouds, perfect weather, photorealistic',
    sunset: 'beautiful golden sunset sky, orange and pink clouds, warm golden hour light, photorealistic',
    dramatic: 'dramatic sky with dark clouds, sun rays breaking through, moody atmosphere, photorealistic',
    cloudy: 'overcast sky with soft white clouds, diffused natural lighting, photorealistic',
  };

  console.log('[Runware] Step 3/3: Inpainting sky...');
  const inpaintData = await runwareRequest([
    {
      taskType: 'imageInference',
      taskUUID: randomUUID(),
      model: DEFAULT_MODEL,
      seedImage: imageUUID,
      maskImage: maskUUID,
      positivePrompt: prompts[skyType] || prompts.sunny,
      negativePrompt: 'ugly sky, distorted, blurry, low quality, artifacts, unnatural colors',
      width: imageInfo.width,
      height: imageInfo.height,
      steps: 25,
      CFGScale: 7,
      strength: 0.85,
      outputFormat: 'JPEG',
    },
  ]);

  const resultUrl = inpaintData?.data?.[0]?.imageURL;
  if (!resultUrl) {
    throw new Error('Runware inpaint returned no image URL');
  }

  console.log('[Runware] Sky Replacement complete!');
  return resultUrl;
}
