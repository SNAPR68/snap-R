/**
 * SnapR V3 - HDR Processor
 * =========================
 * 
 * Handles HDR merge and enhancement via Imagen AI:
 * 1. Imagen AI - Professional HDR merge + window pull + perspective
 * 2. Local Sharp.js fallback for basic processing
 */

import sharp from 'sharp';
import { BracketGroup } from './input-router';

// ============================================
// TYPES
// ============================================

export interface HDRProcessingOptions {
  useImagen?: boolean;
  profileKey?: number;
  toneMapping?: 'natural' | 'vivid' | 'dramatic';
  enableWindowPull?: boolean;
  enablePerspective?: boolean;
  enableHDRMerge?: boolean;
}

export interface HDRResult {
  success: boolean;
  outputBuffer?: Buffer;
  outputUrl?: string;
  provider: 'imagen' | 'local';
  processingTimeMs: number;
  windowPullApplied?: boolean;
  perspectiveCorrected?: boolean;
  cost: number;
  error?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  IMAGEN_BASE_URL: 'https://api.imagen-ai.com/v1',
  IMAGEN_TIMEOUT_MS: 120000, // 2 minutes
  IMAGEN_POLL_INTERVAL_MS: 2000, // 2 seconds
  IMAGEN_MAX_POLLS: 60, // Max 2 minutes waiting
  
  // Profiles for real estate
  PROFILES: {
    ELEGANT_HOME_JPEG: 178014,
    ELEGANT_HOME_RAW: 178011,
    NATURAL_HOME_JPEG: 333757,
    NATURAL_HOME_RAW: 333755,
  },
  
  // Costs (estimated per image)
  COST_IMAGEN_BASE: 0.08,
  COST_IMAGEN_HDR: 0.04,
  COST_IMAGEN_WINDOW_PULL: 0.02,
  COST_IMAGEN_PERSPECTIVE: 0.02,
};

// ============================================
// IMAGEN AI CLIENT
// ============================================

