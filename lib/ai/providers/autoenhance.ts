import { SNAP_R_STACK } from '../utils/config';

class AutoEnhanceProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.AUTOENHANCE_API_KEY || '';
    this.baseUrl = SNAP_R_STACK.AUTOENHANCE.API_URL;
  }

  async processImage(imageUrl: string, options: any): Promise<string> {
    console.log('[AutoEnhance] Starting...');

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to download image');
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('[AutoEnhance] Downloaded:', (imageBuffer.byteLength / 1024).toFixed(0), 'KB');

    const createRes = await fetch(`${this.baseUrl}images`, {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_name: `snapr-${Date.now()}.jpg`, content_type: 'image/jpeg', ...options }),
    });

    if (!createRes.ok) throw new Error(`AutoEnhance create failed: ${createRes.status}`);
    
    const createData = await createRes.json();
    const imageId = createData.image_id || createData.id;
    const uploadUrl = createData.s3PutObjectUrl;

    if (uploadUrl) {
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: imageBuffer });
    }

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const checkRes = await fetch(`${this.baseUrl}images/${imageId}`, { headers: { 'x-api-key': this.apiKey } });
      const data = await checkRes.json();
      
      if (data.status === 'processed' || data.status === 'completed') {
        return data.enhanced_image_url || data.enhanced_url;
      }
      if (data.status === 'failed') throw new Error('AutoEnhance failed');
    }
    throw new Error('AutoEnhance timeout');
  }
}

export const autoEnhanceClient = new AutoEnhanceProvider();
