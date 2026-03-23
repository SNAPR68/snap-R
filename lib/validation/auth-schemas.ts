import { z } from 'zod'

// Auth: welcome
export const authWelcomeSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
})

// Auth: password changed
export const passwordChangedSchema = z.object({
  email: z.string().email(),
})

// Contact form
export const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  message: z.string().min(1).max(5000),
})

// Notify (iOS waitlist)
export const notifySchema = z.object({
  email: z.string().email().max(200),
})

// Guide request (lead magnet)
export const guideRequestSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(200).optional(),
  source: z.enum(['homepage', 'guide-page', 'other']).optional(),
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

// Stripe checkout
export const stripeCheckoutSchema = z.object({
  plan: z.string().min(1).max(30),
  listings: z.number().int().min(1).max(300).optional(),
  billing: z.enum(['monthly', 'annual', 'paygo']).optional(),
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

// Teams join
export const teamsJoinQuerySchema = z.object({
  code: z.string().min(1).max(200),
})

// User delete account is handled in route directly

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

// Mobile: register device
export const mobileRegisterDeviceSchema = z.object({
  pushToken: z.string().min(1).max(500),
  platform: z.string().max(50).optional(),
  deviceName: z.string().max(200).optional(),
})

// Feedback
export const feedbackSchema = z.object({
  listingId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comments: z.string().max(5000).optional(),
}).passthrough()

// Notifications query
export const notificationsQuerySchema = z.object({
  unread: z.string().optional(),
  limit: z.string().optional(),
})

// Prepare notification
export const prepareNotificationSchema = z.object({
  listingId: z.string().uuid(),
  type: z.string().max(50).optional(),
  channels: z.array(z.string().max(30)).max(5).optional(),
  data: z.record(z.unknown()).optional(),
})

// Notify — SMS / WhatsApp (shared schema)
export const notifyMessageSchema = z.object({
  to: z.string().min(10),               // phone number
  message: z.string().min(1).max(1600),
  listingId: z.string().uuid().optional(),
})

// Domains — Create, delete
export const domainCreateSchema = z.object({
  domain: z.string().min(3).max(253).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i, 'Invalid domain format'),
  target_type: z.enum(['property_site', 'portfolio', 'organization']).default('property_site'),
  target_id: z.string().uuid().optional(),
})

export const domainDeleteSchema = z.object({
  id: z.string().uuid(),
})

// API key create
export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string().max(50)).max(20).optional(),
  expires_in_days: z.number().int().min(1).max(365).optional(),
})
