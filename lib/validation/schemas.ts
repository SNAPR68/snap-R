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

// MLS import
export const mlsImportSchema = z.object({
  mlsNumber: z.string().min(1).max(50),
  provider: z.string().max(50).optional().default('simplyrets'),
})

// Photographer booking
export const photographerBookingSchema = z.object({
  photographerId: z.string().uuid(),
  packageId: z.string().uuid().optional(),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email(),
  clientPhone: z.string().max(30).optional(),
  clientBrokerage: z.string().max(200).optional(),
  propertyAddress: z.string().min(1).max(500),
  propertyCity: z.string().max(100).optional(),
  propertyState: z.string().max(50).optional(),
  propertyZip: z.string().max(20).optional(),
  propertyType: z.string().max(50).optional(),
  bedrooms: z.number().int().min(0).max(99).optional(),
  bathrooms: z.number().min(0).max(99).optional(),
  squareFeet: z.number().int().min(0).optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  specialInstructions: z.string().max(2000).optional(),
  accessInfo: z.string().max(500).optional(),
  addOns: z.array(z.string()).optional(),
})

// Open house check-in (public, no auth)
export const openHouseCheckinSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  contactType: z.enum(['buyer', 'agent', 'investor', 'neighbor', 'other']).optional(),
  brokerage: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
})

// Open house feedback (public, no auth)
export const openHouseFeedbackSchema = z.object({
  attendeeId: z.string().uuid(),
  interestLevel: z.number().int().min(1).max(5),
  feedback: z.string().max(2000).optional(),
  wantsFollowUp: z.boolean().optional(),
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

// ============================================
// ADDITIONAL SCHEMAS (Issue 1 remediation)
// ============================================

// Admin: complete human edit
export const adminCompleteHumanEditSchema = z.object({
  orderId: z.string().min(1).max(200),
  userEmail: z.string().email().optional(),
})

// Admin: update contact status
export const adminContactStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.string().min(1).max(50),
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

// AI: photo cull
export const photoCullSchema = z.object({
  listingId: z.string().uuid(),
  photoUrls: z.array(z.string().url()).max(200),
  targetCount: z.number().int().min(1).max(200).optional(),
  sessionName: z.string().max(200).optional(),
})

// Analytics: error tracking
export const analyticsErrorSchema = z.object({
  message: z.string().max(5000),
  stack: z.string().max(10000).optional(),
  context: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
})

// Analytics: event tracking
export const analyticsTrackSchema = z.object({
  event: z.string().min(1).max(200),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
})

// Analyze photos
export const analyzeSchema = z.object({
  listingId: z.string().uuid().optional(),
  photoUrls: z.array(z.string().url()).max(50).optional(),
})

// Approve photo
export const approvePhotoSchema = z.object({
  photoId: z.string().uuid(),
  approved: z.boolean(),
})

// Auth: welcome
export const authWelcomeSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
})

// Auto-post
export const autoPostSchema = z.object({
  listingId: z.string().uuid(),
  scheduled: z.boolean().optional(),
})

// Brand
export const brandSchema = z.object({
  brandName: z.string().max(200).optional(),
  color: z.string().max(20).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional().nullable(),
}).passthrough()

// Campaigns
export const campaignsSchema = z.object({
  action: z.string().min(1).max(50).optional(),
  listingId: z.string().uuid().optional(),
  campaignType: z.string().max(50).optional(),
}).passthrough()

// CMA
export const cmaSchema = z.object({
  address: z.string().max(500).optional(),
  bedrooms: z.number().int().min(0).max(99).optional(),
  bathrooms: z.number().min(0).max(99).optional(),
}).passthrough()

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

// Download all
export const downloadAllSchema = z.object({
  listingId: z.string().uuid(),
  format: z.string().max(20).optional(),
})

// Enhance quick
export const enhanceQuickSchema = z.object({
  imageId: z.string().min(1).max(200),
  toolId: z.string().min(1).max(50),
  options: z.record(z.unknown()).optional(),
})

// Feedback
export const feedbackSchema = z.object({
  listingId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comments: z.string().max(5000).optional(),
}).passthrough()

// Human editor
export const humanEditorSchema = z.object({
  photoId: z.string().uuid(),
  instructions: z.string().max(5000).optional(),
}).passthrough()

// Internal: video generate
export const internalVideoGenerateSchema = z.object({
  listingId: z.string().uuid(),
  style: z.string().max(50).optional(),
  videoType: z.string().max(50).optional(),
}).passthrough()

// Listing intelligence: analyze
export const listingIntelligenceAnalyzeSchema = z.object({
  listingId: z.string().uuid(),
  propertyData: z.record(z.unknown()).optional(),
})

// Listing: prepare
export const listingPrepareSchema = z.object({
  listingId: z.string().uuid(),
  priority: z.string().max(20).optional(),
})

// Listing: status update
export const listingStatusSchema = z.object({
  listingId: z.string().uuid(),
  marketingStatus: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
}).passthrough()

// Listings: status
export const listingsStatusSchema = z.object({
  listingId: z.string().uuid(),
  status: z.string().max(50),
})

// Log error (client-side error logging)
export const logErrorSchema = z.object({
  message: z.string().max(5000),
  stack: z.string().max(10000).optional(),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
})

// Marketing: trigger
export const marketingTriggerSchema = z.object({
  listingId: z.string().uuid(),
  triggerType: z.string().max(50).optional(),
})

// Mobile: register device
export const mobileRegisterDeviceSchema = z.object({
  pushToken: z.string().min(1).max(500),
  platform: z.string().max(50).optional(),
  deviceName: z.string().max(200).optional(),
})

