/**
 * SnapR V3 - SAM Masks Provider
 * ==============================
 * 
 * Integrates Meta's Segment Anything Model (SAM 2) for precise mask generation.
 * Used for:
 * - Window detection (for exposure balancing)
 * - Sky segmentation (for replacement)
 * - Lawn segmentation (for enhancement)
 * - Floor detection (for virtual staging)
 * 
 * Provider: Replicate (schananas/grounded_sam)
 * Cost: ~$0.01/mask
 */

import Replicate from 'replicate';
import { deflateSync } from 'node:zlib';
import { enqueueReplicate } from './replicate-queue';

let sharpModule: any = null;

async function getSharp() {
  if (!sharpModule) {
    sharpModule = await import('sharp');
  }
  return sharpModule.default ?? sharpModule;
}

// ============================================
// TYPES
// ============================================

export type MaskType = 'window' | 'sky' | 'lawn' | 'floor' | 'pool' | 'custom';

export interface Point {
  x: number;
  y: number;
  label: 0 | 1; // 0 = negative (exclude), 1 = positive (include)
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MaskRequest {
  imageUrl: string;
  imageBuffer?: Buffer;
  maskType: MaskType;
  points?: Point[];
  box?: BoundingBox;
}

export interface MaskResult {
  success: boolean;
  maskBuffer?: Buffer;
  maskUrl?: string;
  confidence: number;
  boundingBox?: BoundingBox;
  area: number; // Percentage of image covered (0-100)
  processingTimeMs: number;
  cost: number;
  error?: string;
}

export interface DetectionStrategy {
  positivePoints: (width: number, height: number, imageData?: Buffer) => Point[];
  negativePoints: (width: number, height: number) => Point[];
  box?: (width: number, height: number) => BoundingBox;
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Replicate model (override with AI_SAM_MODEL; comma-separated candidates supported)
  SAM_MODEL: process.env.AI_SAM_MODEL || 'schananas/grounded_sam:ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a3ab9ebc21c',
  REPLICATE_TIMEOUT_MS: 30000,
  REPLICATE_MIN_INTERVAL_MS: Number(process.env.REPLICATE_MIN_INTERVAL_MS || 12000),
  
  // Cost
  COST_PER_MASK: 0.01,
  
  // Detection thresholds
  WINDOW_BRIGHTNESS_THRESHOLD: 230,
  SKY_REGION_RATIO: 0.15, // Top 15% of image for sky sampling
  LAWN_GREEN_THRESHOLD: 0.6, // Green channel dominance

