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
 * Provider: Replicate (meta/sam-2-image)
 * Cost: ~$0.01/mask
 */

import Replicate from 'replicate';
import sharp from 'sharp';

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
  // Replicate model
  SAM_MODEL: 'meta/sam-2-image:fe97b453f2d78d5f8e4064566688f2e08f4b8db0d82e898de8e2e0adda2c85b6',
  REPLICATE_TIMEOUT_MS: 30000,
  
  // Cost
  COST_PER_MASK: 0.01,
  
  // Detection thresholds
  WINDOW_BRIGHTNESS_THRESHOLD: 230,
  SKY_REGION_RATIO: 0.15, // Top 15% of image for sky sampling
  LAWN_GREEN_THRESHOLD: 0.6, // Green channel dominance
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

// ============================================
// SAM MASKS CLIENT
// ============================================

export class SAMMasksClient {
  private replicate: Replicate;
  
  constructor(apiToken?: string) {
    this.replicate = new Replicate({
      auth: apiToken || process.env.REPLICATE_API_TOKEN!,
    });
  }
  
  /**
   * Generate a mask using SAM 2
   */
  async generateMask(request: MaskRequest): Promise<MaskResult> {
    const startTime = Date.now();
    
    console.log(`[SAM] Generating ${request.maskType} mask`);
    
    try {
      // Get image dimensions
      let imageUrl = request.imageUrl;
      let width = 1024;
      let height = 768;
      
      if (request.imageBuffer) {
        const metadata = await sharp(request.imageBuffer).metadata();
        width = metadata.width || 1024;
        height = metadata.height || 768;
        
        // Upload buffer to temporary URL if needed
        // In production, use your own upload service
        // For now, assume imageUrl is provided
      }
      
      // Get detection strategy
      const strategy = DETECTION_STRATEGIES[request.maskType];
      
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
      
      // Call SAM model
      const output = await this.replicate.run(CONFIG.SAM_MODEL as `${string}/${string}`, {
        input: {
          image: imageUrl,
          point_coords: pointCoords,
          point_labels: pointLabels,
          ...(request.box && {
            box: [request.box.x1, request.box.y1, request.box.x2, request.box.y2],
          }),
        },
      });
      
      // Process output
      const maskUrl = Array.isArray(output) ? output[0] : output;
      
      if (!maskUrl || typeof maskUrl !== 'string') {
        throw new Error('SAM returned invalid output');
      }
      
      // Download mask
      const maskResponse = await fetch(maskUrl);
      const maskArrayBuffer = await maskResponse.arrayBuffer();
      const maskBuffer = Buffer.from(maskArrayBuffer);
      
      // Analyze mask coverage
      const { area, boundingBox } = await analyzeMask(maskBuffer);
      
      return {
        success: true,
        maskBuffer,
        maskUrl,
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