// Notify approval
export const notifyApprovalSchema = z.object({
  photoId: z.string().uuid(),
  approvalStatus: z.string().max(50).optional(),
}).passthrough()

// Portfolio create
export const portfolioCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
})

// Portfolio items
export const portfolioItemsSchema = z.object({
  portfolioId: z.string().uuid().optional(),
  items: z.array(z.object({
    beforeUrl: z.string().url().optional(),
    afterUrl: z.string().url().optional(),
    title: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    enhancementType: z.string().max(50).optional(),
    roomType: z.string().max(50).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    toolsUsed: z.array(z.string().max(50)).max(20).optional(),
    listingId: z.string().uuid().optional(),
  })).optional(),
}).passthrough()

// Prepare notification
export const prepareNotificationSchema = z.object({
  listingId: z.string().uuid(),
  type: z.string().max(50).optional(),
  channels: z.array(z.string().max(30)).max(5).optional(),
  data: z.record(z.unknown()).optional(),
})

// Property inquiry (public)
export const propertyInquirySchema = z.object({
  listingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  inquiry: z.string().max(5000).optional(),
})

// Property site (POST - create)
export const propertySiteSchema = z.object({
  listingId: z.string().uuid(),
  slug: z.string().max(200).optional(),
  template: z.string().max(50).optional(),
  customColors: z.record(z.string()).optional(),
  agentInfo: z.record(z.unknown()).optional(),
})

// Property site (PATCH - update)
export const propertySiteUpdateSchema = z.object({
  id: z.string().uuid(),
  is_published: z.boolean().optional(),
  template: z.string().max(50).optional(),
  custom_colors: z.record(z.string()).optional().nullable(),
  agent_info: z.record(z.unknown()).optional().nullable(),
})

// Property site (DELETE)
export const propertySiteDeleteSchema = z.object({
  id: z.string().uuid(),
})

// Publish video
export const publishVideoSchema = z.object({
  listingId: z.string().uuid(),
  videoUrl: z.string().url(),
})

// QR code
export const qrcodeSchema = z.object({
  listingId: z.string().uuid(),
  size: z.number().int().min(100).max(2000).optional(),
})

// Renovation revision
export const renovationRevisionSchema = z.object({
  enhancementId: z.string().min(1).max(200),
  style: z.string().max(100).optional(),
  options: z.record(z.unknown()).optional(),
})

// Renovation
export const renovationSchema = z.object({
  imageUrl: z.string().url(),
  roomType: z.string().max(50).optional(),
  style: z.string().max(100).optional(),
  selectedRenovations: z.array(z.string().max(100)).max(20).optional(),
  detailedOptions: z.record(z.unknown()).optional(),
  model: z.string().max(50).optional(),
  promptStrength: z.number().min(0).max(1).optional(),
  quality: z.string().max(20).optional(),
}).passthrough()

// Reorder photos
export const reorderPhotosSchema = z.object({
  listingId: z.string().uuid(),
  photoOrder: z.array(z.string()).max(200),
})

// Social manage
export const socialManageSchema = z.object({
  action: z.string().min(1).max(50),
  platform: z.string().max(50).optional(),
  data: z.record(z.unknown()).optional(),
})

// Stripe: addon purchase
export const stripeAddonPurchaseSchema = z.object({
  addonType: z.string().min(1).max(50),
  listingId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(100).optional(),
})

// Stripe: human edit checkout
export const stripeHumanEditCheckoutSchema = z.object({
  photoId: z.string().uuid(),
  isUrgent: z.boolean().optional(),
  instructions: z.string().max(5000).optional(),
})

// Teams CRUD
export const teamCreateSchema = z.object({
  name: z.string().min(1).max(200),
})

export const teamUpdateSchema = z.object({
  name: z.string().max(200).optional(),
  logo_url: z.string().url().or(z.literal('')).optional().nullable(),
  settings: z.record(z.unknown()).optional(),
}).passthrough()

export const teamInviteSchema = z.object({
  email: z.string().email(),
  role: z.string().max(50).optional(),
})

export const teamMemberActionSchema = z.object({
  userId: z.string().uuid(),
})

// Translate
export const translateSchema = z.object({
  text: z.string().min(1).max(10000),
  targetLanguage: z.string().min(2).max(10),
})

// Test imagen
export const testImagenSchema = z.object({
  imageUrl: z.string().url(),
})

// Virtual tours
export const virtualTourCreateSchema = z.object({
  listingId: z.string().uuid(),
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  tourType: z.string().max(50).optional(),
  settings: z.record(z.unknown()).optional(),
  scenes: z.array(z.record(z.unknown())).max(100).optional(),
})

// Virtual tour scenes
export const virtualTourSceneSchema = z.object({
  tourId: z.string().uuid(),
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  is360: z.boolean().optional(),
  initialYaw: z.number().optional(),
  initialPitch: z.number().optional(),
  initialZoom: z.number().optional(),
  sortOrder: z.number().int().optional(),
  isStartScene: z.boolean().optional(),
  floorNumber: z.number().int().optional(),
  floorName: z.string().max(100).optional(),
})

// Watermark
export const watermarkSchema = z.object({
  enabled: z.boolean().optional(),
  text: z.string().max(200).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional().nullable(),
  position: z.string().max(30).optional(),
  opacity: z.number().min(0).max(100).optional(),
}).passthrough()

// ============================================
// HELPERS
// ============================================

// Helper: Parse body with schema, return typed result or error response
export function parseBody<T>(schema: z.ZodType<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string; details: ReturnType<z.ZodError['flatten']> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: 'Invalid request body', details: result.error.flatten() }
}
