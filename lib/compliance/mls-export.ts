import sharp from 'sharp';
import archiver from 'archiver';
import { getMlsSpec, type MlsSpec } from './mls-specs';
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

  console.log('[MLS Export] Starting package generation');
  console.log('[MLS Export] MLS:', mlsId, '| Photos:', photos.length);

  const mlsSpec = getMlsSpec(mlsId);
  const errors: string[] = [];
  const enhancementTypes: string[] = [];

  // Create ZIP archive in memory
  const chunks: Buffer[] = [];
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.on('data', (chunk) => chunks.push(chunk));
  archive.on('error', (err) => {
    console.error('[MLS Export] Archive error:', err);
    errors.push('Archive error: ' + err.message);
  });

  // Process each photo
  let processedCount = 0;
  const photoDescriptions: { filename: string; description: string }[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    
    try {
      console.log('[MLS Export] Processing photo', i + 1, 'of', photos.length);
      console.log('[MLS Export] URL:', photo.url ? photo.url.substring(0, 80) + '...' : 'MISSING');
      
      if (!photo.url) {
        const errMsg = 'Missing URL for ' + photo.filename;
        console.error('[MLS Export]', errMsg);
        errors.push(errMsg);
        continue;
      }

      // Fetch image
      const response = await fetch(photo.url);
      console.log('[MLS Export] Fetch response:', response.status, response.statusText);
      
      if (!response.ok) {
        const errMsg = 'Failed to fetch ' + photo.filename + ': ' + response.status + ' ' + response.statusText;
        console.error('[MLS Export]', errMsg);
        errors.push(errMsg);
        continue;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      console.log('[MLS Export] Image fetched, size:', imageBuffer.length, 'bytes');
      
      // Process for MLS compliance
      console.log('[MLS Export] Processing image for MLS compliance...');
      const processedBuffer = await processImageForMls(imageBuffer, photo.toolId, mlsSpec);
      console.log('[MLS Export] Processed, new size:', processedBuffer.length, 'bytes');
      
      // Add to archive
      const filename = 'photos/' + String(i + 1).padStart(2, '0') + '_' + photo.filename;
      archive.append(processedBuffer, { name: filename });
      console.log('[MLS Export] Added to archive:', filename);
      
      // Generate XMP sidecar if requested
      if (includeXmpSidecars) {
        const resoMetadata = generateResoMetadata(photo.toolId);
        const xmpContent = createXmpSidecar(resoMetadata, photo.filename);
        archive.append(xmpContent, { name: filename + '.xmp' });
      }
      
      // Track enhancement types for disclosure
      const resoMetadata = generateResoMetadata(photo.toolId);
      if (!enhancementTypes.includes(resoMetadata.imageEnhancementType)) {
        enhancementTypes.push(resoMetadata.imageEnhancementType);
      }
      
      // Generate photo description
      photoDescriptions.push({
        filename: String(i + 1).padStart(2, '0') + '_' + photo.filename,
        description: generatePhotoDescription(photo.toolId, photo.roomType, i + 1),
      });
      
      processedCount++;
      console.log('[MLS Export] Photo', i + 1, 'complete');
      
    } catch (err: any) {
      const errMsg = 'Error processing ' + photo.filename + ': ' + (err.message || String(err));
      console.error('[MLS Export]', errMsg);
      errors.push(errMsg);
    }
  }

  console.log('[MLS Export] All photos processed. Success:', processedCount, '| Errors:', errors.length);

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
  const csvHeader = 'Filename,Description';
  const csvRows = photoDescriptions.map(p => '"' + p.filename + '","' + p.description + '"');
  const csvContent = [csvHeader, ...csvRows].join('\n');
  archive.append(csvContent, { name: 'photo_descriptions.csv' });

  // Generate README
  const readme = `MLS EXPORT PACKAGE
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
  console.log('[MLS Export] Finalizing archive...');
  await archive.finalize();
  
  // Wait for all chunks with timeout
  await new Promise<void>((resolve) => {
    archive.on('end', () => {
      console.log('[MLS Export] Archive finalized');
      resolve();
    });
    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('[MLS Export] Archive timeout - resolving anyway');
      resolve();
    }, 30000);
  });

  const zipBuffer = Buffer.concat(chunks);
  console.log('[MLS Export] ZIP created, size:', zipBuffer.length, 'bytes');

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