export class ImagenAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = CONFIG.IMAGEN_BASE_URL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Imagen API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createProject(): Promise<string> {
    const result = await this.request('/projects/', { method: 'POST' });
    return result.data.project_uuid;
  }

  async getUploadLinks(projectUuid: string, fileNames: string[]): Promise<{ fileName: string; uploadLink: string }[]> {
    const result = await this.request(`/projects/${projectUuid}/get_temporary_upload_links`, {
      method: 'POST',
      body: JSON.stringify({
        files_list: fileNames.map(name => ({ file_name: name })),
      }),
    });
    
    return result.data.files_list.map((f: any) => ({
      fileName: f.file_name,
      uploadLink: f.upload_link,
    }));
  }

  async uploadImage(uploadLink: string, buffer: Buffer): Promise<void> {
    const response = await fetch(uploadLink, {
      method: 'PUT',
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
  }

  async startEdit(projectUuid: string, options: {
    profileKey: number;
    hdrMerge?: boolean;
    windowPull?: boolean;
    perspectiveCorrection?: boolean;
  }): Promise<void> {
    await this.request(`/projects/${projectUuid}/edit`, {
      method: 'POST',
      body: JSON.stringify({
        profile_key: options.profileKey,
        hdr_merge: options.hdrMerge ?? false,
        window_pull: options.windowPull ?? true,
        perspective_correction: options.perspectiveCorrection ?? true,
        straighten: false, // Can't use with perspective_correction
        headshot_crop: false,
        portrait_crop: false,
        crop: false,
        subject_mask: false,
        smooth_skin: false,
      }),
    });
  }

  async getEditStatus(projectUuid: string): Promise<string> {
    const result = await this.request(`/projects/${projectUuid}/edit/status`, {
      method: 'GET',
    });
    return result.data.status;
  }

  async waitForCompletion(projectUuid: string): Promise<void> {
    let polls = 0;
    while (polls < CONFIG.IMAGEN_MAX_POLLS) {
      const status = await this.getEditStatus(projectUuid);
      
      if (status === 'Completed') {
        return;
      }
      
      if (status === 'Failed' || status === 'Error') {
        throw new Error(`Imagen processing failed: ${status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, CONFIG.IMAGEN_POLL_INTERVAL_MS));
      polls++;
    }
    
    throw new Error('Imagen processing timeout');
  }

  async getDownloadLinks(projectUuid: string): Promise<{ fileName: string; downloadLink: string }[]> {
    const result = await this.request(`/projects/${projectUuid}/edit/get_temporary_download_links`, {
      method: 'GET',
    });
    
    return result.data.files_list.map((f: any) => ({
      fileName: f.file_name,
      downloadLink: f.download_link,
    }));
  }

  async downloadImage(downloadLink: string): Promise<Buffer> {
    const response = await fetch(downloadLink);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.request('/profiles/', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// MAIN HDR PROCESSOR
// ============================================

export async function processWithImagen(
  images: { buffer: Buffer; filename: string }[],
  options: HDRProcessingOptions = {}
): Promise<HDRResult> {
  const startTime = Date.now();
  const apiKey = process.env.IMAGEN_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      provider: 'imagen',
      processingTimeMs: Date.now() - startTime,
      cost: 0,
      error: 'IMAGEN_API_KEY not configured',
    };
  }

  const client = new ImagenAIClient(apiKey);

  try {
    console.log(`[Imagen] Processing ${images.length} image(s)`);

    // 1. Create project
    const projectUuid = await client.createProject();
    console.log(`[Imagen] Created project: ${projectUuid}`);

    // 2. Get upload links
    const fileNames = images.map(img => img.filename);
    const uploadLinks = await client.getUploadLinks(projectUuid, fileNames);
    console.log(`[Imagen] Got ${uploadLinks.length} upload links`);

    // 3. Upload images
    for (let i = 0; i < images.length; i++) {
      await client.uploadImage(uploadLinks[i].uploadLink, images[i].buffer);
      console.log(`[Imagen] Uploaded: ${images[i].filename}`);
    }

    // 4. Start edit
    const profileKey = options.profileKey || CONFIG.PROFILES.ELEGANT_HOME_JPEG;
    await client.startEdit(projectUuid, {
      profileKey,
      hdrMerge: options.enableHDRMerge ?? (images.length > 1),
      windowPull: options.enableWindowPull ?? true,
      perspectiveCorrection: options.enablePerspective ?? true,
    });
    console.log(`[Imagen] Edit started with profile: ${profileKey}`);

    // 5. Wait for completion
    await client.waitForCompletion(projectUuid);
    console.log(`[Imagen] Processing complete`);

    // 6. Download result
    const downloadLinks = await client.getDownloadLinks(projectUuid);
    const outputBuffer = await client.downloadImage(downloadLinks[0].downloadLink);
    console.log(`[Imagen] Downloaded result: ${outputBuffer.length} bytes`);

    // Calculate cost
    let cost = CONFIG.COST_IMAGEN_BASE;
    if (options.enableHDRMerge || images.length > 1) cost += CONFIG.COST_IMAGEN_HDR;
    if (options.enableWindowPull !== false) cost += CONFIG.COST_IMAGEN_WINDOW_PULL;
    if (options.enablePerspective !== false) cost += CONFIG.COST_IMAGEN_PERSPECTIVE;

    return {
      success: true,
      outputBuffer,
      provider: 'imagen',
      processingTimeMs: Date.now() - startTime,
      windowPullApplied: options.enableWindowPull !== false,
      perspectiveCorrected: options.enablePerspective !== false,
      cost,
    };

  } catch (error: any) {
    console.error(`[Imagen] Error:`, error.message);
    return {
      success: false,
      provider: 'imagen',
      processingTimeMs: Date.now() - startTime,
      cost: 0,
      error: error.message,
    };
  }
}

// ============================================
// HDR BRACKET PROCESSOR
// ============================================

export async function processHDRBracket(
  bracket: BracketGroup,
  options: HDRProcessingOptions = {}
): Promise<HDRResult> {
  console.log(`[HDR] Processing bracket ${bracket.id} with ${bracket.images.length} images`);

  // Prepare images
  const images = bracket.images
    .filter(img => img.buffer)
    .map(img => ({
      buffer: img.buffer!,
      filename: img.filename,
    }));

  if (images.length === 0) {
    return {
      success: false,
      provider: 'local',
      processingTimeMs: 0,
      cost: 0,
      error: 'No images with buffers in bracket',
    };
  }

  // Try Imagen first
  const result = await processWithImagen(images, {
    ...options,
    enableHDRMerge: true,
  });

  if (result.success) {
    return result;
  }

  // Fallback to local processing
  console.log(`[HDR] Imagen failed, falling back to local processing`);
  return processLocalHDR(bracket, options);
}

// ============================================
// LOCAL HDR FALLBACK (Sharp.js)
// ============================================

export async function processLocalHDR(
  bracket: BracketGroup,
  options?: HDRProcessingOptions
): Promise<HDRResult> {
  const startTime = Date.now();

  try {
    // For local processing, we just enhance the middle exposure
    const middleIndex = Math.floor(bracket.images.length / 2);
    const middleImage = bracket.images[middleIndex];

    if (!middleImage.buffer) {
      throw new Error('No buffer for middle exposure');
    }

    // Apply Sharp.js enhancement
    const outputBuffer = await sharp(middleImage.buffer)
      .modulate({
        brightness: 1.05,
        saturation: 1.1,
      })
      .sharpen({ sigma: 1.0 })
      .normalize()
      .jpeg({ quality: 92 })
      .toBuffer();

    return {
      success: true,
      outputBuffer,
      provider: 'local',
      processingTimeMs: Date.now() - startTime,
      windowPullApplied: false,
      perspectiveCorrected: false,
      cost: 0,
    };

  } catch (error: any) {
    return {
      success: false,
      provider: 'local',
      processingTimeMs: Date.now() - startTime,
      cost: 0,
      error: error.message,
    };
  }
}

// ============================================
// SINGLE IMAGE ENHANCEMENT
// ============================================

export async function enhanceWithImagen(
  buffer: Buffer,
  filename: string,
  options: HDRProcessingOptions = {}
): Promise<HDRResult> {
  return processWithImagen([{ buffer, filename }], {
    ...options,
    enableHDRMerge: false,
  });
}

// ============================================
// EXPORTS
// ============================================

export { CONFIG as IMAGEN_CONFIG };

// ============================================
// HDR PROCESSOR CLASS (for compatibility)
// ============================================

export class HDRProcessor {
  private apiKey: string;
  private client: ImagenAIClient | null = null;

  constructor(config: { apiKey?: string; profileKey?: string; useImagen?: boolean; imagenApiKey?: string; imagenProfileKey?: string }) {
    this.apiKey = config.imagenApiKey || config.apiKey || process.env.IMAGEN_API_KEY || '';
    if (this.apiKey) {
      this.client = new ImagenAIClient(this.apiKey);
    }
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
    const result = await processHDRBracket(bracket, {
      enableHDRMerge: options.hdr?.enabled ?? true,
      enableWindowPull: options.windowBalance?.enabled ?? true,
      enablePerspective: options.perspective?.enabled ?? true,
      toneMapping: options.hdr?.toneMapping as any,
    });

    if (!result.success || !result.outputBuffer) {
      throw new Error(result.error || 'HDR processing failed');
    }

    return {
      buffer: result.outputBuffer,
      windowPullApplied: result.windowPullApplied || false,
      perspectiveCorrected: result.perspectiveCorrected || false,
      cost: result.cost,
    };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.client) return false;
    return this.client.isHealthy();
  }

  // Alias for compatibility - returns full HDRResult
  async processBracket(
    bracket: BracketGroup,
    options: {
      toneMapping?: string;
      enableWindowPull?: boolean;
      enablePerspective?: boolean;
    }
  ): Promise<HDRResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.processHDRBracket(bracket, {
        hdr: { enabled: true, toneMapping: options.toneMapping },
        windowBalance: { enabled: options.enableWindowPull ?? true },
        perspective: { enabled: options.enablePerspective ?? true },
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
    } catch (error: any) {
      return {
        success: false,
        provider: 'local',
        processingTimeMs: Date.now() - startTime,
        cost: 0,
        error: error.message,
      };
    }
  }
}
