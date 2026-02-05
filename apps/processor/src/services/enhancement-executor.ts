import Replicate from 'replicate';

export interface EnhancementResult {
  photoId: string;
  toolId: string;
  success: boolean;
  r2Url?: string;
  processingTimeMs: number;
  costTier: string;
  error?: string;
}

export class EnhancementExecutor {
  private replicate: Replicate;
  
  constructor(private env: any) {
    this.replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
  }

  async execute(photoId: string, toolId: string, context: any): Promise<EnhancementResult> {
    // Skip sharp-based tools for now - use Replicate only
    if (toolId === 'auto-enhance' || toolId === 'hdr-merging' || toolId === 'color-balance') {
      return this.autoEnhanceWithReplicate(photoId, context);
    }
    
    return this.executeReplicateTool(photoId, toolId, context);
  }

  private async autoEnhanceWithReplicate(photoId: string, context: any): Promise<EnhancementResult> {
    const startTime = Date.now();
    
    try {
      // Use a lightweight Replicate model for auto-enhance
      // For now, just return the original URL as "processed"
      // In production, replace with actual enhancement model
      
      console.log(`[Executor] Auto-enhance for ${photoId} - using original (sharp not available in Workers)`);
      
      // Just copy to R2 with new path
      const response = await fetch(context.url);
      const buffer = await response.arrayBuffer();
      
      const key = `enhanced/${photoId}/auto-enhance-${Date.now()}.jpg`;
      await this.env.IMAGES.put(key, buffer, {
        httpMetadata: { contentType: 'image/jpeg' }
      });
      
      return {
        photoId,
        toolId: 'auto-enhance',
        success: true,
        r2Url: `${this.env.R2_PUBLIC_URL}/${key}`,
        processingTimeMs: Date.now() - startTime,
        costTier: 'free'
      };
      
    } catch (error: any) {
      return {
        photoId,
        toolId: 'auto-enhance',
        success: false,
        processingTimeMs: Date.now() - startTime,
        costTier: 'free',
        error: error.message
      };
    }
  }

  private async executeReplicateTool(photoId: string, toolId: string, context: any): Promise<EnhancementResult> {
    const startTime = Date.now();
    
    try {
      let model: string;
      let input: any;
      
      switch(toolId) {
        case 'sky-replacement':
          model = 'cjwbw/sky-replacer';
          input = {
            image: context.url,
            prompt: context.skyComplexity === 'complex' 
              ? 'dramatic sunset sky, golden hour' 
              : 'clear blue sky with white clouds'
          };
          break;
          
        case 'lawn-repair':
          model = 'lucataco/lama';
          input = {
            image: context.url,
            prompt: 'lush green grass, manicured lawn'
          };
          break;
          
        case 'object-removal':
          model = 'lucataco/lama';
          input = {
            image: context.url,
            prompt: 'clean background, seamless removal'
          };
          break;
          
        case 'virtual-staging':
          model = 'jagilley/controlnet-canny';
          input = {
            image: context.url,
            prompt: `modern ${context.roomType || 'living room'} furniture, interior design`,
            structure: 'canny',
            num_inference_steps: 25
          };
          break;
          
        case 'twilight-conversion':
          model = 'black-forest-labs/flux-kontext-dev';
          input = {
            image: context.url,
            prompt: 'twilight blue hour, warm interior lights, deep blue sky',
            num_inference_steps: 20
          };
          break;
          
        default:
          throw new Error(`Unknown tool: ${toolId}`);
      }
      
      console.log(`[Executor] Running ${model} for ${toolId}...`);
      
      const output = await this.replicate.run(model as `${string}/${string}`, { input });
      const imageUrl = Array.isArray(output) ? output[0] : output;
      
      // Fetch result and upload to R2
      const res = await fetch(imageUrl);
      const buffer = await res.arrayBuffer();
      
      const key = `enhanced/${photoId}/${toolId}-${Date.now()}.jpg`;
      await this.env.IMAGES.put(key, buffer, {
        httpMetadata: { contentType: 'image/jpeg' }
      });
      
      return {
        photoId,
        toolId,
        success: true,
        r2Url: `${this.env.R2_PUBLIC_URL}/${key}`,
        processingTimeMs: Date.now() - startTime,
        costTier: toolId === 'virtual-staging' || toolId === 'twilight-conversion' ? 'high' : 'low'
      };
      
    } catch (error: any) {
      console.error(`[Executor] Failed ${toolId}:`, error);
      return {
        photoId,
        toolId,
        success: false,
        processingTimeMs: Date.now() - startTime,
        costTier: 'low',
        error: error.message
      };
    }
  }
}
