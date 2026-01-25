/**
 * SnapR V3 - Input Router
 * ========================
 * 
 * Handles the first phase of V3 pipeline:
 * 1. Parse EXIF metadata from uploaded images
 * 2. Detect bracket sets (multiple exposures of same shot)
 * 3. Route to Simple or Pro pipeline based on input type
 * 
 * TWO-TRACK SYSTEM:
 * - SIMPLE MODE: Single JPEGs from agents/phone cameras → Sharp.js + FLUX
 * - PRO MODE: Bracketed RAW/JPEG from photographers → HDR merge + Window pull
 */

import ExifReader from 'exifreader';

// ============================================
// TYPES
// ============================================

export interface ImageMetadata {
  filename: string;
  filepath: string;
  buffer?: Buffer;
  
  // EXIF Data
  timestamp?: Date;
  exposureTime?: number;      // seconds (e.g., 1/125 = 0.008)
  exposureBias?: number;      // EV compensation (-2, 0, +2)
  fNumber?: number;           // aperture (e.g., 2.8, 5.6)
  iso?: number;
  focalLength?: number;
  cameraMake?: string;
  cameraModel?: string;
  
  // Calculated
  exposureValue?: number;     // EV = log2(f² / t)
  
  // Routing
  isBracket?: boolean;
  bracketGroupId?: string;
}

export interface BracketGroup {
  id: string;
  images: ImageMetadata[];
  evSpread: number;           // Total EV range (e.g., 4.0 stops)
  isValidBracket: boolean;
  reason?: string;
}

export interface RoutingResult {
  mode: 'simple' | 'pro';
  singles: ImageMetadata[];   // Single images → Simple pipeline
  brackets: BracketGroup[];   // Bracket sets → Pro pipeline
  totalImages: number;
  bracketCount: number;
  singleCount: number;
  summary: string;
}

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Bracket detection
  TIMESTAMP_WINDOW_MS: 5000,     // Images within 5 seconds = potential bracket
  MIN_BRACKET_IMAGES: 3,          // Minimum images for a valid bracket
  MAX_BRACKET_IMAGES: 9,          // Maximum images in a bracket set
  MIN_EV_SPREAD: 2.0,             // Minimum 2 stops spread to confirm bracket
  
  // Pro mode triggers
  PRO_CAMERA_MAKES: [
    'canon', 'nikon', 'sony', 'fujifilm', 'panasonic', 
    'olympus', 'leica', 'hasselblad', 'phase one'
  ],
  
  // Simple mode indicators
  PHONE_CAMERA_MAKES: [
    'apple', 'samsung', 'google', 'xiaomi', 'huawei', 
    'oneplus', 'oppo', 'vivo', 'realme'
  ],
};

// ============================================
// EXIF PARSING
// ============================================

/**
 * Parse EXIF metadata from an image buffer or file
 */
export async function parseExif(
  input: Buffer | string,
  filename: string
): Promise<ImageMetadata> {
  const metadata: ImageMetadata = {
    filename,
    filepath: typeof input === 'string' ? input : '',
  };
  
  if (Buffer.isBuffer(input)) {
    metadata.buffer = input;
  }
  
  try {
    const tags = ExifReader.load(
      Buffer.isBuffer(input) ? input : await readFileAsBuffer(input),
      { expanded: true }
    );
    
    // Extract timestamp
    if (tags.exif?.DateTimeOriginal?.description) {
      metadata.timestamp = parseExifDate(tags.exif.DateTimeOriginal.description);
    } else if (tags.exif?.DateTime?.description) {
      metadata.timestamp = parseExifDate(tags.exif.DateTime.description);
    }
    
    // Extract exposure settings
    if (tags.exif?.ExposureTime?.value) {
      const [num, denom] = tags.exif.ExposureTime.value;
      metadata.exposureTime = num / denom;
    }
    
    if (tags.exif?.ExposureBiasValue?.value) {
      const [num, denom] = tags.exif.ExposureBiasValue.value;
      metadata.exposureBias = num / denom;
    }
    
    if (tags.exif?.FNumber?.value) {
      const [num, denom] = tags.exif.FNumber.value;
      metadata.fNumber = num / denom;
    }
    
    if (tags.exif?.ISOSpeedRatings?.value) {
      metadata.iso = Array.isArray(tags.exif.ISOSpeedRatings.value) ? tags.exif.ISOSpeedRatings.value[0] : tags.exif.ISOSpeedRatings.value;
    }
    
    if (tags.exif?.FocalLength?.value) {
      const [num, denom] = tags.exif.FocalLength.value;
      metadata.focalLength = num / denom;
    }
    
    // Camera info
    if (tags.exif?.Make?.description) {
      metadata.cameraMake = tags.exif.Make.description.toLowerCase().trim();
    }
    
    if (tags.exif?.Model?.description) {
      metadata.cameraModel = tags.exif.Model.description;
    }
    
    // Calculate Exposure Value
    if (metadata.fNumber && metadata.exposureTime) {
      metadata.exposureValue = calculateEV(metadata.fNumber, metadata.exposureTime, metadata.iso);
    }
    
  } catch (error) {
    console.warn(`[InputRouter] Failed to parse EXIF for ${filename}:`, error);
  }
  
  return metadata;
}

