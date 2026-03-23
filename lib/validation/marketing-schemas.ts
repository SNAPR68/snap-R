import { z } from 'zod'

// Schedule a post
export const schedulePostSchema = z.object({
  listingId: z.string().uuid().optional().nullable(),
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter']),
  postType: z.string().max(50).optional(),
  content: z.string().max(5000).optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  scheduledFor: z.string().datetime({ message: 'Must be a valid ISO datetime' }),
})

// Social publish
export const socialPublishSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok']),
  content: z.string().min(1).max(5000),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  listingId: z.string().uuid().optional().nullable(),
})

// Social publish (extended with scheduling)
export const socialPublishExtendedSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter']),
  content: z.string().min(1).max(5000),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  listingId: z.string().uuid().optional().nullable(),
  scheduleFor: z.string().datetime().optional().nullable(),
})

// Social: test LinkedIn post
export const testLinkedinSchema = z.object({
  content: z.string().max(5000).optional(),
})

// Social manage
export const socialManageSchema = z.object({
  action: z.string().min(1).max(50),
  platform: z.string().max(50).optional(),
  data: z.record(z.unknown()).optional(),
})

// Analytics post creation
export const analyticsPostSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok']),
  listingId: z.string().uuid(),
  caption: z.string().max(5000).optional(),
})

// Analytics posts query
export const analyticsPostsQuerySchema = z.object({
  platform: z.string().max(50).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.string().optional(),
  listingId: z.string().uuid().optional(),
})

// Analytics posts POST (record a published post)
export const analyticsPostRecordSchema = z.object({
  listingId: z.string().uuid().optional().nullable(),
  platform: z.enum(['instagram', 'facebook', 'linkedin', 'tiktok']),
  platformPostId: z.string().max(500).optional(),
  postType: z.string().max(50).optional(),
  templateId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  caption: z.string().max(5000).optional(),
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

// Auto-post
export const autoPostSchema = z.object({
  listingId: z.string().uuid(),
  scheduled: z.boolean().optional(),
})

// Marketing: trigger
export const marketingTriggerSchema = z.object({
  listingId: z.string().uuid(),
  triggerType: z.string().max(50).optional(),
})

// Marketing trigger (extended)
export const marketingTriggerExtendedSchema = z.object({
  listingId: z.string().uuid(),
})

// Publish video
export const publishVideoSchema = z.object({
  listingId: z.string().uuid(),
  videoUrl: z.string().url(),
})

// Publish video to social platform
export const publishVideoExtendedSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'linkedin', 'tiktok']),
  videoUrl: z.string().url(),
  caption: z.string().max(5000).optional(),
  listingId: z.string().uuid().optional().nullable(),
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

// Content library
export const contentLibrarySchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(10000).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
}).passthrough()

// Copy: caption
export const copyCaptionSchema = z.object({
  listingId: z.string().uuid().optional(),
  platform: z.string().max(50).optional(),
  description: z.string().max(10000).optional(),
})

// Copy: description
export const copyDescriptionSchema = z.object({
  listingId: z.string().uuid().optional(),
  photoUrls: z.array(z.string().url()).max(50).optional(),
})

// Copy: hashtags
export const copyHashtagsSchema = z.object({
  description: z.string().max(10000).optional(),
  platform: z.string().max(50).optional(),
})

// AI: generate caption
export const generateCaptionSchema = z.object({
  prompt: z.string().min(1).max(5000),
  platform: z.string().max(50).optional(),
})

// AI: generate description
export const generateDescriptionSchema = z.object({
  listingId: z.string().uuid().optional(),
  photoUrls: z.array(z.string().url()).max(50).optional(),
  tone: z.string().max(50).optional(),
  length: z.string().max(50).optional(),
  listingData: z.record(z.unknown()).optional(),
})

// Campaigns
export const campaignsSchema = z.object({
  action: z.string().min(1).max(50).optional(),
  listingId: z.string().uuid().optional(),
  campaignType: z.string().max(50).optional(),
}).passthrough()

