/**
 * SnapR V3 - Pipeline Orchestrator
 * ==================================
 * 
 * Main processing engine that coordinates:
 * 1. Input Router (bracket detection)
 * 2. HDR Processor (Imagen/Local)
 * 3. Photo Analyzer (GPT-4o Vision)
 * 4. Strategy Builder (Decision Engine)
 * 5. Tool Execution (FLUX, Sharp, SAM)
 * 6. Quality Validation
 */

import { BracketGroup, ImageMetadata, RoutingResult, routeImages } from './input-router';
import { HDRProcessor, HDRResult } from './hdr-processor';
import { analyzePhotos as analyzePhotosWithGPT } from './listing-engine/photo-intelligence';
import { PhotoAnalysis as ListingEngineAnalysis } from './listing-engine/types';
import { buildListingStrategy, getStrategySummary } from './v3-strategy-builder';
import { 
  PhotoAnalysis, 
  ListingStrategy, 
  PhotoStrategy,
  DecisionEngineConfig,
  DEFAULT_CONFIG,
  ToolId,
  TOOL_METADATA,
  PhotoType,
  PhotoSubType,
  DeficiencyMap,
} from './decision-engine/types';

// ============================================
// TYPES
// ============================================

export interface PipelineConfig {
  useImagenAI?: boolean;
  imagenApiKey?: string;
  imagenProfileKey?: string;
  maxConcurrency?: number;
  enableWindowPull?: boolean;
  enablePerspective?: boolean;
  toneMapping?: 'natural' | 'vivid' | 'dramatic';
  decisionConfig?: Partial<DecisionEngineConfig>;
  onProgress?: (progress: ProcessingProgress) => void;
  onImageComplete?: (result: ImageProcessingResult) => void;
}

export interface ProcessingProgress {
  phase: 'routing' | 'hdr' | 'analyzing' | 'strategizing' | 'processing' | 'validating' | 'complete';
  message: string;
  totalImages: number;
  processedImages: number;
  currentImage?: string;
  percentComplete: number;
}

export interface ImageProcessingResult {
  imageId: string;
  success: boolean;
  originalFilename: string;
  inputSource: 'bracket' | 'single';
  bracketCount?: number;
  outputBuffer?: Buffer;
  outputUrl?: string;
  toolsApplied: Array<{ tool: string; provider: string; success: boolean; timeMs: number; cost: number }>;
  processingTimeMs: number;
  totalCost: number;
  error?: string;
}

export interface PipelineResult {
  success: boolean;
  listingId: string;
  mode: 'simple' | 'pro';
  totalImages: number;
  bracketSets: number;
  singleImages: number;
  strategy: ListingStrategy;
  results: ImageProcessingResult[];
  successCount: number;
  failureCount: number;
  totalCost: number;
  costBreakdown: { hdr: number; tools: number; analysis: number };
  totalTimeMs: number;
  errors: string[];
}

// ============================================
// PIPELINE ORCHESTRATOR
// ============================================

export class PipelineOrchestrator {
  private config: PipelineConfig;
  private hdrProcessor: HDRProcessor;
  
  constructor(config: PipelineConfig = {}) {
    this.config = { maxConcurrency: 5, enableWindowPull: true, enablePerspective: true, toneMapping: 'natural', ...config };
    this.hdrProcessor = new HDRProcessor({
      useImagen: config.useImagenAI,
      imagenApiKey: config.imagenApiKey,
      imagenProfileKey: config.imagenProfileKey,
    });
  }
  
  private reportProgress(progress: ProcessingProgress) {
    this.config.onProgress?.(progress);
  }
  
