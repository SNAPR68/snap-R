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
    const analyses: PhotoAnalysis[] = [];
    
    for (const [id, img] of images) {
      // Simplified analysis - in production, use GPT-4o Vision
      const analysis = this.createMockAnalysis(id, img.metadata, img.isHDR);
      analyses.push(analysis);
    }
    
    return analyses;
  }
  
  private createMockAnalysis(photoId: string, metadata: ImageMetadata, isHDR: boolean): PhotoAnalysis {
    // Mock analysis - replace with actual GPT-4o Vision call
    const isExterior = Math.random() > 0.5;
    
    return {
      photoId,
      photoUrl: metadata.filepath || '',
      photoType: isExterior ? 'exterior' : 'interior',
      subType: isExterior ? 'front' : 'living',
      scores: { composition: 70 + Math.random() * 20, lighting: isHDR ? 85 : 60 + Math.random() * 25, sharpness: 75 + Math.random() * 15 },
      deficiencies: {
        sky: isExterior ? { severity: Math.random() * 80, coverage: 20 + Math.random() * 30 } : undefined,
        lawn: isExterior ? { severity: Math.random() * 60, coverage: 15 + Math.random() * 25 } : undefined,
        lighting: { severity: isHDR ? 20 : 40 + Math.random() * 40 },
        clutter: !isExterior ? { severity: Math.random() * 50 } : undefined,
        perspective: { severity: Math.random() * 40 },
      },
      heroScore: 50 + Math.random() * 50,
      hasSky: isExterior,
      hasLawn: isExterior && Math.random() > 0.3,
      hasPool: Math.random() > 0.85,
      hasFireplace: !isExterior && Math.random() > 0.8,
      hasWindows: true,
      isEmpty: !isExterior && Math.random() > 0.9,
      analysisConfidence: 0.7 + Math.random() * 0.25,
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