  // Heuristic lawn mask fallback (used if SAM fails)
  LAWN_MASK_REGION_START: Number(process.env.AI_LAWN_MASK_REGION_START || 0.72), // bottom 28%
  LAWN_MASK_SIDE_MARGIN: Number(process.env.AI_LAWN_MASK_SIDE_MARGIN || 0.12), // trim 12% each side
  LAWN_MASK_MIN_GREEN_RATIO: Number(process.env.AI_LAWN_MASK_MIN_GREEN_RATIO || 1.15),
  LAWN_MASK_MIN_BRIGHTNESS: Number(process.env.AI_LAWN_MASK_MIN_BRIGHTNESS || 40),
};

// ============================================
// DETECTION STRATEGIES
// ============================================

/**
 * Detection strategies for different mask types
 * Each strategy defines how to sample points for SAM
 */
export const DETECTION_STRATEGIES: Record<MaskType, DetectionStrategy> = {
  window: {
    positivePoints: (width, height, imageData) => {
      // Find bright rectangular areas (windows are typically bright)
      // This is a simplified heuristic - in production, use ML detection
      const points: Point[] = [];
      
      // Sample interior region (windows usually in middle/upper area)
      const regions = [
        { x: 0.25, y: 0.3 },  // Upper left
        { x: 0.75, y: 0.3 },  // Upper right
        { x: 0.5, y: 0.4 },   // Center upper
        { x: 0.25, y: 0.6 },  // Mid left
        { x: 0.75, y: 0.6 },  // Mid right
      ];
      
      for (const r of regions) {
        points.push({
          x: Math.round(width * r.x),
          y: Math.round(height * r.y),
          label: 1,
        });
      }
      
      return points;
    },
    negativePoints: (width, height) => [
      // Exclude corners and floor
      { x: 10, y: 10, label: 0 },
      { x: width - 10, y: 10, label: 0 },
      { x: Math.round(width * 0.5), y: height - 20, label: 0 },
    ],
  },
  
  sky: {
    positivePoints: (width, height) => {
      // Sample top portion of image
      const points: Point[] = [];
      const skyRegion = height * CONFIG.SKY_REGION_RATIO;
      
      // Grid sample the sky region
      for (let x = 0.1; x <= 0.9; x += 0.2) {
        for (let y = 0.05; y <= 0.12; y += 0.04) {
          points.push({
            x: Math.round(width * x),
            y: Math.round(height * y),
            label: 1,
          });
        }
      }
      
      return points;
    },
    negativePoints: (width, height) => [
      // Exclude bottom portion (buildings, ground)
      { x: Math.round(width * 0.5), y: Math.round(height * 0.7), label: 0 },
      { x: Math.round(width * 0.25), y: Math.round(height * 0.85), label: 0 },
      { x: Math.round(width * 0.75), y: Math.round(height * 0.85), label: 0 },
    ],
  },
  
  lawn: {
    positivePoints: (width, height) => {
      // Sample lower portion of image (grass/lawn area)
      const points: Point[] = [];
      
      // Bottom third, avoiding edges
      for (let x = 0.2; x <= 0.8; x += 0.2) {
        for (let y = 0.7; y <= 0.9; y += 0.1) {
          points.push({
            x: Math.round(width * x),
            y: Math.round(height * y),
            label: 1,
          });
        }
      }
      
      return points;
    },
    negativePoints: (width, height) => [
      // Exclude sky and building
      { x: Math.round(width * 0.5), y: Math.round(height * 0.1), label: 0 },
      { x: Math.round(width * 0.5), y: Math.round(height * 0.4), label: 0 },
    ],
  },
  
  floor: {
    positivePoints: (width, height) => {
      // Sample bottom center area
      const points: Point[] = [];
      
      for (let x = 0.3; x <= 0.7; x += 0.2) {
        points.push({
          x: Math.round(width * x),
          y: Math.round(height * 0.85),
          label: 1,
        });
      }
      
      return points;
    },
    negativePoints: (width, height) => [
      // Exclude walls and ceiling
      { x: Math.round(width * 0.5), y: Math.round(height * 0.2), label: 0 },
      { x: 10, y: Math.round(height * 0.5), label: 0 },
      { x: width - 10, y: Math.round(height * 0.5), label: 0 },
    ],
  },
  
  pool: {
    positivePoints: (width, height) => {
      // Sample center-bottom area where pools typically are
      return [
        { x: Math.round(width * 0.5), y: Math.round(height * 0.6), label: 1 },
        { x: Math.round(width * 0.4), y: Math.round(height * 0.7), label: 1 },
        { x: Math.round(width * 0.6), y: Math.round(height * 0.7), label: 1 },
      ];
    },
    negativePoints: (width, height) => [
      { x: Math.round(width * 0.5), y: Math.round(height * 0.1), label: 0 },
      { x: 10, y: 10, label: 0 },
    ],
  },
  
  custom: {
    positivePoints: () => [],
    negativePoints: () => [],
  },
};

const MASK_TEXT_PROMPTS: Record<MaskType, string> = {
  sky: 'sky',
  lawn: 'grass, lawn',
  window: 'window, windows',
  pool: 'pool, swimming pool, water',
  floor: 'floor, ground',
  custom: 'object',
};

// ============================================
// SAM MASKS CLIENT
// ============================================

export class SAMMasksClient {
  private replicate: Replicate;
  private static resolvedModel: string | null = null;
  private static badModels = new Set<string>();
  private static resolvedVersions = new Map<string, string>();
  
  constructor(apiToken?: string) {
    this.replicate = new Replicate({
      auth: apiToken || process.env.REPLICATE_API_TOKEN!,
    });
  }

