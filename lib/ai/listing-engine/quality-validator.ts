/**
 * SnapR AI Engine V2 - Quality Validator
 * =======================================
 * Validates enhancement outputs and flags issues
 */

import OpenAI from 'openai';
import { PhotoProcessingResult, ValidationResult, ValidationIssue } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Minimum confidence to pass validation
  minConfidence: 70,
  
  // Skip validation for high-confidence results
  skipValidationThreshold: 90,
  
  // Maximum concurrent validations
  maxConcurrency: 5,
};

// ============================================
// VALIDATION PROMPT
// ============================================

const VALIDATION_PROMPT = `You are a quality control expert for real estate photo enhancements. Analyze this enhanced photo for any issues.

Look for:
1. ARTIFACTS - Unnatural elements, AI glitches, weird patterns, distorted objects
2. DISTORTION - Warped lines, stretched objects, perspective issues
3. COLOR ISSUES - Unnatural colors, color banding, inconsistent lighting
4. BLUR - Loss of sharpness, soft areas that should be sharp
5. INCONSISTENCIES - Elements that don't match (sky meeting roof, grass edges)

Rate the overall quality and identify any specific issues.

Return ONLY valid JSON:
{
  "overallQuality": 85,
  "isAcceptable": true,
  "issues": [
    {
      "type": "artifact",
      "severity": "low",
      "description": "Minor AI artifact visible in sky area",
      "location": "top-right"
    }
  ],
  "recommendation": "approve" 
}

Where:
- overallQuality: 0-100
- isAcceptable: true if quality >= 70
- type: artifact | distortion | color_shift | blur | inconsistency | other
- severity: low | medium | high
- recommendation: approve | review | reject`;

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

