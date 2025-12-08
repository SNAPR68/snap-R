import sharp from 'sharp';

export interface WatermarkOptions {
  text?: string;
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-left' | 'top-right';
  opacity?: number;
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  padding?: number;
}

const DEFAULT_OPTIONS: WatermarkOptions = {
  text: 'VIRTUALLY STAGED',
  position: 'bottom-left',
  opacity: 0.85,
  fontSize: 24,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  textColor: 'white',
  padding: 12,
};

/**
 * Adds a watermark overlay to an image buffer
 * Returns the watermarked image as a buffer
 */
export async function addWatermark(
  imageBuffer: Buffer | Uint8Array,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Get image dimensions
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1920;
  const height = metadata.height || 1080;
  
  // Calculate font size relative to image (responsive)
  const responsiveFontSize = Math.max(16, Math.min(opts.fontSize!, Math.floor(width / 50)));
  const padding = Math.max(8, Math.floor(responsiveFontSize / 2));
  
  // Create SVG watermark
  const textWidth = opts.text!.length * responsiveFontSize * 0.6;
  const textHeight = responsiveFontSize + padding * 2;
  const boxWidth = textWidth + padding * 2;
  const boxHeight = textHeight;
  
  // Calculate position
  let x = padding;
  let y = height - boxHeight - padding;
  
  switch (opts.position) {
    case 'bottom-right':
      x = width - boxWidth - padding;
      y = height - boxHeight - padding;
      break;
    case 'bottom-center':
      x = (width - boxWidth) / 2;
      y = height - boxHeight - padding;
      break;
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-right':
      x = width - boxWidth - padding;
      y = padding;
      break;
    default: // bottom-left
      x = padding;
      y = height - boxHeight - padding;
  }
  
  const svgOverlay = `
    <svg width="${width}" height="${height}">
      <rect 
        x="${x}" 
        y="${y}" 
        width="${boxWidth}" 
        height="${boxHeight}" 
        rx="4" 
        fill="${opts.backgroundColor}"
        opacity="${opts.opacity}"
      />
      <text 
        x="${x + padding}" 
        y="${y + responsiveFontSize + padding / 2}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${responsiveFontSize}" 
        font-weight="bold"
        fill="${opts.textColor}"
      >${opts.text}</text>
    </svg>
  `;
  
  // Composite watermark onto image
  const watermarkedBuffer = await sharp(imageBuffer)
    .composite([{
      input: Buffer.from(svgOverlay),
      top: 0,
      left: 0,
    }])
    .jpeg({ quality: 92 })
    .toBuffer();
  
  return watermarkedBuffer;
}

/**
 * Check if a tool requires virtual staging watermark
 */
export function requiresWatermark(toolId: string): boolean {
  const watermarkTools = [
    'virtual-staging',
    'item-removal',
    'declutter',
    'fire-in-fireplace',
    'tv-screen-replacement',
    'art-wall-replacement',
  ];
  return watermarkTools.includes(toolId);
}

/**
 * Get appropriate watermark text based on tool
 */
export function getWatermarkText(toolId: string): string {
  const toolTexts: Record<string, string> = {
    'virtual-staging': 'VIRTUALLY STAGED',
    'item-removal': 'DIGITALLY EDITED',
    'declutter': 'DIGITALLY EDITED',
    'fire-in-fireplace': 'DIGITALLY ENHANCED',
    'tv-screen-replacement': 'DIGITALLY ENHANCED',
    'art-wall-replacement': 'DIGITALLY ENHANCED',
  };
  return toolTexts[toolId] || 'DIGITALLY ENHANCED';
}