  private getModelCandidates(): string[] {
    if (SAMMasksClient.resolvedModel) {
      return [SAMMasksClient.resolvedModel];
    }
    const fromEnv = CONFIG.SAM_MODEL
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);
    const defaults = [
      'meta/sam-2-image',
      'schananas/grounded_sam:ee871c19efb1941f55f66a3d7d960428c8a5afcb77449547fe8e5a3ab9ebc21c',
    ];
    const all = Array.from(new Set([...fromEnv, ...defaults]))
      .filter((model) => !SAMMasksClient.badModels.has(model))
      .filter((model) => model !== 'schananas/grounded_sam')
      .filter((model) => model !== 'meta/sam-2-image:latest');
    const filtered = all.filter((model) => {
      if (model.includes('grounded_sam:')) return true;
      if (model.includes('sam-2-image')) return true;
      if (!model.includes('grounded_sam')) return model.includes(':');
      return false;
    });
    if (filtered.length === 0) {
      return defaults;
    }
    // Prefer SAM2 points model first, then grounded_sam
    return filtered.sort((a, b) => {
      if (a.includes('sam-2-image') && !b.includes('sam-2-image')) return -1;
      if (b.includes('sam-2-image') && !a.includes('sam-2-image')) return 1;
      if (a.includes('grounded_sam')) return -1;
      if (b.includes('grounded_sam')) return 1;
      return 0;
    });
  }

  private async enqueueReplicate<T>(fn: () => Promise<T>): Promise<T> {
    return enqueueReplicate(fn, CONFIG.REPLICATE_MIN_INTERVAL_MS);
  }

  private async resolveModelVersion(model: string): Promise<string> {
    if (model.includes(':')) {
      return model;
    }
    if (SAMMasksClient.resolvedVersions.has(model)) {
      return SAMMasksClient.resolvedVersions.get(model)!;
    }
    if (!model.includes('sam-2-image')) {
      return model;
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return model;
    }

    try {
      const response = await fetch(`https://api.replicate.com/v1/models/${model}`, {
        headers: { Authorization: `Token ${apiToken}` },
      });
      if (!response.ok) {
        return model;
      }
      const data = await response.json();
      const versionId = data?.latest_version?.id;
      if (!versionId) {
        return model;
      }
      const resolved = `${model}:${versionId}`;
      SAMMasksClient.resolvedVersions.set(model, resolved);
      return resolved;
    } catch {
      return model;
    }
  }
  
