import { z } from 'zod'

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

// Listing intelligence: analyze
export const listingIntelligenceAnalyzeSchema = z.object({
  listingId: z.string().uuid(),
  propertyData: z.record(z.unknown()).optional(),
})

// Listing intelligence update
export const listingIntelligenceUpdateSchema = z.object({
  status: z.string().max(50).optional(),
  insights: z.record(z.unknown()).optional(),
}).passthrough()

// Listing intelligence PATCH (mark recommendation applied)
export const listingIntelligencePatchSchema = z.object({
  recommendationId: z.string().uuid(),
  resultUrl: z.string().url().optional().nullable(),
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

// MLS import
export const mlsImportSchema = z.object({
  mlsNumber: z.string().min(1).max(50),
  provider: z.string().max(50).optional().default('simplyrets'),
})

// Reorder photos
export const reorderPhotosSchema = z.object({
  listingId: z.string().uuid(),
  photoOrder: z.array(z.string()).max(200),
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

// Property inquiry (public)
export const propertyInquirySchema = z.object({
  listingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  inquiry: z.string().max(5000).optional(),
  message: z.string().max(5000).optional(),
  listingAddress: z.string().max(500).optional(),
  agentEmail: z.string().email().optional(),
})

// Print materials (flyer / feature sheet)
export const printMaterialsSchema = z.object({
  listingId: z.string().uuid(),
  type: z.enum(['flyer', 'feature-sheet']),
})

// Download all
export const downloadAllSchema = z.object({
  listingId: z.string().uuid(),
  format: z.string().max(20).optional(),
})

// Download all (ZIP)
export const downloadAllExtendedSchema = z.object({
  listingId: z.string().uuid(),
})

// Download query params
export const downloadQuerySchema = z.object({
  url: z.string().url().optional(),
  filename: z.string().max(500).optional(),
  photoId: z.string().uuid().optional(),
})

// Download approved query params
export const downloadApprovedQuerySchema = z.object({
  listingId: z.string().uuid(),
})

// QR code
export const qrcodeSchema = z.object({
  listingId: z.string().uuid(),
  size: z.number().int().min(100).max(2000).optional(),
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

// Virtual tour generate
export const virtualTourGenerateSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
})

// CMA
export const cmaSchema = z.object({
  address: z.string().max(500).optional(),
  bedrooms: z.number().int().min(0).max(99).optional(),
  bathrooms: z.number().min(0).max(99).optional(),
}).passthrough()

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

// Floor plans
export const floorPlanGenerateSchema = z.object({
  listingId: z.string().uuid(),
})
