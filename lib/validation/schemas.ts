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
  template: z.enum(['test', 'property-showcase', 'just-listed', 'open-house']),
  openHouseDate: z.string().max(100).optional(),
})

// Video status check
export const videoStatusSchema = z.object({
  renderId: z.string().min(1).max(200),
})

// Helper: Parse body with schema, return typed result or error response
export function parseBody<T>(schema: z.ZodType<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string; details: ReturnType<z.ZodError['flatten']> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: 'Invalid request body', details: result.error.flatten() }
}
