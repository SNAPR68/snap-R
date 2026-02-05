export type ToolId = 
  | 'auto-enhance'
  | 'sky-replacement'
  | 'lawn-repair'
  | 'object-removal'
  | 'upscaling'
  | 'virtual-staging'
  | 'twilight-conversion';

export interface ModelSelection {
  model: string;
  input: Record<string, any>;
  estimatedTimeMs: number;
  costTier: 'free' | 'low' | 'high';
  isLocal: boolean;
}

export interface PhotoContext {
  url: string;
  skyComplexity?: 'simple' | 'complex';
  roomType?: string;
}

export function selectModel(toolId: ToolId, photo: PhotoContext): ModelSelection {
  switch(toolId) {
    case 'auto-enhance':
      return {
        model: 'sharp-local',
        input: { operation: 'auto-enhance' },
        estimatedTimeMs: 500,
        costTier: 'free',
        isLocal: true
      };

    case 'sky-replacement':
      if (photo.skyComplexity === 'complex') {
        return {
          model: 'black-forest-labs/flux-kontext-dev',
          input: {
            image: photo.url,
            prompt: 'dramatic sunset sky, golden hour',
            num_inference_steps: 20
          },
          estimatedTimeMs: 15000,
          costTier: 'high',
          isLocal: false
        };
      }
      return {
        model: 'cjwbw/sky-replacer',
        input: {
          image: photo.url,
          prompt: 'clear blue sky with white clouds'
        },
        estimatedTimeMs: 3000,
        costTier: 'low',
        isLocal: false
      };

    case 'lawn-repair':
      return {
        model: 'lucataco/lama',
        input: {
          image: photo.url,
          prompt: 'lush green grass'
        },
        estimatedTimeMs: 2000,
        costTier: 'low',
        isLocal: false
      };

    case 'object-removal':
      return {
        model: 'lucataco/lama',
        input: {
          image: photo.url,
          prompt: 'clean background'
        },
        estimatedTimeMs: 2000,
        costTier: 'low',
        isLocal: false
      };

    case 'upscaling':
      return {
        model: 'nightmareai/real-esrgan',
        input: {
          image: photo.url,
          scale: 4
        },
        estimatedTimeMs: 4000,
        costTier: 'low',
        isLocal: false
      };

    case 'virtual-staging':
      return {
        model: 'jagilley/controlnet-canny',
        input: {
          image: photo.url,
          prompt: `modern ${photo.roomType || 'living room'} furniture`,
          structure: 'canny',
          num_inference_steps: 25
        },
        estimatedTimeMs: 12000,
        costTier: 'high',
        isLocal: false
      };

    case 'twilight-conversion':
      return {
        model: 'black-forest-labs/flux-kontext-dev',
        input: {
          image: photo.url,
          prompt: 'twilight blue hour, warm interior lights',
          num_inference_steps: 20
        },
        estimatedTimeMs: 18000,
        costTier: 'high',
        isLocal: false
      };

    default:
      throw new Error(`Unknown tool: ${toolId}`);
  }
}