  async process(listingId: string, images: ImageMetadata[]): Promise<PipelineResult> {
    const startTime = Date.now();
    const results: ImageProcessingResult[] = [];
    const errors: string[] = [];
    let totalCost = 0;
    const costBreakdown = { hdr: 0, tools: 0, analysis: 0 };
    
    console.log(`[V3 Pipeline] Processing listing: ${listingId}, Images: ${images.length}`);
    
    // PHASE 1: ROUTING
    this.reportProgress({ phase: 'routing', message: 'Detecting brackets...', totalImages: images.length, processedImages: 0, percentComplete: 5 });
    const routing = routeImages(images);
    
    // PHASE 2: HDR (Pro Mode)
    const hdrResults = new Map<string, HDRResult>();
    if (routing.mode === 'pro' && routing.brackets.length > 0) {
      this.reportProgress({ phase: 'hdr', message: `Processing ${routing.brackets.length} bracket(s)...`, totalImages: images.length, processedImages: 0, percentComplete: 10 });
      for (const bracket of routing.brackets) {
        try {
          const result = await this.hdrProcessor.processBracket(bracket, { toneMapping: this.config.toneMapping, enableWindowPull: this.config.enableWindowPull, enablePerspective: this.config.enablePerspective });
          hdrResults.set(bracket.id, result);
          costBreakdown.hdr += result.cost;
          totalCost += result.cost;
        } catch (error) {
          errors.push(`HDR failed: ${bracket.id}`);
        }
      }
    }
    
    // PHASE 3: ANALYSIS
    this.reportProgress({ phase: 'analyzing', message: 'Analyzing photos...', totalImages: images.length, processedImages: 0, percentComplete: 30 });
    const imagesToAnalyze = this.prepareImagesForAnalysis(routing, hdrResults);
    const analyses = await this.analyzePhotos(imagesToAnalyze);
    costBreakdown.analysis = analyses.length * 0.01;
    totalCost += costBreakdown.analysis;
    
    // PHASE 4: STRATEGY
    this.reportProgress({ phase: 'strategizing', message: 'Building strategy...', totalImages: images.length, processedImages: 0, percentComplete: 50 });
    const strategy = buildListingStrategy(listingId, analyses, { ...DEFAULT_CONFIG, ...this.config.decisionConfig });
    console.log(getStrategySummary(strategy));
    
    // PHASE 5: TOOL EXECUTION
    for (let i = 0; i < strategy.photoStrategies.length; i++) {
      const ps = strategy.photoStrategies[i];
      this.reportProgress({ phase: 'processing', message: `Processing ${i + 1}/${strategy.photoStrategies.length}...`, totalImages: strategy.photoStrategies.length, processedImages: i, currentImage: ps.photoId, percentComplete: 60 + (i / strategy.photoStrategies.length) * 30 });
      
      try {
        const result = await this.processPhoto(ps, imagesToAnalyze, routing, hdrResults);
        results.push(result);
        costBreakdown.tools += result.totalCost;
        totalCost += result.totalCost;
        this.config.onImageComplete?.(result);
      } catch (error) {
        errors.push(`Photo ${ps.photoId} failed`);
        results.push({ imageId: ps.photoId, success: false, originalFilename: ps.photoId, inputSource: 'single', toolsApplied: [], processingTimeMs: 0, totalCost: 0, error: String(error) });
      }
    }
    
    // COMPLETE
    this.reportProgress({ phase: 'complete', message: 'Processing complete', totalImages: images.length, processedImages: images.length, percentComplete: 100 });
    
    return {
      success: errors.length === 0,
      listingId,
      mode: routing.mode,
      totalImages: images.length,
      bracketSets: routing.brackets.length,
      singleImages: routing.singles.length,
      strategy,
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      totalCost,
      costBreakdown,
      totalTimeMs: Date.now() - startTime,
      errors,
    };
  }
  
  private prepareImagesForAnalysis(routing: RoutingResult, hdrResults: Map<string, HDRResult>): Map<string, { buffer?: Buffer; url?: string; metadata: ImageMetadata; isHDR: boolean }> {
    const prepared = new Map();
    
    // Add HDR results (replace bracket sets)
    for (const bracket of routing.brackets) {
      const hdr = hdrResults.get(bracket.id);
      if (hdr?.success) {
        prepared.set(bracket.id, { buffer: hdr.outputBuffer, metadata: bracket.images[0], isHDR: true });
      }
    }
    
    // Add singles
    for (const single of routing.singles) {
      prepared.set(single.filename, { buffer: single.buffer, metadata: single, isHDR: false });
    }
    
    return prepared;
  }
  
  private async analyzePhotos(images: Map<string, { buffer?: Buffer; url?: string; metadata: ImageMetadata; isHDR: boolean }>): Promise<PhotoAnalysis[]> {
    // Convert map to array format for GPT-4o analyzer
    const photosToAnalyze = Array.from(images.entries()).map(([id, img]) => ({
      id,
      url: img.url || img.metadata.filepath || '',
    }));

    console.log(`[Pipeline] Analyzing ${photosToAnalyze.length} photos with GPT-4o Vision...`);
    
    // Call the real GPT-4o Vision analyzer
    const rawAnalyses = await analyzePhotosWithGPT(photosToAnalyze, {
      maxConcurrency: 3,
      onProgress: (completed, total) => {
        this.reportProgress({
          phase: 'analyzing',
          message: `Analyzing photo ${completed}/${total}...`,
          totalImages: total,
          processedImages: completed,
          percentComplete: 30 + (completed / total) * 20,
        });
      },
    });

    // Convert listing-engine format to decision-engine format
    return rawAnalyses.map((raw: ListingEngineAnalysis) => this.convertAnalysis(raw));
  }

