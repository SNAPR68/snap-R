import { z } from 'zod'

// Shared UUID schema — reusable across all routes
export const uuidSchema = z.string().uuid()

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

// Log error (client-side error logging)
export const logErrorSchema = z.object({
  message: z.string().max(5000),
  stack: z.string().max(10000).optional(),
  url: z.string().max(2000).optional(),
  userAgent: z.string().max(500).optional(),
})

// Jobs update
export const jobUpdateSchema = z.object({
  status: z.string().max(50).optional(),
  progress: z.number().min(0).max(100).optional(),
  result: z.record(z.unknown()).optional(),
}).passthrough()

// Jobs POST (action)
export const jobActionSchema = z.object({
  action: z.enum(['retry']),
  status: z.string().max(50).optional(),
})

// Query params helper
export function parseQuery<T>(schema: z.ZodType<T>, params: Record<string, string | null>):
  { success: true; data: T } | { success: false; error: string; details: ReturnType<z.ZodError['flatten']> } {
  // Strip null values to undefined for Zod
  const cleaned: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== null) cleaned[key] = value
  }
  const result = schema.safeParse(cleaned)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: 'Invalid query parameters', details: result.error.flatten() }
}

// Helper: Parse body with schema, return typed result or error response
export function parseBody<T>(schema: z.ZodType<T>, data: unknown):
  { success: true; data: T } | { success: false; error: string; details: ReturnType<z.ZodError['flatten']> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: 'Invalid request body', details: result.error.flatten() }
}