// Brand
export const brandSchema = z.object({
  brandName: z.string().max(200).optional(),
  color: z.string().max(20).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional().nullable(),
}).passthrough()

// Email send
export const emailSendSchema = z.object({
  to: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient required').max(50, 'Maximum 50 recipients per request'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be 200 characters or less'),
  html: z.string().min(1, 'HTML content is required'),
  text: z.string().optional(),
  listingId: z.string().uuid().optional(),
  emailType: z.enum(['just-listed', 'open-house', 'price-reduced', 'just-sold', 'market-update', 'follow-up']).optional(),
  replyTo: z.string().email('Invalid reply-to email').optional(),
})

// Email template generation
export const emailTemplateSchema = z.object({
  property: z.object({
    address: z.string().max(500).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    price: z.number().optional(),
    bedrooms: z.number().int().min(0).max(99).optional(),
    bathrooms: z.number().min(0).max(99).optional(),
    sqft: z.number().int().min(0).optional(),
  }).passthrough(),
  postType: z.string().max(50).optional(),
  agentInfo: z.object({
    name: z.string().max(200).optional(),
    phone: z.string().max(30).optional(),
    email: z.string().email().optional(),
  }).optional(),
  tone: z.enum(['professional', 'friendly', 'luxury', 'urgent']).optional(),
})

// Outgoing webhooks
const WEBHOOK_EVENTS = [
  'listing.created',
  'listing.prepared',
  'listing.marketing_complete',
  'lead.created',
  'lead.status_changed',
  'post.published',
  'post.scheduled',
  'open_house.checkin',
] as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]

export const webhookCreateSchema = z.object({
  url: z.string().url('Must be a valid URL').max(2000),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, 'At least one event required').max(WEBHOOK_EVENTS.length),
  secret: z.string().max(500).optional(),
})

export const webhookUpdateSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url('Must be a valid URL').max(2000).optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).max(WEBHOOK_EVENTS.length).optional(),
  is_active: z.boolean().optional(),
  secret: z.string().max(500).optional(),
})

export const webhookDeleteSchema = z.object({
  id: z.string().uuid(),
})

// Generate video
export const generateVideoSchema = z.object({
  listingId: z.string().uuid(),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  template: z.enum(['test', 'property-showcase', 'just-listed', 'open-house', 'price-drop', 'sold', 'short-form']),
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

// Voiceover (simple /api/voiceover route)
export const voiceoverSimpleSchema = z.object({
  listingId: z.string().uuid().optional(),
  propertyDetails: z.record(z.unknown()).optional(),
  style: z.string().max(50).optional(),
  voiceId: z.string().max(50).optional(),
  duration: z.number().int().min(5).max(300).optional(),
  includeCallToAction: z.boolean().optional(),
  agentName: z.string().max(200).optional(),
  agentPhone: z.string().max(50).optional(),
  customScript: z.string().max(10000).optional(),
  scriptOnly: z.boolean().optional(),
})

// Internal: video generate
export const internalVideoGenerateSchema = z.object({
  listingId: z.string().uuid(),
  style: z.string().max(50).optional(),
  videoType: z.string().max(50).optional(),
}).passthrough()

// Video convert
export const videoConvertSchema = z.object({
  videoUrl: z.string().url().optional(),
  videoBase64: z.string().optional(),
  format: z.enum(['mp4', 'webm', 'gif']).optional(),
  listingId: z.string().uuid().optional(),
})

// OAuth callback query params
export const oauthCallbackSchema = z.object({
  code: z.string().min(1).max(5000),
  state: z.string().min(1).max(5000),
})

// Embed — Widget analytics
export const widgetAnalyticsSchema = z.object({
  widget_type: z.enum(['before-after', 'gallery', 'property']),
  listing_id: z.string().uuid(),
  event: z.enum(['impression', 'click', 'interaction']),
  referrer: z.string().max(500).optional(),
})

// Translate
export const translateSchema = z.object({
  text: z.string().min(1).max(10000),
  targetLanguage: z.string().min(2).max(10),
})
