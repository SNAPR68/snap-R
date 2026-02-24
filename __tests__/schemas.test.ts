/**
 * Tests for lib/validation/schemas.ts — API input validation
 * ============================================================
 * Every API route validates inputs through these Zod schemas.
 * A broken schema means either accepting malicious input or
 * rejecting valid requests from the UI.
 */

import { describe, it, expect } from 'vitest'
import {
  stripeCheckoutSchema,
  schedulePostSchema,
  partnerApplySchema,
  socialPublishSchema,
  analyticsPostSchema,
  enhanceSchema,
  shareSchema,
  generateVideoSchema,
  videoStatusSchema,
  parseBody,
} from '@/lib/validation/schemas'

// ── stripeCheckoutSchema ──

describe('stripeCheckoutSchema', () => {
  it('accepts valid checkout data', () => {
    expect(stripeCheckoutSchema.safeParse({ plan: 'pro' }).success).toBe(true)
    expect(stripeCheckoutSchema.safeParse({ plan: 'pro', listings: 15, billing: 'monthly' }).success).toBe(true)
    expect(stripeCheckoutSchema.safeParse({ plan: 'agency', billing: 'annual' }).success).toBe(true)
  })

  it('rejects empty plan', () => {
    expect(stripeCheckoutSchema.safeParse({ plan: '' }).success).toBe(false)
  })

  it('rejects invalid billing period', () => {
    expect(stripeCheckoutSchema.safeParse({ plan: 'pro', billing: 'weekly' }).success).toBe(false)
  })

  it('rejects listings out of range', () => {
    expect(stripeCheckoutSchema.safeParse({ plan: 'pro', listings: 0 }).success).toBe(false)
    expect(stripeCheckoutSchema.safeParse({ plan: 'pro', listings: 301 }).success).toBe(false)
  })

  it('allows listings at boundary values', () => {
    expect(stripeCheckoutSchema.safeParse({ plan: 'pro', listings: 1 }).success).toBe(true)
    expect(stripeCheckoutSchema.safeParse({ plan: 'pro', listings: 300 }).success).toBe(true)
  })
})

// ── schedulePostSchema ──

describe('schedulePostSchema', () => {
  const validPost = {
    platform: 'instagram',
    scheduledFor: '2026-03-01T10:00:00.000Z',
  }

  it('accepts valid scheduled post', () => {
    expect(schedulePostSchema.safeParse(validPost).success).toBe(true)
  })

  it('accepts all supported platforms', () => {
    for (const platform of ['instagram', 'facebook', 'linkedin', 'tiktok']) {
      expect(
        schedulePostSchema.safeParse({ ...validPost, platform }).success
      ).toBe(true)
    }
  })

  it('rejects unsupported platform', () => {
    expect(
      schedulePostSchema.safeParse({ ...validPost, platform: 'twitter' }).success
    ).toBe(false)
  })

  it('rejects invalid datetime', () => {
    expect(
      schedulePostSchema.safeParse({ ...validPost, scheduledFor: 'not-a-date' }).success
    ).toBe(false)
  })

  it('accepts optional fields', () => {
    expect(
      schedulePostSchema.safeParse({
        ...validPost,
        listingId: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Check out this property!',
        imageUrls: ['https://example.com/photo.jpg'],
      }).success
    ).toBe(true)
  })

  it('rejects too many images', () => {
    const urls = Array.from({ length: 11 }, (_, i) => `https://example.com/photo${i}.jpg`)
    expect(
      schedulePostSchema.safeParse({ ...validPost, imageUrls: urls }).success
    ).toBe(false)
  })
})

// ── socialPublishSchema ──

describe('socialPublishSchema', () => {
  it('accepts valid publish data', () => {
    expect(
      socialPublishSchema.safeParse({
        platform: 'facebook',
        content: 'New listing alert!',
      }).success
    ).toBe(true)
  })

  it('rejects empty content', () => {
    expect(
      socialPublishSchema.safeParse({
        platform: 'facebook',
        content: '',
      }).success
    ).toBe(false)
  })

  it('rejects content over 5000 chars', () => {
    expect(
      socialPublishSchema.safeParse({
        platform: 'facebook',
        content: 'x'.repeat(5001),
      }).success
    ).toBe(false)
  })
})

// ── enhanceSchema ──

describe('enhanceSchema', () => {
  it('accepts valid enhance request', () => {
    expect(
      enhanceSchema.safeParse({
        photoId: '550e8400-e29b-41d4-a716-446655440000',
        toolId: 'sky-replacement',
      }).success
    ).toBe(true)
  })

  it('accepts with optional preset and listingId', () => {
    expect(
      enhanceSchema.safeParse({
        photoId: '550e8400-e29b-41d4-a716-446655440000',
        toolId: 'sky-replacement',
        preset: 'sunset',
        listingId: '660e8400-e29b-41d4-a716-446655440001',
      }).success
    ).toBe(true)
  })

  it('rejects non-UUID photoId', () => {
    expect(
      enhanceSchema.safeParse({
        photoId: 'not-a-uuid',
        toolId: 'sky-replacement',
      }).success
    ).toBe(false)
  })

  it('rejects empty toolId', () => {
    expect(
      enhanceSchema.safeParse({
        photoId: '550e8400-e29b-41d4-a716-446655440000',
        toolId: '',
      }).success
    ).toBe(false)
  })
})