  /**
   * Generate a mask using SAM 2
   */
  async generateMask(request: MaskRequest): Promise<MaskResult> {
    const startTime = Date.now();
    
    console.log(`[SAM] Generating ${request.maskType} mask`);
    console.log(`[SAM] Model candidates: ${this.getModelCandidates().join(', ')}`);
    
    try {
      // Get image dimensions
      let imageUrl = request.imageUrl;
      let width = 1024;
      let height = 768;
      
      if (request.imageBuffer) {
        const sharp = await getSharp();
        const metadata = await sharp(request.imageBuffer).metadata();
        width = metadata.width || 1024;
        height = metadata.height || 768;
        
        // Upload buffer to temporary URL if needed
        // In production, use your own upload service
        // For now, assume imageUrl is provided
      }
      
      // Get detection strategy
      const strategy = DETECTION_STRATEGIES[request.maskType];
      const lawnBox =
        request.maskType === 'lawn' && !request.box
          ? {
              x1: Math.round(width * CONFIG.LAWN_MASK_SIDE_MARGIN),
              y1: Math.round(height * CONFIG.LAWN_MASK_REGION_START),
              x2: Math.max(
                Math.round(width * (1 - CONFIG.LAWN_MASK_SIDE_MARGIN)) - 1,
                0
              ),
              y2: height - 1,
            }
          : undefined;
      const effectiveBox = request.box || lawnBox;
      
      // Generate points
      const positivePoints = request.points?.filter(p => p.label === 1) || 
        strategy.positivePoints(width, height, request.imageBuffer);
      const negativePoints = request.points?.filter(p => p.label === 0) ||
        strategy.negativePoints(width, height);
      
      const allPoints = [...positivePoints, ...negativePoints];
      
      if (allPoints.length === 0) {
        throw new Error('No points provided for mask generation');
      }
      
      // Format points for SAM
      const pointCoords = allPoints.map(p => [p.x, p.y]);
      const pointLabels = allPoints.map(p => p.label);
      
      // Call SAM model (try candidates)
      let output: any;
      let lastError: any;
      let resolvedMaskUrl: string | null = null;
      for (const model of this.getModelCandidates()) {
        try {
          const resolvedModel = await this.resolveModelVersion(model);
          if (resolvedModel.includes('grounded_sam')) {
            const maskPrompt = MASK_TEXT_PROMPTS[request.maskType] || MASK_TEXT_PROMPTS.custom;
            console.log(`[SAM] Using grounded_sam prompt: ${maskPrompt}`);
            output = await this.enqueueReplicate(() =>
              this.replicate.run(resolvedModel as `${string}/${string}`, {
                input: {
                  image: imageUrl,
                  mask_prompt: maskPrompt,
                },
              })
            );
          } else {
            console.log(`[SAM] Using SAM points model: ${resolvedModel}`);
            output = await this.enqueueReplicate(() =>
              this.replicate.run(resolvedModel as `${string}/${string}`, {
                input: {
                  image: imageUrl,
                  point_coords: pointCoords,
                  point_labels: pointLabels,
                  ...(effectiveBox && {
                    box: [effectiveBox.x1, effectiveBox.y1, effectiveBox.x2, effectiveBox.y2],
                  }),
                },
              })
            );
          }
          const candidateMaskUrl = extractMaskUrl(output);
          if (!candidateMaskUrl) {
            if (output && typeof output === 'object') {
              console.warn(`[SAM] ${resolvedModel} output keys:`, Object.keys(output));
            }
            lastError = new Error('SAM returned invalid output');
            continue;
          }
          resolvedMaskUrl = candidateMaskUrl;
          SAMMasksClient.resolvedModel = resolvedModel;
          break;
        } catch (error: any) {
          lastError = error;
          const message = error?.message || '';
          console.warn(`[SAM] Model failed: ${model} (${message})`);
          if (
            message.includes('does not exist') ||
            message.includes('Not Found') ||
            message.includes('requested resource could not be found')
          ) {
            SAMMasksClient.badModels.add(model);
            continue;
          }
          if (message.includes('not permitted')) {
            SAMMasksClient.badModels.add(model);
            throw error;
          }
          if (
            message.includes('cannot reshape tensor') ||
            message.includes('Invalid') ||
            message.includes('Unprocessable Entity')
          ) {
            SAMMasksClient.badModels.add(model);
            continue;
          }
          continue;
        }
      }
      if (!output || !resolvedMaskUrl) {
        // For lawn masks, fall back to a deterministic heuristic mask
        if (request.maskType === 'lawn') {
          console.warn('[SAM] Falling back to heuristic lawn mask');
          const fallback = await generateDeterministicLawnMask(request.imageUrl);
          if (fallback.success && fallback.maskUrl) {
            return fallback;
          }
          if (fallback.error) {
            lastError = new Error(fallback.error);
          }
        }
        if (!output) {
          throw lastError || new Error('SAM model unavailable');
        }
        if (!resolvedMaskUrl) {
          throw lastError || new Error('SAM returned invalid output');
        }
      }
      
      // Download mask
      const maskResponse = await fetch(resolvedMaskUrl);
      const maskArrayBuffer = await maskResponse.arrayBuffer();
      const maskBuffer = Buffer.from(maskArrayBuffer);
      
      // Analyze mask coverage
      const { area, boundingBox } = await analyzeMask(maskBuffer);
      
      return {
        success: true,
        maskBuffer,
        maskUrl: resolvedMaskUrl,
        confidence: 0.85, // SAM typically high confidence
        boundingBox,
        area,
        processingTimeMs: Date.now() - startTime,
        cost: CONFIG.COST_PER_MASK,
      };
      
    } catch (error) {
      console.error(`[SAM] Mask generation failed:`, error);
      
      return {
        success: false,
        confidence: 0,
        area: 0,
        processingTimeMs: Date.now() - startTime,
        cost: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Generate multiple masks for an image
   */
  async generateMultipleMasks(
    imageUrl: string,
    maskTypes: MaskType[]
  ): Promise<Map<MaskType, MaskResult>> {
    const results = new Map<MaskType, MaskResult>();
    
    // Process masks sequentially to avoid rate limits
    for (const maskType of maskTypes) {
      const result = await this.generateMask({ imageUrl, maskType });
      results.set(maskType, result);
    }
    
    return results;
  }
  
  /**
   * Detect which masks are needed for an image based on analysis
   */
  async detectNeededMasks(
    imageUrl: string,
    analysis: {
      hasSky?: boolean;
      hasLawn?: boolean;
      hasPool?: boolean;
      hasWindows?: boolean;
      isEmpty?: boolean;
    }
  ): Promise<MaskType[]> {
    const needed: MaskType[] = [];
    
    if (analysis.hasSky) needed.push('sky');
    if (analysis.hasLawn) needed.push('lawn');
    if (analysis.hasPool) needed.push('pool');
    if (analysis.hasWindows) needed.push('window');
    if (analysis.isEmpty) needed.push('floor');
    
    return needed;
  }
}

function extractMaskUrl(output: any): string | null {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const url = extractMaskUrl(item);
      if (url) return url;
    }
    return null;
  }
  if (typeof output.url === 'function') return output.url();
  if (output.mask) return extractMaskUrl(output.mask);
  if (output.masks) return extractMaskUrl(output.masks);
  if (output.mask_url) return extractMaskUrl(output.mask_url);
  if (output.mask_image) return extractMaskUrl(output.mask_image);
  if (output.segmentation) return extractMaskUrl(output.segmentation);
  if (output.segmentation_mask) return extractMaskUrl(output.segmentation_mask);
  if (output.mask_png) return extractMaskUrl(output.mask_png);
  if (output.png) return extractMaskUrl(output.png);
  if (output.output) return extractMaskUrl(output.output);
  return null;
}

// ============================================
// LAWN MASK HEURISTIC FALLBACK
// ============================================

async function downloadImageBuffer(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadMaskToSupabase(maskBuffer: Buffer): Promise<string | null> {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  const path = `masks/lawn-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/raw-images/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      'x-upsert': 'true',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: maskBuffer as unknown as BodyInit,
  });
  if (!uploadRes.ok) {
    return null;
  }

  const signRes = await fetch(`${supabaseUrl}/storage/v1/object/sign/raw-images/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!signRes.ok) {
    return null;
  }

  const signed = await signRes.json();
  const signedUrl = signed?.signedURL || signed?.signedUrl;
  if (!signedUrl) return null;
  if (signedUrl.startsWith('http')) return signedUrl;
  if (signedUrl.startsWith('/storage/v1/')) return `${supabaseUrl}${signedUrl}`;
  if (signedUrl.startsWith('/object/')) return `${supabaseUrl}/storage/v1${signedUrl}`;
  return `${supabaseUrl}${signedUrl.startsWith('/') ? '' : '/'}${signedUrl}`;
}

export async function generateDeterministicLawnMask(
  imageUrl: string
): Promise<MaskResult> {
  const startTime = Date.now();
  try {
    const imageBuffer = await downloadImageBuffer(imageUrl);
    const size = getImageDimensions(imageBuffer);
    const width = size?.width || 1024;
    const height = size?.height || 768;
    const yStart = Math.floor(height * CONFIG.LAWN_MASK_REGION_START);
    const xStart = Math.floor(width * CONFIG.LAWN_MASK_SIDE_MARGIN);
    const xEnd = Math.max(Math.floor(width * (1 - CONFIG.LAWN_MASK_SIDE_MARGIN)) - 1, 0);

    const maskBuffer = buildRectMaskPng(width, height, xStart, xEnd, yStart);
    const maskUrl = await uploadMaskToSupabase(maskBuffer);
    if (!maskUrl) {
      return {
        success: false,
        confidence: 0,
        area: 0,
        processingTimeMs: Date.now() - startTime,
        cost: 0,
        error: 'Failed to upload heuristic lawn mask',
      };
    }

    const area = ((height - yStart) / height) * ((xEnd - xStart + 1) / width) * 100;
    return {
      success: true,
      maskBuffer,
      maskUrl,
      confidence: 0.8,
      boundingBox: {
        x1: xStart,
        y1: yStart,
        x2: xEnd,
        y2: height - 1,
      },
      area,
      processingTimeMs: Date.now() - startTime,
      cost: 0,
    };
  } catch (error: any) {
    return {
      success: false,
      confidence: 0,
      area: 0,
      processingTimeMs: Date.now() - startTime,
      cost: 0,
      error: error?.message || 'Heuristic lawn mask failed',
    };
  }
}

function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  // PNG signature
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }
  // JPEG markers
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      const size = buffer.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      offset += 2 + size;
    }
  }
  return null;
}

