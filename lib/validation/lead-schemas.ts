import { z } from 'zod'

// Leads — Bulk email, submit, status
export const bulkEmailSendSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(200),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20000),
  fromName: z.string().max(100).optional(),
})

export const leadSubmitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').max(200),
  phone: z.string().max(30).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  listingId: z.string().uuid().optional().nullable(),
  propertySiteId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid(), // The agent who owns the listing
  listingAddress: z.string().max(500).optional().nullable(),
  agentEmail: z.string().email().optional().nullable(),
  // UTM attribution
  utmSource: z.string().max(100).optional().nullable(),
  utmMedium: z.string().max(100).optional().nullable(),
  utmCampaign: z.string().max(100).optional().nullable(),
  utmContent: z.string().max(200).optional().nullable(),
})

export const leadStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'archived']),
})

// Chat — Public chat message
export const chatMessageSchema = z.object({
  sessionId: z.string().uuid().optional(),
  propertySiteId: z.string().uuid(),
  listingId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  visitorId: z.string().min(1).max(100),
  visitorName: z.string().max(200).optional(),
  visitorEmail: z.string().email().max(200).optional(),
  visitorPhone: z.string().max(30).optional(),
})