// ── shareSchema ──

describe('shareSchema', () => {
  it('accepts valid share request', () => {
    expect(
      shareSchema.safeParse({
        listingId: '550e8400-e29b-41d4-a716-446655440000',
      }).success
    ).toBe(true)
  })

  it('accepts with options', () => {
    expect(
      shareSchema.safeParse({
        listingId: '550e8400-e29b-41d4-a716-446655440000',
        options: {
          allowDownload: true,
          showComparison: false,
          password: 'secret',
          expiresIn: 30,
        },
      }).success
    ).toBe(true)
  })

  it('rejects expiresIn over 365 days', () => {
    expect(
      shareSchema.safeParse({
        listingId: '550e8400-e29b-41d4-a716-446655440000',
        options: { expiresIn: 400 },
      }).success
    ).toBe(false)
  })
})

// ── generateVideoSchema ──

describe('generateVideoSchema', () => {
  const validVideo = {
    listingId: '550e8400-e29b-41d4-a716-446655440000',
    aspectRatio: '9:16' as const,
    template: 'property-showcase' as const,
  }

  it('accepts valid video generation request', () => {
    expect(generateVideoSchema.safeParse(validVideo).success).toBe(true)
  })

  it('accepts all aspect ratios', () => {
    for (const ratio of ['9:16', '1:1', '16:9'] as const) {
      expect(
        generateVideoSchema.safeParse({ ...validVideo, aspectRatio: ratio }).success
      ).toBe(true)
    }
  })

  it('accepts all templates', () => {
    for (const template of ['test', 'property-showcase', 'just-listed', 'open-house', 'price-drop', 'sold'] as const) {
      expect(
        generateVideoSchema.safeParse({ ...validVideo, template }).success
      ).toBe(true)
    }
  })

  it('rejects invalid template', () => {
    expect(
      generateVideoSchema.safeParse({ ...validVideo, template: 'random' }).success
    ).toBe(false)
  })

  it('accepts optional audio config', () => {
    expect(
      generateVideoSchema.safeParse({
        ...validVideo,
        audio: {
          musicTrack: 'upbeat',
          musicVolume: 50,
          voiceoverUrl: 'https://cdn.example.com/voice.mp3',
          voiceoverVolume: 80,
        },
      }).success
    ).toBe(true)
  })
})

// ── partnerApplySchema ──

describe('partnerApplySchema', () => {
  const validPartner = {
    name: 'John Smith',
    email: 'john@example.com',
    partner_type: 'agent' as const,
  }

  it('accepts valid partner application', () => {
    expect(partnerApplySchema.safeParse(validPartner).success).toBe(true)
  })

  it('accepts all partner types', () => {
    for (const type of ['agent', 'photographer', 'broker', 'vendor', 'other'] as const) {
      expect(
        partnerApplySchema.safeParse({ ...validPartner, partner_type: type }).success
      ).toBe(true)
    }
  })

  it('rejects name under 2 characters', () => {
    expect(
      partnerApplySchema.safeParse({ ...validPartner, name: 'J' }).success
    ).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(
      partnerApplySchema.safeParse({ ...validPartner, email: 'not-email' }).success
    ).toBe(false)
  })
})

// ── analyticsPostSchema ──

describe('analyticsPostSchema', () => {
  it('accepts valid analytics post', () => {
    expect(
      analyticsPostSchema.safeParse({
        platform: 'instagram',
        listingId: '550e8400-e29b-41d4-a716-446655440000',
      }).success
    ).toBe(true)
  })

  it('rejects non-UUID listingId', () => {
    expect(
      analyticsPostSchema.safeParse({
        platform: 'instagram',
        listingId: 'not-uuid',
      }).success
    ).toBe(false)
  })
})

// ── videoStatusSchema ──

describe('videoStatusSchema', () => {
  it('accepts valid render ID', () => {
    expect(
      videoStatusSchema.safeParse({ renderId: 'render-abc-123' }).success
    ).toBe(true)
  })

  it('rejects empty render ID', () => {
    expect(
      videoStatusSchema.safeParse({ renderId: '' }).success
    ).toBe(false)
  })
})

// ── parseBody helper ──

describe('parseBody', () => {
  it('returns success with parsed data for valid input', () => {
    const result = parseBody(enhanceSchema, {
      photoId: '550e8400-e29b-41d4-a716-446655440000',
      toolId: 'hdr',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.toolId).toBe('hdr')
    }
  })

  it('returns error with details for invalid input', () => {
    const result = parseBody(enhanceSchema, {
      photoId: 'bad',
      toolId: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Invalid request body')
      expect(result.details).toBeDefined()
    }
  })

  it('returns error for completely wrong shape', () => {
    const result = parseBody(enhanceSchema, { foo: 'bar' })
    expect(result.success).toBe(false)
  })
})
