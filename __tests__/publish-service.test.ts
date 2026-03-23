import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  publishToFacebook,
  publishToInstagram,
  publishToLinkedIn,
  publishVideoToTikTok,
} from '@/lib/social/publish-service'

// Mock fetch globally
global.fetch = vi.fn()

describe('publish-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // publishToFacebook
  // ============================================

  describe('publishToFacebook', () => {
    it('should publish text-only post successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'post_123', post_id: 'post_123' }),
      } as Response)

      const result = await publishToFacebook(
        'page_token_123',
        'page_id_456',
        { text: 'Hello Facebook!' }
      )

      expect(result.success).toBe(true)
      expect(result.postId).toBe('post_123')
      expect(result.postUrl).toContain('facebook.com')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com'),
        expect.any(Object)
      )
    })

    it('should publish post with single image successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'post_789' }),
      } as Response)

      const result = await publishToFacebook(
        'page_token_123',
        'page_id_456',
        {
          text: 'Check this out!',
          imageUrls: ['https://example.com/image.jpg'],
        }
      )

      expect(result.success).toBe(true)
      expect(result.postId).toBe('post_789')
    })

    it('should publish post with multiple images successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      // First two calls for uploading photos
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'photo_1' }),
      } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'photo_2' }),
      } as Response)
      // Final call for creating the post
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'post_multi' }),
      } as Response)

      const result = await publishToFacebook(
        'page_token_123',
        'page_id_456',
        {
          text: 'Multiple images',
          imageUrls: [
            'https://example.com/img1.jpg',
            'https://example.com/img2.jpg',
          ],
        }
      )

      expect(result.success).toBe(true)
      expect(result.postId).toBe('post_multi')
    })

    it('should handle Facebook API error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid access token',
      } as Response)

      const result = await publishToFacebook(
        'invalid_token',
        'page_id_456',
        { text: 'This will fail' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle network timeout', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      const result = await publishToFacebook(
        'page_token_123',
        'page_id_456',
        { text: 'Timeout test' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    })
  })

  // ============================================
  // publishToInstagram
  // ============================================

  describe('publishToInstagram', () => {
    it('should publish single image post successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      // Create container
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'container_123' }),
      } as Response)
      // Publish container
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'post_ig_123' }),
      } as Response)

      const result = await publishToInstagram(
        'ig_token_123',
        'ig_account_456',
        {
          text: 'Beautiful sunset!',
          imageUrls: ['https://example.com/sunset.jpg'],
        }
      )

      expect(result.success).toBe(true)
      expect(result.postId).toBe('post_ig_123')
      expect(result.postUrl).toContain('instagram.com')
    })

    it('should publish carousel with multiple images successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      // Create child containers
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'child_1' }),
      } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'child_2' }),
      } as Response)
      // Create carousel container
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'carousel_123' }),
      } as Response)
      // Publish carousel
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'post_carousel' }),
      } as Response)

      const result = await publishToInstagram(
        'ig_token_123',
        'ig_account_456',
        {
          text: 'Carousel post',
          imageUrls: [
            'https://example.com/img1.jpg',
            'https://example.com/img2.jpg',
          ],
        }
      )

      expect(result.success).toBe(true)
      expect(result.postId).toBe('post_carousel')
    })

    it('should reject posts without images or video', async () => {
      const result = await publishToInstagram(
        'ig_token_123',
        'ig_account_456',
        { text: 'Text only' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('image or video')
    })

    it('should handle Instagram API error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid account',
      } as Response)

      const result = await publishToInstagram(
        'invalid_token',
        'bad_account',
        {
          text: 'Will fail',
          imageUrls: ['https://example.com/image.jpg'],
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle timeout', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      const result = await publishToInstagram(
        'ig_token_123',
        'ig_account_456',
        {
          text: 'Timeout',
          imageUrls: ['https://example.com/image.jpg'],
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // ============================================
  // publishToLinkedIn
  // ============================================

  describe('publishToLinkedIn', () => {
    it('should publish text-only post successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['x-restli-id', 'urn:li:activity:123']]),
        json: async () => ({}),
      } as unknown as Response)

      const result = await publishToLinkedIn(
        'li_token_123',
        'urn:li:person:456',
        { text: 'Professional update' }
      )

      expect(result.success).toBe(true)
      expect(result.postId).toBeDefined()
      expect(result.postUrl).toContain('linkedin.com')
    })

    it('should publish post with single image successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      // Image upload init
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          value: {
            uploadUrl: 'https://upload.linkedin.com/upload',
            image: 'urn:li:image:123',
          },
        }),
      } as Response)
      // Image download
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      } as Response)
      // Image binary upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as unknown as Response)
      // Post creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['x-restli-id', 'urn:li:activity:789']]),
        json: async () => ({}),
      } as unknown as Response)

      const result = await publishToLinkedIn(
        'li_token_123',
        'urn:li:person:456',
        {
          text: 'Post with image',
          imageUrls: ['https://example.com/image.jpg'],
        }
      )

      expect(result.success).toBe(true)
    })

    it('should handle LinkedIn API error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid credentials',
      } as Response)

      const result = await publishToLinkedIn(
        'invalid_token',
        'urn:li:person:456',
        { text: 'Will fail' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle timeout', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'))

      const result = await publishToLinkedIn(
        'li_token_123',
        'urn:li:person:456',
        { text: 'Timeout test' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // ============================================
  // publishVideoToTikTok
  // ============================================

  describe('publishVideoToTikTok', () => {
    it('should publish video successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: { code: 'ok' },
          data: { publish_id: 'publish_123' },
        }),
      } as Response)

      const result = await publishVideoToTikTok(
        'tiktok_token_123',
        'https://example.com/video.mp4',
        'Check out this content!'
      )

      expect(result.success).toBe(true)
      expect(result.postId).toBe('publish_123')
    })

    it('should handle TikTok API error response', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: { code: 'invalid_token', message: 'Token expired' },
        }),
      } as Response)

      const result = await publishVideoToTikTok(
        'invalid_token',
        'https://example.com/video.mp4',
        'Will fail'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Token expired')
    })

    it('should handle HTTP error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response)

      const result = await publishVideoToTikTok(
        'bad_token',
        'https://example.com/video.mp4',
        'Will fail'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle network error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await publishVideoToTikTok(
        'token',
        'https://example.com/video.mp4',
        'Will fail'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle timeout', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('AbortError'))

      const result = await publishVideoToTikTok(
        'token',
        'https://example.com/video.mp4',
        'Timeout'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // ============================================
  // Shared Response Shape Tests
  // ============================================

  describe('response shapes', () => {
    it('publishToFacebook returns correct success shape', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'post_123' }),
      } as Response)

      const result = await publishToFacebook(
        'token',
        'page',
        { text: 'test' }
      )

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('postId')
      expect(result).toHaveProperty('postUrl')
      expect(result.success).toBe(true)
    })

    it('publishToFacebook returns correct error shape', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error',
      } as Response)

      const result = await publishToFacebook(
        'token',
        'page',
        { text: 'test' }
      )

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('error')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('publishToInstagram returns correct success shape', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'container' }),
      } as Response)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'post_ig' }),
      } as Response)

      const result = await publishToInstagram(
        'token',
        'account',
        { text: 'test', imageUrls: ['https://example.com/img.jpg'] }
      )

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('postId')
      expect(result.success).toBe(true)
    })

    it('publishToLinkedIn returns correct success shape', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['x-restli-id', 'urn:li:activity:123']]),
        json: async () => ({}),
      } as unknown as Response)

      const result = await publishToLinkedIn(
        'token',
        'urn:li:person:123',
        { text: 'test' }
      )

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('postId')
      expect(result).toHaveProperty('postUrl')
      expect(result.success).toBe(true)
    })

    it('publishVideoToTikTok returns correct success shape', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: { code: 'ok' },
          data: { publish_id: 'pub_123' },
        }),
      } as Response)

      const result = await publishVideoToTikTok(
        'token',
        'https://example.com/video.mp4',
        'test'
      )

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('postId')
      expect(result.success).toBe(true)
    })
  })
})
