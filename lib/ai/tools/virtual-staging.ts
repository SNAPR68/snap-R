import Replicate from 'replicate';
import { withRetry } from '../utils/retry';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export type StagingStyle = 'modern' | 'contemporary' | 'scandinavian' | 'minimalist' | 'luxury' | 'traditional';

export async function virtualStaging(
  imageUrl: string,
  options: {
    style?: StagingStyle;
    roomType?: string;
    prompt?: string;
  } = {}
): Promise<string> {
  const { style = 'modern', roomType = 'living room', prompt } = options;
  
  console.log('[VirtualStaging] Starting with style:', style);

  const stylePrompts: Record<StagingStyle, string> = {
    modern: 'modern contemporary furniture, clean lines, neutral colors, minimalist decor',
    contemporary: 'contemporary design, stylish furniture, artistic decor, warm lighting',
    scandinavian: 'scandinavian style, light wood, white walls, cozy textiles, plants',
    minimalist: 'minimalist furniture, very clean, sparse decoration, zen aesthetic',
    luxury: 'luxury high-end furniture, premium materials, elegant decor, chandeliers',
    traditional: 'traditional classic furniture, warm wood tones, elegant patterns',
  };

  const finalPrompt = prompt || `A beautifully staged ${roomType} with ${stylePrompts[style]}, professional real estate photography, photorealistic, high quality`;

  return withRetry(async () => {
    const output = await replicate.run(
      'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705571a87f6e8889',
      {
        input: {
          image: imageUrl,
          prompt: finalPrompt,
          guidance_scale: 15,
          negative_prompt: 'blurry, distorted, low quality, unrealistic, cartoon, anime',
          prompt_strength: 0.8,
          num_inference_steps: 50,
        }
      }
    );

    const resultUrl = Array.isArray(output) ? output[0] : output;
    console.log('[VirtualStaging] Complete:', resultUrl);
    return resultUrl as string;
  }, { maxRetries: 2 });
}