/**
 * Parse EXIF date string to Date object
 * Format: "2024:01:15 14:30:00"
 */
function parseExifDate(dateStr: string): Date {
  const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
  return new Date(normalized);
}

/**
 * Calculate Exposure Value (EV)
 * EV = log2(f² / t) - log2(ISO/100)
 */
function calculateEV(fNumber: number, exposureTime: number, iso?: number): number {
  const baseEV = Math.log2((fNumber * fNumber) / exposureTime);
  const isoCompensation = iso ? Math.log2(iso / 100) : 0;
  return baseEV - isoCompensation;
}

/**
 * Read file as buffer (for filepath inputs)
 */
async function readFileAsBuffer(filepath: string): Promise<Buffer> {
  const fs = await import('fs/promises');
  return fs.readFile(filepath);
}

// ============================================
// BRACKET DETECTION
// ============================================

/**
 * Detect bracket groups from a set of images
 */
export function detectBrackets(images: ImageMetadata[]): {
  brackets: BracketGroup[];
  singles: ImageMetadata[];
} {
  console.log(`[InputRouter] Detecting brackets in ${images.length} images`);
  
  // Filter images with valid timestamps
  const withTimestamp = images.filter(img => img.timestamp);
  const withoutTimestamp = images.filter(img => !img.timestamp);
  
  if (withTimestamp.length === 0) {
    console.log('[InputRouter] No EXIF timestamps found, treating all as singles');
    return { brackets: [], singles: images };
  }
  
  // Sort by timestamp
  const sorted = [...withTimestamp].sort((a, b) => 
    a.timestamp!.getTime() - b.timestamp!.getTime()
  );
  
  // Group by timestamp proximity
  const groups: ImageMetadata[][] = [];
  let currentGroup: ImageMetadata[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const timeDiff = sorted[i].timestamp!.getTime() - sorted[i - 1].timestamp!.getTime();
    
    if (timeDiff <= CONFIG.TIMESTAMP_WINDOW_MS) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);
  
  // Validate bracket groups
  const brackets: BracketGroup[] = [];
  const singles: ImageMetadata[] = [...withoutTimestamp];
  
  for (const group of groups) {
    if (group.length >= CONFIG.MIN_BRACKET_IMAGES && group.length <= CONFIG.MAX_BRACKET_IMAGES) {
      const bracketResult = validateBracketGroup(group);
      
      if (bracketResult.isValidBracket) {
        brackets.push(bracketResult);
        group.forEach(img => {
          img.isBracket = true;
          img.bracketGroupId = bracketResult.id;
        });
      } else {
        // Not a valid bracket, treat as singles
        singles.push(...group);
      }
    } else {
      // Too few or too many images for a bracket
      singles.push(...group);
    }
  }
  
  console.log(`[InputRouter] Found ${brackets.length} bracket sets, ${singles.length} singles`);
  
  return { brackets, singles };
}

