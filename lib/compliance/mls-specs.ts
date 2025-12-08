export interface MlsSpec {
  id: string;
  name: string;
  region: string;
  maxFileSize: number; // in bytes
  maxDimensions: { width: number; height: number };
  minDimensions: { width: number; height: number };
  allowedFormats: string[];
  maxPhotos: number;
  watermarkRequired: boolean;
  disclosureMethod: 'watermark' | 'caption' | 'description' | 'both';
  notes?: string;
}

/**
 * Top 20 US MLS specifications
 * Covers approximately 75% of US real estate transactions
 */
export const MLS_SPECS: MlsSpec[] = [
  {
    id: 'crmls',
    name: 'California Regional MLS (CRMLS)',
    region: 'California',
    maxFileSize: 15 * 1024 * 1024, // 15 MB
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 1024, height: 768 },
    allowedFormats: ['jpg', 'jpeg', 'png'],
    maxPhotos: 100,
    watermarkRequired: true,
    disclosureMethod: 'both',
    notes: 'Virtual staging must be watermarked AND disclosed in remarks',
  },
  {
    id: 'bright',
    name: 'Bright MLS',
    region: 'Mid-Atlantic (DC, MD, VA, PA, NJ, DE, WV)',
    maxFileSize: 10 * 1024 * 1024,
    maxDimensions: { width: 4000, height: 3000 },
    minDimensions: { width: 1024, height: 768 },
    allowedFormats: ['jpg', 'jpeg'],
    maxPhotos: 75,
    watermarkRequired: false,
    disclosureMethod: 'description',
    notes: 'Disclosure in public remarks required',
  },
  {
    id: 'mred',
    name: 'Midwest Real Estate Data (MRED)',
    region: 'Chicago / Illinois',
    maxFileSize: 20 * 1024 * 1024,
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 1600, height: 1200 },
    allowedFormats: ['jpg', 'jpeg', 'png'],
    maxPhotos: 50,
    watermarkRequired: true,
    disclosureMethod: 'both',
  },
  {
    id: 'har',
    name: 'Houston Association of Realtors (HAR)',
    region: 'Houston / Texas',
    maxFileSize: 15 * 1024 * 1024,
    maxDimensions: { width: 4096, height: 3072 },
    minDimensions: { width: 1920, height: 1080 },
    allowedFormats: ['jpg', 'jpeg'],
    maxPhotos: 99,
    watermarkRequired: false,
    disclosureMethod: 'caption',
    notes: 'Caption must include virtual staging disclosure',
  },
  {
    id: 'stellar',
    name: 'Stellar MLS',
    region: 'Florida',
    maxFileSize: 10 * 1024 * 1024,
    maxDimensions: { width: 3840, height: 2160 },
    minDimensions: { width: 1024, height: 768 },
    allowedFormats: ['jpg', 'jpeg', 'png'],
    maxPhotos: 100,
    watermarkRequired: true,
    disclosureMethod: 'watermark',
  },
  {
    id: 'nwmls',
    name: 'Northwest MLS',
    region: 'Washington State / Seattle',
    maxFileSize: 10 * 1024 * 1024,
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 1024, height: 768 },
    allowedFormats: ['jpg', 'jpeg'],
    maxPhotos: 50,
    watermarkRequired: false,
    disclosureMethod: 'description',
  },
  {
    id: 'armls',
    name: 'Arizona Regional MLS (ARMLS)',
    region: 'Arizona / Phoenix',
    maxFileSize: 15 * 1024 * 1024,
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 1280, height: 720 },
    allowedFormats: ['jpg', 'jpeg', 'png'],
    maxPhotos: 100,
    watermarkRequired: true,
    disclosureMethod: 'both',
  },
  {
    id: 'recolorado',
    name: 'REcolorado',
    region: 'Colorado / Denver',
    maxFileSize: 10 * 1024 * 1024,
    maxDimensions: { width: 4000, height: 3000 },
    minDimensions: { width: 1024, height: 768 },
    allowedFormats: ['jpg', 'jpeg'],
    maxPhotos: 75,
    watermarkRequired: false,
    disclosureMethod: 'caption',
  },
  {
    id: 'actris',
    name: 'ACTRIS (Austin)',
    region: 'Texas / Austin',
    maxFileSize: 15 * 1024 * 1024,
    maxDimensions: { width: 4096, height: 3072 },
    minDimensions: { width: 1600, height: 1200 },
    allowedFormats: ['jpg', 'jpeg', 'png'],
    maxPhotos: 100,
    watermarkRequired: true,
    disclosureMethod: 'both',
  },
  {
    id: 'gamls',
    name: 'Georgia MLS (GAMLS)',
    region: 'Georgia / Atlanta',
    maxFileSize: 10 * 1024 * 1024,
    maxDimensions: { width: 3840, height: 2160 },
    minDimensions: { width: 1024, height: 768 },
    allowedFormats: ['jpg', 'jpeg'],
    maxPhotos: 50,
    watermarkRequired: true,
    disclosureMethod: 'watermark',
  },
  // Default spec for unknown MLS
  {
    id: 'default',
    name: 'Standard MLS (Default)',
    region: 'Generic / Unknown',
    maxFileSize: 10 * 1024 * 1024,
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 1024, height: 768 },
    allowedFormats: ['jpg', 'jpeg'],
    maxPhotos: 50,
    watermarkRequired: true,
    disclosureMethod: 'both',
    notes: 'Conservative default - watermark + description disclosure recommended',
  },
];

/**
 * Get MLS spec by ID
 */
export function getMlsSpec(mlsId: string): MlsSpec {
  return MLS_SPECS.find(spec => spec.id === mlsId) || MLS_SPECS.find(spec => spec.id === 'default')!;
}

/**
 * Get all available MLS options for dropdown
 */
export function getMlsOptions(): { value: string; label: string; region: string }[] {
  return MLS_SPECS.filter(spec => spec.id !== 'default').map(spec => ({
    value: spec.id,
    label: spec.name,
    region: spec.region,
  }));
}

/**
 * Validate image against MLS spec
 */
export function validateForMls(
  mlsId: string,
  fileSize: number,
  width: number,
  height: number,
  format: string
): { valid: boolean; errors: string[] } {
  const spec = getMlsSpec(mlsId);
  const errors: string[] = [];

  if (fileSize > spec.maxFileSize) {
    errors.push(`File size ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds maximum ${(spec.maxFileSize / 1024 / 1024).toFixed(0)}MB`);
  }

  if (width > spec.maxDimensions.width || height > spec.maxDimensions.height) {
    errors.push(`Dimensions ${width}x${height} exceed maximum ${spec.maxDimensions.width}x${spec.maxDimensions.height}`);
  }

  if (width < spec.minDimensions.width || height < spec.minDimensions.height) {
    errors.push(`Dimensions ${width}x${height} below minimum ${spec.minDimensions.width}x${spec.minDimensions.height}`);
  }

  const formatLower = format.toLowerCase().replace('.', '');
  if (!spec.allowedFormats.includes(formatLower)) {
    errors.push(`Format ${format} not allowed. Use: ${spec.allowedFormats.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}
