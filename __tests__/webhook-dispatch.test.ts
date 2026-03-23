import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'

// Mock fetch and supabase
global.fetch = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: vi.fn(() => {
    const mockChain = {
      select: vi.fn(),
      eq: vi.fn(),
      contains: vi.fn(),
      insert: vi.fn(async () => ({ error: null })),
    }
    mockChain.select.mockReturnValue(mockChain)
    mockChain.eq.mockReturnValue(mockChain)
    mockChain.contains.mockReturnValue(mockChain)
    return {
      from: vi.fn((table) => mockChain),
    }
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

describe('webhook-dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('dispatchWebhookEvent', () => {
    it('should send POST request with correct signature when secret is provided', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Success',
      } as Response)

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      // Mock webhook query
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhooks',
              secret: 'secret_key_123',
              events: ['lead.created'],
            },
          ],
          error: null,
        })),
      } as any)

      await dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456', email: 'test@example.com' }
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhooks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-SnapR-Signature': expect.any(String),
          }),
          body: expect.any(String),
        })
      )
    })

    it('should send POST request without signature when secret is null', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Success',
      } as Response)

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhooks',
              secret: null,
              events: ['post.published'],
            },
          ],
          error: null,
        })),
      } as any)

      await dispatchWebhookEvent(
        'user_123',
        'post.published',
        { postId: 'post_789' }
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhooks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.not.objectContaining({
            'X-SnapR-Signature': expect.anything(),
          }),
        })
      )
    })

    it('should handle no active webhooks gracefully', async () => {
      const mockFetch = vi.mocked(fetch)

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [],
          error: null,
        })),
      } as any)

      await dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_999' }
      )

      // Should not make any fetch calls if no webhooks
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should retry on 5xx status code', async () => {
      const mockFetch = vi.mocked(fetch)
      // First attempt: 500 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response)
      // Second attempt: 503 error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable',
      } as Response)
      // Third attempt: success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Success',
      } as Response)

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhooks',
              secret: null,
              events: ['lead.created'],
            },
          ],
          error: null,
        })),
      } as any)

      // Mock the insert for webhook_deliveries
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: vi.fn(async () => ({ error: null })),
      } as any)

      await dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456' }
      )

      // Should have retried 3 times (1 initial + 2 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should not retry on 4xx status code', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response)

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhooks',
              secret: null,
              events: ['lead.created'],
            },
          ],
          error: null,
        })),
      } as any)

      // Mock the insert for webhook_deliveries
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: vi.fn(async () => ({ error: null })),
      } as any)

      await dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456' }
      )

      // Should only try once for 4xx error
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle webhook URL returning 500 error', async () => {
      const mockFetch = vi.mocked(fetch)
      // All retries fail with 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      } as Response)

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhooks',
              secret: null,
              events: ['lead.created'],
            },
          ],
          error: null,
        })),
      } as any)

      // Mock the insert for webhook_deliveries
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: vi.fn(async () => ({ error: null })),
      } as any)

      // Should not throw
      await expect(
        dispatchWebhookEvent(
          'user_123',
          'lead.created',
          { leadId: 'lead_456' }
        )
      ).resolves.toBeUndefined()

      // Should have attempted 3 times
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should never throw - always complete semantics', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhooks',
              secret: null,
              events: ['lead.created'],
            },
          ],
          error: null,
        })),
      } as any)

      // Mock the insert for webhook_deliveries
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: vi.fn(async () => ({ error: null })),
      } as any)

      // Should not throw even with network error
      await expect(
        dispatchWebhookEvent(
          'user_123',
          'lead.created',
          { leadId: 'lead_456' }
        )
      ).resolves.toBeUndefined()
    })

    it('should log delivery results to webhook_deliveries table', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Success',
      } as Response)

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      const mockInsert = vi.fn().mockResolvedValueOnce({ error: null })

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhooks',
              secret: null,
              events: ['lead.created'],
            },
          ],
          error: null,
        })),
      } as any)

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: mockInsert,
      } as any)

      await dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456' }
      )

      // Verify delivery was logged
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook_id: 'webhook_1',
          event: 'lead.created',
          success: true,
          status_code: 200,
        })
      )
    })

    it('should include payload and timestamp in webhook request', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Success',
      } as Response)

      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn(async () => ({
          data: [
            {
              id: 'webhook_1',
              url: 'https://example.com/webhooks',
              secret: null,
              events: ['post.published'],
            },
          ],
          error: null,
        })),
      } as any)

      // Mock the insert for webhook_deliveries
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        insert: vi.fn(async () => ({ error: null })),
      } as any)

      const payload = { postId: 'post_123', platform: 'twitter' }
      await dispatchWebhookEvent(
        'user_456',
        'post.published',
        payload
      )

      const callArgs = mockFetch.mock.calls[0]
      const requestBody = JSON.parse(callArgs[1]!.body as string)

      expect(requestBody).toHaveProperty('event', 'post.published')
      expect(requestBody).toHaveProperty('data')
      expect(requestBody.data).toEqual(payload)
      expect(requestBody).toHaveProperty('timestamp')
    })
  })
})