export async function validateResult(
  result: PhotoProcessingResult
): Promise<ValidationResult> {
  // Skip validation for failed results
  if (!result.success || !result.enhancedUrl) {
    return {
      photoId: result.photoId,
      isValid: false,
      confidence: 0,
      issues: [{
        type: 'other',
        severity: 'high',
        description: 'Enhancement failed',
      }],
      needsReview: true,
    };
  }
  
  // Skip validation for high-confidence results to save API calls
  if (result.confidence >= CONFIG.skipValidationThreshold) {
    console.log(`[Validator] Skipping validation for high-confidence photo ${result.photoId}`);
    return {
      photoId: result.photoId,
      isValid: true,
      confidence: result.confidence,
      issues: [],
      needsReview: false,
    };
  }
  
  console.log(`[Validator] Validating photo ${result.photoId}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VALIDATION_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: result.enhancedUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from validation');
    }
    
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const validation = JSON.parse(cleanContent);
    
    return normalizeValidation(result.photoId, validation);
  } catch (error: any) {
    console.error(`[Validator] Validation failed:`, error.message);
    
    // On error, use confidence from processing result
    return {
      photoId: result.photoId,
      isValid: result.confidence >= CONFIG.minConfidence,
      confidence: result.confidence,
      issues: [],
      needsReview: result.confidence < CONFIG.minConfidence,
    };
  }
}

// ============================================
// BATCH VALIDATION
// ============================================

export async function validateResults(
  results: PhotoProcessingResult[]
): Promise<ValidationResult[]> {
  console.log(`[Validator] Validating ${results.length} photos`);
  const startTime = Date.now();
  
  const validations: ValidationResult[] = [];
  
  // Process in batches
  for (let i = 0; i < results.length; i += CONFIG.maxConcurrency) {
    const batch = results.slice(i, i + CONFIG.maxConcurrency);
    const batchPromises = batch.map(result => validateResult(result));
    const batchValidations = await Promise.all(batchPromises);
    validations.push(...batchValidations);
    
    // Small delay between batches
    if (i + CONFIG.maxConcurrency < results.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  const duration = Date.now() - startTime;
  const passedCount = validations.filter(v => v.isValid).length;
  console.log(`[Validator] Complete: ${passedCount}/${results.length} passed in ${(duration / 1000).toFixed(1)}s`);
  
  return validations;
}

// ============================================
// NORMALIZATION
// ============================================

function normalizeValidation(
  photoId: string,
  raw: any
): ValidationResult {
  const quality = typeof raw.overallQuality === 'number' 
    ? Math.max(0, Math.min(100, raw.overallQuality))
    : 70;
  
  const issues: ValidationIssue[] = [];
  
  if (Array.isArray(raw.issues)) {
    for (const issue of raw.issues) {
      if (issue && typeof issue === 'object') {
        issues.push({
          type: validateIssueType(issue.type),
          severity: validateSeverity(issue.severity),
          description: String(issue.description || 'Unknown issue'),
          location: issue.location,
        });
      }
    }
  }
  
  const hasHighSeverityIssue = issues.some(i => i.severity === 'high');
  const hasMediumSeverityIssue = issues.some(i => i.severity === 'medium');
  
  // Determine if needs review
  let needsReview = false;
  if (hasHighSeverityIssue) needsReview = true;
  if (hasMediumSeverityIssue && quality < 80) needsReview = true;
  if (quality < CONFIG.minConfidence) needsReview = true;
  if (raw.recommendation === 'review' || raw.recommendation === 'reject') needsReview = true;
  
  return {
    photoId,
    isValid: quality >= CONFIG.minConfidence && !hasHighSeverityIssue,
    confidence: quality,
    issues,
    needsReview,
  };
}

function validateIssueType(value: any): ValidationIssue['type'] {
  const valid: ValidationIssue['type'][] = [
    'artifact', 'distortion', 'color_shift', 'blur', 'inconsistency', 'other'
  ];
  return valid.includes(value) ? value : 'other';
}

function validateSeverity(value: any): ValidationIssue['severity'] {
  const valid: ValidationIssue['severity'][] = ['low', 'medium', 'high'];
  return valid.includes(value) ? value : 'low';
}

// ============================================
// SUMMARY FUNCTIONS
// ============================================

export function getValidationSummary(validations: ValidationResult[]): {
  passed: number;
  failed: number;
  needsReview: number;
  issues: { type: string; count: number }[];
  overallScore: number;
} {
  const passed = validations.filter(v => v.isValid && !v.needsReview).length;
  const failed = validations.filter(v => !v.isValid).length;
  const needsReview = validations.filter(v => v.needsReview).length;
  
  // Count issues by type
  const issueCounts: Record<string, number> = {};
  for (const validation of validations) {
    for (const issue of validation.issues) {
      issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
    }
  }
  
  const issues = Object.entries(issueCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  // Calculate overall score
  const totalConfidence = validations.reduce((sum, v) => sum + v.confidence, 0);
  const overallScore = validations.length > 0 
    ? Math.round(totalConfidence / validations.length)
    : 0;
  
  return {
    passed,
    failed,
    needsReview,
    issues,
    overallScore,
  };
}

export function getValidationReport(validations: ValidationResult[]): string {
  const summary = getValidationSummary(validations);
  const lines: string[] = [];
  
  lines.push(`✅ Validation Report`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Overall Score: ${summary.overallScore}%`);
  lines.push(``);
  lines.push(`Results:`);
  lines.push(`  ✓ Passed: ${summary.passed}`);
  lines.push(`  ✗ Failed: ${summary.failed}`);
  lines.push(`  ⚠ Needs Review: ${summary.needsReview}`);
  
  if (summary.issues.length > 0) {
    lines.push(``);
    lines.push(`Issues Found:`);
    for (const issue of summary.issues) {
      lines.push(`  ${issue.type}: ${issue.count}`);
    }
  }
  
  // List photos needing review
  const reviewPhotos = validations.filter(v => v.needsReview);
  if (reviewPhotos.length > 0) {
    lines.push(``);
    lines.push(`Photos Needing Review:`);
    for (const photo of reviewPhotos.slice(0, 5)) {
      const issueDesc = photo.issues.length > 0 
        ? photo.issues[0].description 
        : 'Low confidence';
      lines.push(`  ${photo.photoId}: ${issueDesc}`);
    }
    if (reviewPhotos.length > 5) {
      lines.push(`  ... and ${reviewPhotos.length - 5} more`);
    }
  }
  
  return lines.join('\n');
}

// ============================================
// QUICK VALIDATION (No API call)
// ============================================

/**
 * Quick validation based on processing metrics, without API call
 */
export function quickValidate(result: PhotoProcessingResult): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check for partial tool application
  const noToolsPlanned = result.toolsApplied.length === 0 && result.toolsSkipped.length === 0;
  if (result.toolsApplied.length === 0 && !noToolsPlanned) {
    issues.push({
      type: 'other',
      severity: 'high',
      description: 'No enhancements were applied',
    });
  }
  
  // Check processing time anomalies
  if (result.processingTime > 180000) { // > 3 minutes
    issues.push({
      type: 'other',
      severity: 'medium',
      description: 'Unusually long processing time',
    });
  }
  
  // Check confidence
  if (result.confidence < 50) {
    issues.push({
      type: 'other',
      severity: 'medium',
      description: 'Low confidence in enhancement quality',
    });
  }
  
  const hasHighSeverity = issues.some(i => i.severity === 'high');
  
  if (noToolsPlanned && result.success) {
    return {
      photoId: result.photoId,
      isValid: true,
      confidence: Math.max(result.confidence, CONFIG.minConfidence),
      issues: [],
      needsReview: false,
    };
  }

  return {
    photoId: result.photoId,
    isValid: result.success && !hasHighSeverity,
    confidence: result.confidence,
    issues,
    needsReview: hasHighSeverity || result.confidence < CONFIG.minConfidence,
  };
}
