import { z } from 'zod'

// Enhance photo
export const enhanceSchema = z.object({
  photoId: z.string().uuid(),
  toolId: z.string().min(1).max(50),
  preset: z.string().max(100).optional(),
  listingId: z.string().uuid().optional(),
})

// Batch enhance
export const batchEnhanceSchema = z.object({
  listingId: z.string().uuid(),
  toolId: z.string().min(1).max(50),
  preset: z.string().min(1).max(100),
})

// Enhance quick
export const enhanceQuickSchema = z.object({
  imageId: z.string().min(1).max(200),
  toolId: z.string().min(1).max(50),
  options: z.record(z.unknown()).optional(),
})

// Enhance quick (worker-to-worker)
export const enhanceQuickExtendedSchema = z.object({
  imageUrl: z.string().url(),
  photoId: z.string().min(1).max(200),
  listingId: z.string().uuid(),
  userId: z.string().uuid(),
})

// Approve photo
export const approvePhotoSchema = z.object({
  photoId: z.string().uuid(),
  approved: z.boolean(),
})

// Analyze photos
export const analyzeSchema = z.object({
  listingId: z.string().uuid().optional(),
  photoUrls: z.array(z.string().url()).max(50).optional(),
})

// AI: photo cull
export const photoCullSchema = z.object({
  listingId: z.string().uuid(),
  photoUrls: z.array(z.string().url()).max(200),
  targetCount: z.number().int().min(1).max(200).optional(),
  sessionName: z.string().max(200).optional(),
})

// Virtual staging
export const stagingSchema = z.object({
  photoId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url(),
  listingId: z.string().uuid().optional().nullable(),
  roomType: z.string().max(50).optional(),
  furnitureStyle: z.string().max(50).optional(),
  qualityTier: z.enum(['quick', 'standard', 'premium']).optional(),
  preset: z.string().max(50).optional(),
  customInstructions: z.string().max(1000).optional(),
})

// Compliance: apply
export const complianceApplySchema = z.object({
  imageUrl: z.string().url(),
  toolId: z.string().min(1).max(100),
  options: z.object({
    forceWatermark: z.boolean().optional(),
    watermarkText: z.string().max(200).optional(),
    watermarkPosition: z.enum(['bottom-left', 'bottom-right', 'bottom-center', 'top-left', 'top-right']).optional(),
    watermarkOpacity: z.number().min(0).max(1).optional(),
  }).optional(),
})

// Compliance: export
export const complianceExportSchema = z.object({
  mlsId: z.string().min(1).max(100),
  photos: z.array(z.object({
    url: z.string().url(),
    toolId: z.string().min(1).max(100),
    roomType: z.string().max(100).optional(),
    filename: z.string().max(200),
  })).min(1),
  listingAddress: z.string().max(500).optional(),
  mlsNumber: z.string().max(100).optional(),
  agentName: z.string().max(200).optional(),
  brokerageName: z.string().max(200).optional(),
})

// Compliance apply (extended)
export const complianceApplyExtendedSchema = z.object({
  imageUrl: z.string().url(),
  toolId: z.string().min(1).max(100),
  options: z.object({
    forceWatermark: z.boolean().optional(),
    watermarkText: z.string().max(200).optional(),
    watermarkPosition: z.enum(['bottom-left', 'bottom-right', 'bottom-center', 'top-left', 'top-right']).optional(),
    watermarkOpacity: z.number().min(0).max(1).optional(),
  }).optional(),
})

// Watermark
export const watermarkSchema = z.object({
  enabled: z.boolean().optional(),
  text: z.string().max(200).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional().nullable(),
  position: z.string().max(30).optional(),
  opacity: z.number().min(0).max(100).optional(),
}).passthrough()

// Notify approval
export const notifyApprovalSchema = z.object({
  photoId: z.string().uuid(),
  approvalStatus: z.string().max(50).optional(),
}).passthrough()

// Human editor
export const humanEditorSchema = z.object({
  photoId: z.string().uuid(),
  instructions: z.string().max(5000).optional(),
}).passthrough()

// Test imagen
export const testImagenSchema = z.object({
  imageUrl: z.string().url(),
})

// Mobile analyze frame
export const mobileAnalyzeFrameSchema = z.object({
  imageBase64: z.string().min(1).max(15_000_000), // ~10 MB base64
  listingId: z.string().uuid().optional(),
})
