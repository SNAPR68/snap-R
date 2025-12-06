import sharp from 'sharp';
import archiver from 'archiver';
import { Readable } from 'stream';
import { getMlsSpec, validateForMls, type MlsSpec } from './mls-specs';
import { addWatermark, requiresWatermark, getWatermarkText } from './watermark';
import { generateResoMetadata, embedMetadata, createXmpSidecar } from './metadata';
import { generateDisclosure, generatePhotoDescription } from './disclosure';

export interface ExportPhoto {
  url: string;
  toolId: string;
  roomType?: string;
  filename: string;
}

export interface MlsExportOptions {
  mlsId: string;
  photos: ExportPhoto[];
  listingAddress?: string;
  mlsNumber?: string;
  agentName?: string;
  brokerageName?: string;
  includeXmpSidecars?: boolean;
}

export interface ExportResult {
  success: boolean;
  zipBuffer?: Buffer;
  errors?: string[];
  manifest?: {
    totalPhotos: number;
    processedPhotos: number;
    disclosureIncluded: boolean;
    mlsSpec: string;
  };
}

/**
 * Process a single image for MLS compliance
 */
async function processImageForMls(
  imageBuffer: Buffer,
  toolId: string,
  mlsSpec: MlsSpec
): Promise<Buffer> {
  let processed = imageBuffer;

  // Step 1: Resize if needed
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1920;
  const height = metadata.height || 1080;

  if (width > mlsSpec.maxDimensions.width || height > mlsSpec.maxDimensions.height) {
    processed = await sharp(processed)
      .resize(mlsSpec.maxDimensions.width, mlsSpec.maxDimensions.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  // Step 2: Add watermark if required
  if (mlsSpec.watermarkRequired && requiresWatermark(toolId)) {
    const watermarkText = getWatermarkText(toolId);
    processed = await addWatermark(processed, { text: watermarkText });
  }

  // Step 3: Embed metadata
  const resoMetadata = generateResoMetadata(toolId);
  processed = await embedMetadata(processed, resoMetadata);

  // Step 4: Ensure file size is within limits
  let quality = 90;
  while (processed.length > mlsSpec.maxFileSize && quality > 50) {
    quality -= 10;
    processed = await sharp(processed).jpeg({ quality }).toBuffer();
  }

  return processed;
}

/**
 * Generate complete MLS export package (ZIP)
 */
export async function generateMlsExportPackage(
  options: MlsExportOptions
): Promise<ExportResult> {
  const {
    mlsId,
    photos,
    listingAddress,
    mlsNumber,
    agentName,
    brokerageName,
    includeXmpSidecars = true,
  } = options;

  const mlsSpec = getMlsSpec(mlsId);
  const errors: string[] = [];
  const enhancementTypes: string[] = [];

  // Create ZIP archive in memory
  const chunks: Buffer[] = [];
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.on('data', (chunk) => chunks.push(chunk));

  // Process each photo
  let processedCount = 0;
  const photoDescriptions: { filename: string; description: string }[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    
    try {
      // Fetch image
      const response = await fetch(photo.url);
      if (!response.ok) {
        errors.push(`Failed to fetch ${photo.filename}: ${response.statusText}`);
        continue;
      }
      
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      // Process for MLS compliance
      const processedBuffer = await processImageForMls(imageBuffer, photo.toolId, mlsSpec);
      
      // Add to archive
      const filename = `photos/${String(i + 1).padStart(2, '0')}_${photo.filename}`;
      archive.append(processedBuffer, { name: filename });
      
      // Generate XMP sidecar if requested
      if (includeXmpSidecars) {
        const resoMetadata = generateResoMetadata(photo.toolId);
        const xmpContent = createXmpSidecar(resoMetadata, photo.filename);
        archive.append(xmpContent, { name: `${filename}.xmp` });
      }
      
      // Track enhancement types for disclosure
      const resoMetadata = generateResoMetadata(photo.toolId);
      if (!enhancementTypes.includes(resoMetadata.imageEnhancementType)) {
        enhancementTypes.push(resoMetadata.imageEnhancementType);
      }
      
      // Generate photo description
      photoDescriptions.push({
        filename: `${String(i + 1).padStart(2, '0')}_${photo.filename}`,
        description: generatePhotoDescription(photo.toolId, photo.roomType, i + 1),
      });
      
      processedCount++;
    } catch (err: any) {
      errors.push(`Error processing ${photo.filename}: ${err.message}`);
    }
  }

  // Generate disclosure document
  const disclosure = generateDisclosure({
    listingAddress,
    mlsNumber,
    agentName,
    brokerageName,
    enhancementTypes,
    enhancementDate: new Date().toISOString(),
  });
  archive.append(disclosure, { name: 'DISCLOSURE.txt' });

  // Generate photo descriptions CSV for MLS upload
  const csvContent = [
    'Filename,Description',
    ...photoDescriptions.map(p => `"${p.filename}","${p.description}"`)
  ].join('\n');
  archive.append(csvContent, { name: 'photo_descriptions.csv' });

  // Generate README
  const readme = `
MLS EXPORT PACKAGE
==================
Generated by SnapR (snap-r.com)
Date: ${new Date().toISOString()}
MLS Target: ${mlsSpec.name}

CONTENTS:
---------
/photos/          - ${processedCount} processed images
DISCLOSURE.txt    - Required disclosure statement
photo_descriptions.csv - Photo descriptions for MLS upload
${includeXmpSidecars ? '*.xmp files    - Metadata sidecars\n' : ''}
INSTRUCTIONS:
-------------
1. Upload photos from /photos/ folder to your MLS
2. Copy disclosure text from DISCLOSURE.txt to listing remarks
3. Use photo_descriptions.csv for individual photo captions

MLS REQUIREMENTS (${mlsSpec.name}):
- Max file size: ${(mlsSpec.maxFileSize / 1024 / 1024).toFixed(0)}MB
- Max dimensions: ${mlsSpec.maxDimensions.width}x${mlsSpec.maxDimensions.height}
- Watermark required: ${mlsSpec.watermarkRequired ? 'Yes' : 'No'}
- Disclosure method: ${mlsSpec.disclosureMethod}
${mlsSpec.notes ? `\nNotes: ${mlsSpec.notes}` : ''}

Questions? Contact support@snap-r.com
`.trim();
  archive.append(readme, { name: 'README.txt' });

  // Finalize archive
  await archive.finalize();
  
  // Wait for all chunks
  await new Promise<void>((resolve) => {
    archive.on('end', resolve);
  });

  const zipBuffer = Buffer.concat(chunks);

  return {
    success: errors.length === 0 || processedCount > 0,
    zipBuffer,
    errors: errors.length > 0 ? errors : undefined,
    manifest: {
      totalPhotos: photos.length,
      processedPhotos: processedCount,
      disclosureIncluded: true,
      mlsSpec: mlsSpec.name,
    },
  };
}
