import { describe, it, expect, beforeEach, vi } from 'vitest'

interface WebhookData {
  id: string
  url: string
  secret: string | null
  events: string[]
}

// Shared mock state — every call to adminSupabase() returns the SAME object
const mockInsert = vi.fn(async () => ({ error: null }))
const mockContains = vi.fn(async (): Promise<{ data: WebhookData[]; error: null }> => ({ data: [], error: null }))

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  contains: mockContains,
  insert: mockInsert,
}

const mockFrom = vi.fn(() => mockChain)

vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock fetch globally
global.fetch = vi.fn()

// Must import AFTER mocks are set up
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'

describe('webhook-dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default behaviors
    mockInsert.mockImplementation(async () => ({ error: null }))
    mockContains.mockImplementation(async () => ({ data: [], error: null }))
    mockChain.select.mockReturnThis()
    mockChain.eq.mockReturnThis()
    mockFrom.mockReturnValue(mockChain)
  })

  describe('dispatchWebhookEvent', () => {
    it('should send POST request with correct signature when secret is provided', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Success',
      } as Response)

      // Configure the mock to return webhooks when querying outgoing_webhooks
      mockContains.mockResolvedValueOnce({
        data: [
          {
            id: 'webhook_1',
            url: 'https://example.com/webhooks',
            secret: 'secret_key_123',
            events: ['lead.created'],
          },
        ],
        error: null,
      })

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

      mockContains.mockResolvedValueOnce({
        data: [
          {
            id: 'webhook_1',
            url: 'https://example.com/webhooks',
            secret: null,
            events: ['post.published'],
          },
        ],
        error: null,
      })

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

      mockContains.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      await dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_999' }
      )

      // Should not make any fetch calls if no webhooks
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should retry on 5xx status code', async () => {
      vi.useFakeTimers()
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

      mockContains.mockResolvedValueOnce({
        data: [
          {
            id: 'webhook_1',
            url: 'https://example.com/webhooks',
            secret: null,
            events: ['lead.created'],
          },
        ],
        error: null,
      })

      const promise = dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456' }
      )

      // Advance timers through the retry delays
      await vi.advanceTimersByTimeAsync(1000)  // 1s delay after 1st attempt
      await vi.advanceTimersByTimeAsync(4000)  // 4s delay after 2nd attempt

      await promise

      // Should have retried 3 times (1 initial + 2 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3)

      vi.useRealTimers()
    })

    it('should not retry on 4xx status code', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response)

      mockContains.mockResolvedValueOnce({
        data: [
          {
            id: 'webhook_1',
            url: 'https://example.com/webhooks',
            secret: null,
            events: ['lead.created'],
          },
        ],
        error: null,
      })

      await dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456' }
      )

      // Should only try once for 4xx error
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle webhook URL returning 500 error', async () => {
      vi.useFakeTimers()
      const mockFetch = vi.mocked(fetch)

      // All retries fail with 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      } as Response)

      mockContains.mockResolvedValueOnce({
        data: [
          {
            id: 'webhook_1',
            url: 'https://example.com/webhooks',
            secret: null,
            events: ['lead.created'],
          },
        ],
        error: null,
      })

      const promise = dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456' }
      )

      // Advance through retry delays
      await vi.advanceTimersByTimeAsync(1000)   // 1s after attempt 1
      await vi.advanceTimersByTimeAsync(4000)   // 4s after attempt 2

      // Should not throw
      await expect(promise).resolves.toBeUndefined()

      // Should have attempted 3 times
      expect(mockFetch).toHaveBeenCalledTimes(3)

      vi.useRealTimers()
    })

    it('should never throw - always complete semantics', async () => {
      vi.useFakeTimers()
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error('Network error'))

      mockContains.mockResolvedValueOnce({
        data: [
          {
            id: 'webhook_1',
            url: 'https://example.com/webhooks',
            secret: null,
            events: ['lead.created'],
          },
        ],
        error: null,
      })

      const promise = dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456' }
      )

      // Advance through retry delays
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(4000)

      // Should not throw even with network error
      await expect(promise).resolves.toBeUndefined()

      vi.useRealTimers()
    })

    it('should log delivery results to webhook_deliveries table', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'Success',
      } as Response)

      mockContains.mockResolvedValueOnce({
        data: [
          {
            id: 'webhook_1',
            url: 'https://example.com/webhooks',
            secret: null,
            events: ['lead.created'],
          },
        ],
        error: null,
      })

      await dispatchWebhookEvent(
        'user_123',
        'lead.created',
        { leadId: 'lead_456' }
      )

      // Verify delivery was logged via insert call on webhook_deliveries
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

      mockContains.mockResolvedValueOnce({
        data: [
          {
            id: 'webhook_1',
            url: 'https://example.com/webhooks',
            secret: null,
            events: ['post.published'],
          },
        ],
        error: null,
      })

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
