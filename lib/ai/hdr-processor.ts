/**
 * SnapR V3 - HDR Processor
 * =========================
 * 
 * Handles HDR merge for bracketed photo sets:
 * 1. Imagen AI (Premium) - Professional HDR merge + window pull + perspective
 * 2. Local OpenCV (FREE) - Mertens exposure fusion fallback
 */

import sharp from 'sharp';
import { BracketGroup } from './input-router';

// ============================================
// TYPES
// ============================================

export interface HDRProcessingOptions {
  useImagen?: boolean;
  imagenApiKey?: string;
  imagenProfileKey?: string;
  toneMapping?: 'natural' | 'vivid' | 'dramatic';
  alignImages?: boolean;
  enableWindowPull?: boolean;
  enablePerspective?: boolean;
}

export interface HDRResult {
  success: boolean;
  outputBuffer: Buffer;
  outputUrl?: string;
  provider: 'imagen' | 'local';
  processingTimeMs: number;
  windowPullApplied?: boolean;
  perspectiveCorrected?: boolean;
  cost: number;
  error?: string;
}

export interface ImagenConfig {
  apiKey: string;
  baseUrl?: string;
  profileKey?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  IMAGEN_BASE_URL: 'https://api.imagen-ai.com/v1',
  IMAGEN_TIMEOUT_MS: 60000,
  COST_IMAGEN_HDR: 0.05,
  COST_IMAGEN_PERSPECTIVE: 0.02,
  COST_IMAGEN_WINDOW_PULL: 0.00,
  COST_LOCAL: 0.00,
  LOCAL_OUTPUT_QUALITY: 92,
  LOCAL_MAX_DIMENSION: 4096,
};

// ============================================
// IMAGEN AI CLIENT
// ============================================

export class ImagenAIClient {
  private apiKey: string;
  private baseUrl: string;
  private profileKey?: string;
  
  constructor(config: ImagenConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || CONFIG.IMAGEN_BASE_URL;
    this.profileKey = config.profileKey;
  }
  