function buildRectMaskPng(
  width: number,
  height: number,
  xStart: number,
  xEnd: number,
  yStart: number
): Buffer {
  const rowSize = 1 + width * 4; // filter byte + RGBA
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // no filter
    const onRow = y >= yStart;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + 1 + x * 4;
      const on = onRow && x >= xStart && x <= xEnd;
      const v = on ? 255 : 0;
      raw[idx] = v;
      raw[idx + 1] = v;
      raw[idx + 2] = v;
      raw[idx + 3] = 255;
    }
  }

  const idat = deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', idat),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

// ============================================
// MASK ANALYSIS HELPERS
// ============================================

/**
 * Analyze a mask to get coverage and bounding box
 */
async function analyzeMask(maskBuffer: Buffer): Promise<{
  area: number;
  boundingBox: BoundingBox;
}> {
  const sharp = await getSharp();
  const { data, info } = await sharp(maskBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const width = info.width;
  const height = info.height;
  const totalPixels = width * height;
  
  let whitePixels = 0;
  let minX = width, maxX = 0;
  let minY = height, maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = data[y * width + x];
      
      if (pixel > 128) { // White (masked) pixel
        whitePixels++;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  const area = (whitePixels / totalPixels) * 100;
  
  return {
    area,
    boundingBox: {
      x1: minX,
      y1: minY,
      x2: maxX,
      y2: maxY,
    },
  };
}

/**
 * Composite a mask onto an image for visualization
 */
export async function visualizeMask(
  imageBuffer: Buffer,
  maskBuffer: Buffer,
  color: { r: number; g: number; b: number } = { r: 255, g: 0, b: 0 },
  opacity: number = 0.5
): Promise<Buffer> {
  // Create colored overlay from mask
  const sharp = await getSharp();
  const overlay = await sharp(maskBuffer)
    .ensureAlpha()
    .tint(color)
    .composite([{
      input: maskBuffer,
      blend: 'dest-in',
    }])
    .toBuffer();
  
  // Composite onto original image
  return sharp(imageBuffer)
    .composite([{
      input: overlay,
      blend: 'over',
    }])
    .jpeg()
    .toBuffer();
}

/**
 * Apply a mask to blend two images
 * Useful for window pull: blend dark exposure into windows
 */
export async function applyMaskBlend(
  baseImage: Buffer,
  overlayImage: Buffer,
  mask: Buffer
): Promise<Buffer> {
  // Resize overlay to match base
  const sharp = await getSharp();
  const baseMetadata = await sharp(baseImage).metadata();
  
  const resizedOverlay = await sharp(overlayImage)
    .resize(baseMetadata.width, baseMetadata.height)
    .toBuffer();
  
  const resizedMask = await sharp(mask)
    .resize(baseMetadata.width, baseMetadata.height)
    .toBuffer();
  
  // Composite using mask
  return sharp(baseImage)
    .composite([{
      input: resizedOverlay,
      blend: 'over',
    }])
    .composite([{
      input: resizedMask,
      blend: 'dest-in',
    }])
    .jpeg()
    .toBuffer();
}

// ============================================
// EXPORTS
// ============================================

export default {
  SAMMasksClient,
  DETECTION_STRATEGIES,
  visualizeMask,
  applyMaskBlend,
  CONFIG,
};
