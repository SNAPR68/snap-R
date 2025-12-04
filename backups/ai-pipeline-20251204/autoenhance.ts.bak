import { SNAP_R_STACK } from '../utils/config';

const AUTOENHANCE_TIMEOUT_MS = 60000;
const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 3000;

class AutoEnhanceProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.AUTOENHANCE_API_KEY || '';
    this.baseUrl = SNAP_R_STACK.AUTOENHANCE.API_URL;
  }

  async processImage(imageUrl: string, options: any): Promise<string> {
    console.log('[AutoEnhance] Starting...');

    if (!this.apiKey) {
      throw new Error('AutoEnhance API key not configured');
    }

    const controller = new AbortController();
    const downloadTimeout = setTimeout(() => controller.abort(), 30000);

    let imageBuffer: ArrayBuffer;
    try {
      const imageResponse = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(downloadTimeout);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      imageBuffer = await imageResponse.arrayBuffer();
    console.log('[AutoEnhance] Downloaded:', (imageBuffer.byteLength / 1024).toFixed(0), 'KB');
    } catch (error: any) {
      clearTimeout(downloadTimeout);
      if (error.name === 'AbortError') {
        throw new Error('AutoEnhance: Image download timeout');
      }
      throw error;
    }

    const createRes = await fetch(`${this.baseUrl}images`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_name: `snapr-${Date.now()}.jpg`,
        content_type: 'image/jpeg',
        ...options,
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`AutoEnhance create failed: ${createRes.status} - ${errorText}`);
    }
    
    const createData = await createRes.json();
    const imageId = createData.image_id || createData.id;
    const uploadUrl = createData.s3PutObjectUrl;

    if (!imageId) {
      throw new Error('AutoEnhance did not return image_id');
    }
    console.log('[AutoEnhance] Image ID:', imageId);

    if (uploadUrl) {
      console.log('[AutoEnhance] Uploading to S3...');
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: imageBuffer,
      });
      if (!uploadRes.ok) {
        throw new Error(`AutoEnhance S3 upload failed: ${uploadRes.status}`);
    }
    }

    console.log('[AutoEnhance] Polling for result...');
    const startTime = Date.now();

    for (let i = 0; i < MAX_POLLS; i++) {
      if (Date.now() - startTime > AUTOENHANCE_TIMEOUT_MS) {
        throw new Error(`AutoEnhance timeout after ${AUTOENHANCE_TIMEOUT_MS / 1000}s`);
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const checkRes = await fetch(`${this.baseUrl}images/${imageId}`, {
        headers: { 'x-api-key': this.apiKey },
      });

      if (!checkRes.ok) {
        console.warn(`[AutoEnhance] Poll ${i + 1} failed: ${checkRes.status}`);
        continue;
      }

      const data = await checkRes.json();
      console.log(`[AutoEnhance] Poll ${i + 1}/${MAX_POLLS}: status=${data.status}`);
      
      if (data.status === 'processed' || data.status === 'completed') {
        const resultUrl = data.enhanced_image_url || data.enhanced_url;
        if (resultUrl) {
          console.log('[AutoEnhance] Complete!');
          return resultUrl;
        }
        throw new Error('AutoEnhance completed but no URL returned');
      }

      if (data.status === 'failed') {
        throw new Error(`AutoEnhance processing failed: ${data.error || 'Unknown error'}`);
    }
    }

    throw new Error(`AutoEnhance timeout after ${MAX_POLLS} polls`);
  }
}

export const autoEnhanceClient = new AutoEnhanceProvider();

export async function autoEnhance(imageUrl: string, options: Record<string, any>): Promise<string> {
  return autoEnhanceClient.processImage(imageUrl, options);
}
