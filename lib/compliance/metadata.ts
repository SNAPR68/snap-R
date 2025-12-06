import sharp from 'sharp';

export interface ResoMetadata {
  imageEnhancementType: string;
  enhancementDate: string;
  enhancementProvider: string;
  originalImageHash?: string;
  disclosureRequired: boolean;
  mlsCompliant: boolean;
  toolId: string;
  version: string;
}

/**
 * Generate RESO-compliant metadata object
 */
export function generateResoMetadata(toolId: string, originalHash?: string): ResoMetadata {
  const enhancementTypes: Record<string, string> = {
    'sky-replacement': 'SkyReplacement',
    'virtual-twilight': 'VirtualTwilight',
    'virtual-staging': 'VirtualStaging',
    'declutter': 'ObjectRemoval',
    'item-removal': 'ObjectRemoval',
    'lawn-repair': 'LandscapeEnhancement',
    'pool-enhancement': 'PoolEnhancement',
    'hdr-enhancement': 'HDRProcessing',
    'auto-enhance': 'AutoEnhancement',
    'brightness-exposure': 'ExposureCorrection',
    'color-correction': 'ColorCorrection',
    'fire-in-fireplace': 'DigitalEnhancement',
    'lights-on': 'LightingEnhancement',
    'tv-screen-replacement': 'DigitalEnhancement',
    'art-wall-replacement': 'DigitalEnhancement',
  };

  const disclosureRequiredTools = [
    'virtual-staging',
    'item-removal',
    'declutter',
    'fire-in-fireplace',
    'tv-screen-replacement',
    'art-wall-replacement',
  ];

  return {
    imageEnhancementType: enhancementTypes[toolId] || 'DigitalEnhancement',
    enhancementDate: new Date().toISOString(),
    enhancementProvider: 'SnapR',
    originalImageHash: originalHash,
    disclosureRequired: disclosureRequiredTools.includes(toolId),
    mlsCompliant: true,
    toolId,
    version: '1.3.0',
  };
}

/**
 * Embed metadata into image EXIF/IPTC
 * Note: Sharp has limited EXIF support, so we store in ImageDescription
 * For full IPTC support, would need exiftool
 */
export async function embedMetadata(
  imageBuffer: Buffer,
  metadata: ResoMetadata
): Promise<Buffer> {
  const metadataString = JSON.stringify({
    'RESO:ImageEnhancementType': metadata.imageEnhancementType,
    'RESO:EnhancementDate': metadata.enhancementDate,
    'RESO:EnhancementProvider': metadata.enhancementProvider,
    'RESO:DisclosureRequired': metadata.disclosureRequired,
    'RESO:MLSCompliant': metadata.mlsCompliant,
    'SnapR:ToolId': metadata.toolId,
    'SnapR:Version': metadata.version,
  });

  // Sharp can embed EXIF data
  const processedBuffer = await sharp(imageBuffer)
    .withMetadata({
      exif: {
        IFD0: {
          ImageDescription: `SnapR Enhanced - ${metadata.imageEnhancementType}`,
          Software: `SnapR v${metadata.version}`,
          Artist: 'SnapR (snap-r.com)',
          Copyright: `Enhanced by SnapR - ${metadata.enhancementDate}`,
        },
        IFD2: {
          UserComment: metadataString,
        },
      },
    })
    .jpeg({ quality: 92 })
    .toBuffer();

  return processedBuffer;
}

/**
 * Create metadata sidecar file (XMP format)
 * This can be uploaded alongside images for full metadata support
 */
export function createXmpSidecar(metadata: ResoMetadata, filename: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:reso="http://reso.org/metadata/1.0/"
      xmlns:snapr="http://snap-r.com/metadata/1.0/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      
      <dc:description>SnapR Enhanced - ${metadata.imageEnhancementType}</dc:description>
      <dc:creator>SnapR (snap-r.com)</dc:creator>
      
      <xmp:CreatorTool>SnapR v${metadata.version}</xmp:CreatorTool>
      <xmp:ModifyDate>${metadata.enhancementDate}</xmp:ModifyDate>
      
      <reso:ImageEnhancementType>${metadata.imageEnhancementType}</reso:ImageEnhancementType>
      <reso:EnhancementDate>${metadata.enhancementDate}</reso:EnhancementDate>
      <reso:EnhancementProvider>${metadata.enhancementProvider}</reso:EnhancementProvider>
      <reso:DisclosureRequired>${metadata.disclosureRequired}</reso:DisclosureRequired>
      <reso:MLSCompliant>${metadata.mlsCompliant}</reso:MLSCompliant>
      
      <snapr:ToolId>${metadata.toolId}</snapr:ToolId>
      <snapr:Version>${metadata.version}</snapr:Version>
      ${metadata.originalImageHash ? `<snapr:OriginalHash>${metadata.originalImageHash}</snapr:OriginalHash>` : ''}
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
}
