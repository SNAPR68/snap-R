import { randomUUID } from 'node:crypto';
import { SNAP_R_STACK } from '../utils/config';

class RunwareProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RUNWARE_API_KEY || '';
  }

  async processImage(imageUrl: string, prompt: string, strength: number = 0.7, model: string = SNAP_R_STACK.RUNWARE.TWILIGHT_MODE): Promise<string> {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const res = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify([{
        taskType: 'imageInference',
        taskUUID: randomUUID(),
        model,
        positivePrompt: prompt,
        negativePrompt: 'blurry, distorted, low quality',
        seedImage: `data:image/jpeg;base64,${base64}`,
        strength, width: 1344, height: 896, steps: 25, CFGScale: 7, outputFormat: 'JPEG',
      }]),
    });

    const data = await res.json();
    return data.data?.[0]?.imageURL;
  }
}

export const runwareClient = new RunwareProvider();

export async function runwareEnhance(
  imageUrl: string,
  {
    prompt,
    strength = 0.7,
    model = SNAP_R_STACK.RUNWARE.TWILIGHT_MODE,
  }: { prompt: string; strength?: number; model?: string }
) {
  return runwareClient.processImage(imageUrl, prompt, strength, model);
}
