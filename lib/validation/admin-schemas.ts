import { z } from 'zod'

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