/**
 * Validate a potential bracket group
 * Checks for varying exposure values
 */
function validateBracketGroup(images: ImageMetadata[]): BracketGroup {
  const id = `bracket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Get exposure values
  const evValues = images
    .map(img => img.exposureValue ?? img.exposureBias ?? null)
    .filter((ev): ev is number => ev !== null);
  
  if (evValues.length < CONFIG.MIN_BRACKET_IMAGES) {
    return {
      id,
      images,
      evSpread: 0,
      isValidBracket: false,
      reason: 'Insufficient exposure data',
    };
  }
  
  // Calculate EV spread
  const minEV = Math.min(...evValues);
  const maxEV = Math.max(...evValues);
  const evSpread = maxEV - minEV;
  
  // Check for varying exposures
  const uniqueEVs = new Set(evValues.map(ev => Math.round(ev * 10) / 10));
  
  if (uniqueEVs.size < CONFIG.MIN_BRACKET_IMAGES) {
    return {
      id,
      images,
      evSpread,
      isValidBracket: false,
      reason: `Only ${uniqueEVs.size} unique exposure values`,
    };
  }
  
  if (evSpread < CONFIG.MIN_EV_SPREAD) {
    return {
      id,
      images,
      evSpread,
      isValidBracket: false,
      reason: `EV spread ${evSpread.toFixed(1)} below minimum ${CONFIG.MIN_EV_SPREAD}`,
    };
  }
  
  // Valid bracket!
  return {
    id,
    images: images.sort((a, b) => (a.exposureValue ?? 0) - (b.exposureValue ?? 0)),
    evSpread,
    isValidBracket: true,
  };
}

// ============================================
// PIPELINE ROUTING
// ============================================

/**
 * Route images to Simple or Pro pipeline
 */
export function routeImages(images: ImageMetadata[]): RoutingResult {
  console.log(`[InputRouter] Routing ${images.length} images`);
  
  // Detect brackets
  const { brackets, singles } = detectBrackets(images);
  
  // Determine mode
  const hasBrackets = brackets.length > 0;
  const hasProCamera = images.some(img => 
    img.cameraMake && CONFIG.PRO_CAMERA_MAKES.some(make => 
      img.cameraMake!.includes(make)
    )
  );
  
  const mode: 'simple' | 'pro' = hasBrackets ? 'pro' : 'simple';
  
  // Build summary
  let summary = '';
  if (mode === 'pro') {
    summary = `Pro Mode: ${brackets.length} bracket set(s) detected with ${brackets.reduce((sum, b) => sum + b.images.length, 0)} images. `;
    summary += `${singles.length} single image(s). `;
    summary += `HDR merge + window pull will be applied.`;
  } else {
    summary = `Simple Mode: ${singles.length} single image(s). `;
    if (hasProCamera) {
      summary += `Professional camera detected but no brackets found. `;
    }
    summary += `Basic enhancement + creative tools will be applied.`;
  }
  
  console.log(`[InputRouter] ${summary}`);
  
  return {
    mode,
    singles,
    brackets,
    totalImages: images.length,
    bracketCount: brackets.length,
    singleCount: singles.length,
    summary,
  };
}

// ============================================
// BATCH PROCESSING HELPER
// ============================================

/**
 * Parse EXIF and route a batch of images
 */
export async function processUploadBatch(
  files: Array<{ buffer: Buffer; filename: string } | { filepath: string; filename: string }>
): Promise<RoutingResult> {
  console.log(`[InputRouter] Processing batch of ${files.length} files`);
  
  // Parse EXIF for all files
  const metadataPromises = files.map(file => {
    if ('buffer' in file) {
      return parseExif(file.buffer, file.filename);
    } else {
      return parseExif(file.filepath, file.filename);
    }
  });
  
  const images = await Promise.all(metadataPromises);
  
  // Route to appropriate pipeline
  return routeImages(images);
}

// ============================================
// EXPORTS
// ============================================

export default {
  parseExif,
  detectBrackets,
  routeImages,
  processUploadBatch,
  CONFIG,
};