  async processHDRBracket(
    bracket: BracketGroup,
    options: {
      hdr?: { enabled: boolean; toneMapping?: string };
      windowBalance?: { enabled: boolean };
      perspective?: { enabled: boolean };
    }
  ): Promise<{
    buffer: Buffer;
    windowPullApplied: boolean;
    perspectiveCorrected: boolean;
    cost: number;
  }> {
    console.log(`[ImagenAI] Processing bracket ${bracket.id} with ${bracket.images.length} images`);
    
    const formData = new FormData();
    
    for (let i = 0; i < bracket.images.length; i++) {
      const img = bracket.images[i];
      if (img.buffer) {
        // Convert Buffer to Uint8Array for Blob compatibility
        const uint8Array = new Uint8Array(img.buffer);
        const blob = new Blob([uint8Array], { type: 'image/jpeg' });
        formData.append('images', blob, img.filename);
      }
    }
    
    formData.append('hdr', JSON.stringify(options.hdr || { enabled: true }));
    formData.append('windowBalance', JSON.stringify(options.windowBalance || { enabled: true }));
    formData.append('perspective', JSON.stringify(options.perspective || { enabled: true }));
    
    if (this.profileKey) {
      formData.append('profileKey', this.profileKey);
    }
    
    const response = await fetch(`${this.baseUrl}/edits/hdr-bracket`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: formData,
      signal: AbortSignal.timeout(CONFIG.IMAGEN_TIMEOUT_MS),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Imagen API error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    const imageResponse = await fetch(result.outputUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let cost = CONFIG.COST_IMAGEN_HDR;
    if (options.perspective?.enabled && result.perspectiveCorrected) {
      cost += CONFIG.COST_IMAGEN_PERSPECTIVE;
    }
    
    return {
      buffer,
      windowPullApplied: result.windowBalanceApplied || false,
      perspectiveCorrected: result.perspectiveCorrected || false,
      cost,
    };
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============================================
// LOCAL HDR PROCESSING
// ============================================

export async function processLocalHDR(
  bracket: BracketGroup,
  options?: { toneMapping?: 'natural' | 'vivid' | 'dramatic' }
): Promise<HDRResult> {
  const startTime = Date.now();
  
  console.log(`[LocalHDR] Processing bracket ${bracket.id} with ${bracket.images.length} images`);
  
  try {
    const sortedImages = [...bracket.images].sort((a, b) => 
      (a.exposureValue ?? 0) - (b.exposureValue ?? 0)
    );
    
    const loadedImages = await Promise.all(
      sortedImages.map(async (img) => {
        if (!img.buffer) {
          throw new Error(`No buffer for image ${img.filename}`);
        }
        
        const { data, info } = await sharp(img.buffer)
          .resize(CONFIG.LOCAL_MAX_DIMENSION, CONFIG.LOCAL_MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .raw()
          .toBuffer({ resolveWithObject: true });
        
        return {
          data,
          width: info.width,
          height: info.height,
          channels: info.channels,
          exposureValue: img.exposureValue ?? 0,
        };
      })
    );
    
    const targetWidth = loadedImages[0].width;
    const targetHeight = loadedImages[0].height;
    const channels = loadedImages[0].channels;
    
    const fusedData = exposureFusion(loadedImages, targetWidth, targetHeight, channels);
    
    let outputBuffer = await sharp(fusedData, {
      raw: { width: targetWidth, height: targetHeight, channels: channels as 3 | 4 },
    })
      .jpeg({ quality: CONFIG.LOCAL_OUTPUT_QUALITY })
      .toBuffer();
    
    const toneMapping = options?.toneMapping || 'natural';
    outputBuffer = await applyToneMapping(outputBuffer, toneMapping);
    
    return {
      success: true,
      outputBuffer,
      provider: 'local',
      processingTimeMs: Date.now() - startTime,
      cost: CONFIG.COST_LOCAL,
    };
    
  } catch (error) {
    console.error('[LocalHDR] Processing failed:', error);
    return {
      success: false,
      outputBuffer: Buffer.alloc(0),
      provider: 'local',
      processingTimeMs: Date.now() - startTime,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function exposureFusion(
  images: Array<{ data: Buffer; width: number; height: number; channels: number; exposureValue: number }>,
  width: number,
  height: number,
  channels: number
): Buffer {
  const pixelCount = width * height;
  const result = Buffer.alloc(pixelCount * channels);
  
  const weights = images.map(img => calculateExposureWeights(img.data, pixelCount, channels));
  
  const weightSums = new Float32Array(pixelCount);
  for (let i = 0; i < images.length; i++) {
    for (let p = 0; p < pixelCount; p++) {
      weightSums[p] += weights[i][p];
    }
  }
  
  for (let p = 0; p < pixelCount; p++) {
    const pixelOffset = p * channels;
    const weightSum = weightSums[p] || 1;
    
    for (let c = 0; c < channels; c++) {
      let blendedValue = 0;
      for (let i = 0; i < images.length; i++) {
        const imgPixelValue = images[i].data[pixelOffset + c];
        const weight = weights[i][p] / weightSum;
        blendedValue += imgPixelValue * weight;
      }
      result[pixelOffset + c] = Math.round(Math.max(0, Math.min(255, blendedValue)));
    }
  }
  
  return result;
}

function calculateExposureWeights(data: Buffer, pixelCount: number, channels: number): Float32Array {
  const weights = new Float32Array(pixelCount);
  
  for (let p = 0; p < pixelCount; p++) {
    const pixelOffset = p * channels;
    const r = data[pixelOffset];
    const g = data[pixelOffset + 1];
    const b = data[pixelOffset + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    const normalizedLum = luminance / 255;
    const wellExposedness = Math.exp(-0.5 * Math.pow((normalizedLum - 0.5) / 0.2, 2));
    const contrast = Math.abs(luminance - 128) / 128;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max > 0 ? (max - min) / max : 0;
    
    weights[p] = wellExposedness * (0.5 + 0.3 * contrast + 0.2 * saturation);
  }
  
  return weights;
}

async function applyToneMapping(buffer: Buffer, style: 'natural' | 'vivid' | 'dramatic'): Promise<Buffer> {
  const adjustments: Record<string, { brightness: number; saturation: number; contrast: number }> = {
    natural: { brightness: 1.0, saturation: 1.05, contrast: 1.05 },
    vivid: { brightness: 1.02, saturation: 1.15, contrast: 1.1 },
    dramatic: { brightness: 0.98, saturation: 1.2, contrast: 1.15 },
  };
  
  const adj = adjustments[style];
  
  return sharp(buffer)
    .modulate({ brightness: adj.brightness, saturation: adj.saturation })
    .linear(adj.contrast, -(128 * adj.contrast) + 128)
    .jpeg({ quality: CONFIG.LOCAL_OUTPUT_QUALITY })
    .toBuffer();
}

// ============================================
// HDR PROCESSOR (MAIN CLASS)
// ============================================

export class HDRProcessor {
  private imagenClient?: ImagenAIClient;
  private useImagen: boolean;
  private preferLocal: boolean;
  
  constructor(options?: HDRProcessingOptions) {
    this.useImagen = !!(options?.useImagen && options?.imagenApiKey);
    this.preferLocal = !this.useImagen;
    
    if (options?.imagenApiKey) {
      this.imagenClient = new ImagenAIClient({
        apiKey: options.imagenApiKey,
        profileKey: options.imagenProfileKey,
      });
    }
  }
  
  async processBracket(
    bracket: BracketGroup,
    options?: {
      forceLocal?: boolean;
      forceImagen?: boolean;
      toneMapping?: 'natural' | 'vivid' | 'dramatic';
      enableWindowPull?: boolean;
      enablePerspective?: boolean;
    }
  ): Promise<HDRResult> {
    const startTime = Date.now();
    
    const useLocal = options?.forceLocal || 
      (this.preferLocal && !options?.forceImagen) ||
      !this.imagenClient;
    
    if (useLocal) {
      console.log('[HDRProcessor] Using LOCAL processing (OpenCV-style)');
      return processLocalHDR(bracket, { toneMapping: options?.toneMapping });
    }
    
    console.log('[HDRProcessor] Using IMAGEN AI for HDR processing');
    
    try {
      const result = await this.imagenClient!.processHDRBracket(bracket, {
        hdr: { enabled: true, toneMapping: options?.toneMapping || 'natural' },
        windowBalance: { enabled: options?.enableWindowPull ?? true },
        perspective: { enabled: options?.enablePerspective ?? true },
      });
      
      return {
        success: true,
        outputBuffer: result.buffer,
        provider: 'imagen',
        processingTimeMs: Date.now() - startTime,
        windowPullApplied: result.windowPullApplied,
        perspectiveCorrected: result.perspectiveCorrected,
        cost: result.cost,
      };
      
    } catch (error) {
      console.error('[HDRProcessor] Imagen failed, falling back to local:', error);
      
      const localResult = await processLocalHDR(bracket, { toneMapping: options?.toneMapping });
      
      return {
        ...localResult,
        error: `Imagen failed: ${error instanceof Error ? error.message : 'Unknown'}. Used local fallback.`,
      };
    }
  }
  
  async isImagenAvailable(): Promise<boolean> {
    if (!this.imagenClient) return false;
    return this.imagenClient.healthCheck();
  }
}

export default { HDRProcessor, ImagenAIClient, processLocalHDR, CONFIG };
