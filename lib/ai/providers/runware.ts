import { randomUUID } from 'node:crypto';

const DEFAULT_MODEL = 'runware:100@1';

export interface RunwareOptions {
  prompt: string;
  strength?: number;
  model?: string;
}

export async function runwareEnhance(imageUrl: string, options: RunwareOptions): Promise<string> {
  const { prompt, strength = 0.7, model = DEFAULT_MODEL } = options;
  
  console.log('[Runware] Starting with prompt:', prompt.substring(0, 50) + '...');
  console.log('[Runware] Model:', model, 'Strength:', strength);

  let base64Data: string;
  
  if (imageUrl.startsWith('data:image')) {
    base64Data = imageUrl.split(',')[1];
  } else {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Runware failed to download source image: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    base64Data = Buffer.from(buffer).toString('base64');
  }

  const requestBody = [{
    taskType: 'imageInference',
    taskUUID: randomUUID(),
    model,
    positivePrompt: prompt,
    negativePrompt: 'blurry, distorted, low quality, artifacts',
    seedImage: `data:image/jpeg;base64,${base64Data}`,
    strength,
    width: 1344,
    height: 896,
    steps: 25,
    CFGScale: 7,
    outputFormat: 'JPEG',
  }];

  const response = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Runware] API error:', response.status, errorText);
    throw new Error(`Runware API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[Runware] Response received');

  const imageURL = data?.data?.[0]?.imageURL || data?.[0]?.imageURL;
  
  if (!imageURL) {
    console.error('[Runware] No imageURL in response:', JSON.stringify(data).substring(0, 300));
    throw new Error('Runware returned no image URL');
  }

  console.log('[Runware] Enhancement complete');
  return imageURL;
}

/**
 * Sky Replacement using Runware inpainting pipeline
 * Faster than AutoEnhance (~30s vs 180s timeout)
 */
export async function runwareSkyReplacement(
  imageUrl: string,
  skyType: 'sunny' | 'sunset' | 'dramatic' | 'cloudy' = 'sunny'
): Promise<string> {
  console.log('[Runware] Sky Replacement starting...');

  let base64Data: string;
  if (imageUrl.startsWith('data:image')) {
    base64Data = imageUrl.split(',')[1];
  } else {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      const buffer = await response.arrayBuffer();
      base64Data = Buffer.from(buffer).toString('base64');
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  const base64Uri = `data:image/jpeg;base64,${base64Data}`;

  console.log('[Runware] Uploading image...');
  const uploadResponse = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify([{
      taskType: 'imageUpload',
      taskUUID: randomUUID(),
      image: base64Uri,
    }]),
  });

  if (!uploadResponse.ok) {
    throw new Error(`Runware upload failed: ${uploadResponse.status}`);
  }

  const uploadData = await uploadResponse.json();
  const imageUUID = uploadData?.data?.[0]?.imageUUID;
  if (!imageUUID) throw new Error('Runware did not return imageUUID');
  console.log('[Runware] Image UUID:', imageUUID);

  console.log('[Runware] Creating sky mask...');
  const maskResponse = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify([{
      taskType: 'imageBackgroundRemoval',
      taskUUID: randomUUID(),
      inputImage: imageUUID,
      outputFormat: 'PNG',
      returnOnlyMask: true,
      postProcessMask: true,
      rgba: [0, 0, 0, 0],
    }]),
  });

  if (!maskResponse.ok) {
    throw new Error(`Runware mask creation failed: ${maskResponse.status}`);
  }

  const maskData = await maskResponse.json();
  const maskUUID = maskData?.data?.[0]?.imageUUID;
  if (!maskUUID) throw new Error('Failed to create sky mask');
  console.log('[Runware] Mask UUID:', maskUUID);

  const prompts: Record<string, string> = {
    sunny: 'beautiful clear blue sky, bright sunny day, white fluffy cumulus clouds, perfect weather, photorealistic',
    sunset: 'beautiful golden sunset sky, orange and pink clouds, warm golden hour light, photorealistic',
    dramatic: 'dramatic sky with dark clouds, sun rays breaking through, moody atmosphere, photorealistic',
    cloudy: 'overcast sky with soft white clouds, diffused natural lighting, photorealistic',
  };

  console.log('[Runware] Inpainting sky...');
  const inpaintResponse = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
    },
    body: JSON.stringify([{
      taskType: 'imageInference',
      taskUUID: randomUUID(),
      model: 'runware:100@1',
      seedImage: imageUUID,
      maskImage: maskUUID,
      positivePrompt: prompts[skyType] || prompts.sunny,
      negativePrompt: 'ugly sky, distorted, blurry, low quality, artifacts, unnatural colors',
      width: 1344,
      height: 896,
      steps: 25,
      CFGScale: 7,
      strength: 0.85,
      outputFormat: 'JPEG',
    }]),
  });

  if (!inpaintResponse.ok) {
    const errorText = await inpaintResponse.text();
    throw new Error(`Runware inpaint failed: ${inpaintResponse.status} - ${errorText}`);
  }

  const inpaintData = await inpaintResponse.json();
  const resultUrl = inpaintData?.data?.[0]?.imageURL;
  if (!resultUrl) throw new Error('Runware inpaint returned no image URL');

  console.log('[Runware] Sky Replacement complete!');
  return resultUrl;
}