  private convertAnalysis(raw: ListingEngineAnalysis): PhotoAnalysis {
    const isExterior = raw.photoType.startsWith('exterior') || raw.photoType === 'drone';
    
    // Map detailed photo types to simple exterior/interior
    const photoType: PhotoType = isExterior ? 'exterior' : 'interior';
    
    // Map to subType
    const subTypeMap: Record<string, PhotoSubType> = {
      'exterior_front': 'front',
      'exterior_back': 'back', 
      'exterior_side': 'side',
      'interior_living': 'living',
      'interior_kitchen': 'kitchen',
      'interior_bedroom': 'bedroom',
      'interior_bathroom': 'bathroom',
      'interior_dining': 'dining',
      'interior_office': 'office',
      'interior_other': 'other',
      'drone': 'aerial',
      'detail': 'other',
      'unknown': 'other',
    };
    
    // Map quality strings to numeric scores
    const compositionScore = { excellent: 95, good: 80, average: 65, poor: 40 }[raw.composition] || 65;
    const lightingScore = { well_lit: 85, mixed: 65, dark: 40, overexposed: 50, flash_harsh: 55 }[raw.lighting] || 65;
    const sharpnessScore = { sharp: 90, acceptable: 75, soft: 55, blurry: 30 }[raw.sharpness] || 75;
    
    // Map sky quality to severity
    const skySeverity = { clear_blue: 0, good: 10, overcast: 50, blown_out: 80, ugly: 90, none: 0 }[raw.skyQuality] || 0;
    
    // Map lawn quality to severity  
    const lawnSeverity = { lush_green: 0, patchy: 50, brown: 75, dead: 95, none: 0 }[raw.lawnQuality] || 0;
    
    // Map clutter to severity
    const clutterSeverity = { none: 0, light: 30, moderate: 60, heavy: 90 }[raw.clutterLevel] || 0;
    
    // Map lighting to severity
    const lightingSeverity = { well_lit: 0, mixed: 40, dark: 70, overexposed: 60, flash_harsh: 50 }[raw.lighting] || 30;

    return {
      photoId: raw.photoId,
      photoUrl: raw.photoUrl,
      photoType,
      subType: subTypeMap[raw.photoType] || 'other',
      scores: {
        composition: compositionScore,
        lighting: lightingScore,
        sharpness: sharpnessScore,
      },
      deficiencies: {
        sky: raw.hasSky && skySeverity > 20 ? { severity: skySeverity, coverage: raw.skyVisible || 30 } : undefined,
        lawn: raw.hasLawn && lawnSeverity > 20 ? { severity: lawnSeverity, coverage: raw.lawnVisible || 20 } : undefined,
        lighting: lightingSeverity > 20 ? { severity: lightingSeverity } : undefined,
        clutter: clutterSeverity > 20 ? { severity: clutterSeverity } : undefined,
        perspective: !raw.verticalAlignment ? { severity: 50 } : undefined,
      },
      heroScore: raw.heroScore || 50,
      heroReason: raw.heroReason,
      hasSky: raw.hasSky,
      hasLawn: raw.hasLawn,
      hasPool: raw.hasPool,
      hasFireplace: raw.hasFireplace,
      hasWindows: raw.hasVisibleWindows,
      isEmpty: raw.roomEmpty,
      analysisConfidence: (raw.confidence || 70) / 100,
    };
  }
  
  private async processPhoto(
    strategy: PhotoStrategy,
    images: Map<string, { buffer?: Buffer; url?: string; metadata: ImageMetadata; isHDR: boolean }>,
    routing: RoutingResult,
    hdrResults: Map<string, HDRResult>
  ): Promise<ImageProcessingResult> {
    const startTime = Date.now();
    const toolsApplied: ImageProcessingResult['toolsApplied'] = [];
    let totalCost = 0;
    let currentBuffer: Buffer | undefined;
    
    // Get source image
    const imageData = images.get(strategy.photoId);
    if (imageData?.buffer) {
      currentBuffer = imageData.buffer;
    }
    
    // Check if from HDR
    const isFromBracket = routing.brackets.some(b => b.id === strategy.photoId);
    
    // Apply each tool in order
    for (const tool of strategy.toolOrder) {
      const toolStart = Date.now();
      const metadata = TOOL_METADATA[tool];
      
      try {
        // In production, call actual tool providers here
        // For now, simulate processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        toolsApplied.push({
          tool,
          provider: this.getProviderForTool(tool),
          success: true,
          timeMs: Date.now() - toolStart,
          cost: metadata.estimatedCost,
        });
        
        totalCost += metadata.estimatedCost;
        
      } catch (error) {
        toolsApplied.push({
          tool,
          provider: this.getProviderForTool(tool),
          success: false,
          timeMs: Date.now() - toolStart,
          cost: 0,
        });
      }
    }
    
    return {
      imageId: strategy.photoId,
      success: true,
      originalFilename: imageData?.metadata.filename || strategy.photoId,
      inputSource: isFromBracket ? 'bracket' : 'single',
      bracketCount: isFromBracket ? routing.brackets.find(b => b.id === strategy.photoId)?.images.length : undefined,
      outputBuffer: currentBuffer,
      toolsApplied,
      processingTimeMs: Date.now() - startTime,
      totalCost,
    };
  }
  
  private getProviderForTool(tool: ToolId): string {
    switch (tool) {
      case 'sky-replacement':
      case 'virtual-twilight':
      case 'lawn-repair':
      case 'virtual-staging':
      case 'declutter':
        return 'replicate-flux';
      case 'hdr':
      case 'auto-enhance':
        return 'sharp-local';
      default:
        return 'replicate-flux';
    }
  }
}

export default PipelineOrchestrator;
