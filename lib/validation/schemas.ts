import { z } from 'zod'

// Stripe checkout
export const stripeCheckoutSchema = z.object({
  plan: z.string().min(1).max(30),
  listings: z.number().int().min(1).max(300).optional(),
  billing: z.enum(['monthly', 'annual', 'paygo']).optional(),
})

// Schedule a post
export const schedulePostSchema = z.object({
  listingId: z.string().uuid().optional().nullable(),
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok']),
  postType: z.string().max(50).optional(),
  content: z.string().max(5000).optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  scheduledFor: z.string().datetime({ message: 'Must be a valid ISO datetime' }),
})

// Partner application
export const partnerApplySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format').max(200),
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  website: z.string().url().or(z.literal('')).optional().nullable(),
  partner_type: z.enum(['agent', 'photographer', 'broker', 'vendor', 'other']),
  audience_size: z.string().max(50).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
})

// Social publish
export const socialPublishSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok']),
  content: z.string().min(1).max(5000),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  listingId: z.string().uuid().optional().nullable(),
})

// Analytics post creation
export const analyticsPostSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok']),
  listingId: z.string().uuid(),
  caption: z.string().max(5000).optional(),
})

// Enhance photo
export const enhanceSchema = z.object({
  photoId: z.string().uuid(),
  toolId: z.string().min(1).max(50),
  preset: z.string().max(100).optional(),
  listingId: z.string().uuid().optional(),
})

// Share listing
export const shareSchema = z.object({
  listingId: z.string().uuid(),
  options: z.object({
    allowDownload: z.boolean().optional(),
    showComparison: z.boolean().optional(),
    password: z.string().max(100).optional().nullable(),
    expiresIn: z.number().int().min(1).max(365).optional().nullable(),
  }).optional(),
})

// Generate video
export const generateVideoSchema = z.object({
  listingId: z.string().uuid(),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  template: z.enum(['test', 'property-showcase', 'just-listed', 'open-house', 'price-drop', 'sold']),
  openHouseDate: z.string().max(100).optional(),
  previousPrice: z.number().positive().optional(),
  daysOnMarket: z.number().int().min(0).max(9999).optional(),
  audio: z.object({
    musicTrack: z.string().max(50).optional(),
    musicVolume: z.number().min(0).max(100).optional(),
    voiceoverUrl: z.string().url().optional(),
    voiceoverVolume: z.number().min(0).max(100).optional(),
  }).optional(),
})

// Video status check
export const videoStatusSchema = z.object({
  renderId: z.string().min(1).max(200),
})

// Print materials (flyer / feature sheet)
export const printMaterialsSchema = z.object({
  listingId: z.string().uuid(),
  type: z.enum(['flyer', 'feature-sheet']),
})

// Auto-post rule
export const autoPostRuleCreateSchema = z.object({
  name: z.string().min(1).max(100),
  triggerEvent: z.string().min(1).max(50),
  triggerValue: z.string().max(100).optional().nullable(),
  platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin', 'tiktok'])).min(1).max(4),
  postType: z.string().max(50).optional(),
  templateId: z.string().uuid().optional().nullable(),
  includeCaption: z.boolean().optional(),
  includeHashtags: z.boolean().optional(),
})

export const autoPostRuleToggleSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
})

export const autoPostRuleDeleteSchema = z.object({
  id: z.string().uuid(),
})

// Notify (iOS waitlist)
export const notifySchema = z.object({
  email: z.string().email().max(200),
})

// Video voiceover (discriminated union)
export const voiceoverSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('generate-script'),
    propertyDetails: z.object({
      address: z.string().max(200).optional(),
      price: z.string().max(50).optional(),
      bedrooms: z.number().int().min(0).max(99).optional(),
      bathrooms: z.number().min(0).max(99).optional(),
      sqft: z.number().int().min(0).optional(),
      neighborhood: z.string().max(200).optional(),
      features: z.array(z.string().max(200)).max(50).optional(),
    }),
    style: z.string().max(50),
    duration: z.number().int().min(5).max(300),
  }),
  z.object({
    action: z.literal('generate-audio'),
    script: z.string().min(1).max(10000),
    voiceId: z.string().max(50),
  }),
  z.object({
    action: z.literal('upload-audio'),
    audioBase64: z.string().min(1),
    listingId: z.string().uuid(),
  }),
])

// Contact form
export const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  message: z.string().min(1).max(5000),
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

// Batch enhance
export const batchEnhanceSchema = z.object({
  listingId: z.string().uuid(),
  toolId: z.string().min(1).max(50),
  preset: z.string().min(1).max(100),
})

// Post drafts
export const draftCreateSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  listingId: z.string().uuid().optional().nullable(),
  name: z.string().max(200).optional().nullable(),
  platform: z.string().max(50).optional().nullable(),
  postType: z.string().max(50).optional().nullable(),
  templateId: z.string().uuid().optional().nullable(),
  caption: z.string().max(5000).optional().nullable(),
  hashtags: z.string().max(2000).optional().nullable(),
  propertyData: z.record(z.unknown()).optional().nullable(),
  brandData: z.record(z.unknown()).optional().nullable(),
})

export const draftDeleteSchema = z.object({
  id: z.string().uuid(),
})

// Listings
export const listingCreateSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
})

export const listingUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
  description: z.string().max(10000).optional(),
  marketingStatus: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
})

// Organization
export const organizationCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  platform_name: z.string().max(200).optional().nullable(),
  logo_url: z.string().url().or(z.literal('')).optional().nullable(),
  primary_color: z.string().max(20).optional(),
  secondary_color: z.string().max(20).optional(),
  accent_color: z.string().max(20).optional(),
})

export const organizationUpdateSchema = z.object({
  id: z.string().uuid(),
}).passthrough()

// Helper: Parse body with schema, return typed result or error response
export function parseBody<T>(schema: z.ZodType<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string; details: ReturnType<z.ZodError['flatten']> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: 'Invalid request body', details: result.error.flatten() }
}
