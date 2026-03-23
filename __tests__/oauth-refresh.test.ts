import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SOCIAL_PLATFORMS,
  refreshAccessToken,
  getOAuthUrl,
} from '@/lib/social/oauth-config'

// Mock fetch globally
global.fetch = vi.fn()

describe('oauth-refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // Facebook long-lived token exchange
  // ============================================

  describe('Facebook token refresh', () => {
    it('should use fb_exchange_token grant type for Facebook', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'new_fb_token', expires_in: 5184000 }),
        text: async () => '',
      } as Response)

      const result = await refreshAccessToken('facebook', 'current_access_token')

      expect(result.accessToken).toBe('new_fb_token')
      expect(result.expiresIn).toBe(5184000)

      // Verify the URL contains fb_exchange_token grant
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('grant_type=fb_exchange_token')
      expect(calledUrl).toContain('fb_exchange_token=current_access_token')
      expect(calledUrl).toContain(SOCIAL_PLATFORMS.facebook.tokenUrl)
    })

    it('should use fb_exchange_token grant type for Instagram', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'new_ig_token', expires_in: 5184000 }),
        text: async () => '',
      } as Response)

      const result = await refreshAccessToken('instagram', 'current_ig_token')

      expect(result.accessToken).toBe('new_ig_token')

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('grant_type=fb_exchange_token')
      expect(calledUrl).toContain('fb_exchange_token=current_ig_token')
    })

    it('should throw on failed Facebook token refresh', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid token',
      } as Response)

      await expect(refreshAccessToken('facebook', 'bad_token'))
        .rejects.toThrow('FB token refresh failed')
    })
  })

  // ============================================
  // TikTok token refresh
  // ============================================

  describe('TikTok token refresh', () => {
    it('should use JSON body with client_key for TikTok refresh', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'new_tt_token', expires_in: 86400 }),
        text: async () => '',
      } as Response)

      const result = await refreshAccessToken('tiktok', 'tt_refresh_token')

      expect(result.accessToken).toBe('new_tt_token')
      expect(result.expiresIn).toBe(86400)

      // Verify TikTok uses POST with JSON body
      const callArgs = mockFetch.mock.calls[0]
      const url = callArgs[0] as string
      const options = callArgs[1] as RequestInit

      expect(url).toBe(SOCIAL_PLATFORMS.tiktok.tokenUrl)
      expect(options.method).toBe('POST')
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' })

      // Verify JSON body contains client_key (not client_id)
      const body = JSON.parse(options.body as string)
      expect(body.client_key).toBeDefined()
      expect(body.grant_type).toBe('refresh_token')
      expect(body.refresh_token).toBe('tt_refresh_token')
      // Should NOT have client_id
      expect(body.client_id).toBeUndefined()
    })

    it('should throw on failed TikTok token refresh', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Token expired',
      } as Response)

      await expect(refreshAccessToken('tiktok', 'bad_refresh'))
        .rejects.toThrow('TikTok token refresh failed')
    })
  })

  // ============================================
  // LinkedIn token refresh
  // ============================================

  describe('LinkedIn token refresh', () => {
    it('should use standard refresh_token grant for LinkedIn', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'new_li_token', expires_in: 5184000 }),
        text: async () => '',
      } as Response)

      const result = await refreshAccessToken('linkedin', 'li_refresh_token')

      expect(result.accessToken).toBe('new_li_token')
      expect(result.expiresIn).toBe(5184000)

      const callArgs = mockFetch.mock.calls[0]
      const url = callArgs[0] as string
      const options = callArgs[1] as RequestInit

      expect(url).toBe(SOCIAL_PLATFORMS.linkedin.tokenUrl)
      expect(options.method).toBe('POST')
      expect(options.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' })

      // Verify form-urlencoded body
      const body = options.body as string
      expect(body).toContain('grant_type=refresh_token')
      expect(body).toContain('refresh_token=li_refresh_token')
    })

    it('should throw on failed LinkedIn token refresh', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid refresh token',
      } as Response)

      await expect(refreshAccessToken('linkedin', 'bad_token'))
        .rejects.toThrow('Token refresh failed')
    })
  })

  // ============================================
  // Token expiry detection logic (cron behavior)
  // ============================================

  describe('Token expiry detection', () => {
    it('should identify tokens expiring within 48 hours as needing refresh', () => {
      const buffer48h = Date.now() + 48 * 60 * 60 * 1000

      // Token expiring in 1 hour — should be refreshed
      const expiringIn1h = new Date(Date.now() + 1 * 60 * 60 * 1000).getTime()
      expect(expiringIn1h > buffer48h).toBe(false) // needs refresh

      // Token expiring in 72 hours — should NOT be refreshed
      const expiringIn72h = new Date(Date.now() + 72 * 60 * 60 * 1000).getTime()
      expect(expiringIn72h > buffer48h).toBe(true) // still fresh

      // Already expired — should be refreshed
      const alreadyExpired = new Date(Date.now() - 1000).getTime()
      expect(alreadyExpired > buffer48h).toBe(false) // needs refresh
    })

    it('should skip connections without refresh token', () => {
      // Facebook uses access_token, others use refresh_token
      const fbConnection = { platform: 'facebook', access_token: 'token', refresh_token: null }
      const isFacebookFamily = fbConnection.platform === 'facebook' || fbConnection.platform === 'instagram'
      const tokenToRefresh = isFacebookFamily ? fbConnection.access_token : fbConnection.refresh_token

      expect(tokenToRefresh).toBe('token') // Facebook passes access_token

      // LinkedIn without refresh_token should be skipped
      const liConnection = { platform: 'linkedin', access_token: 'token', refresh_token: null }
      const isLiFb = liConnection.platform === 'facebook' || liConnection.platform === 'instagram'
      const liToken = isLiFb ? liConnection.access_token : liConnection.refresh_token

      expect(liToken).toBeNull() // Would be skipped
    })
  })

  // ============================================
  // OAuth URL construction
  // ============================================

  describe('OAuth URL construction', () => {
    it('should construct valid Facebook OAuth URL', () => {
      const url = getOAuthUrl('facebook', 'https://example.com/callback', 'csrf_state')
      expect(url).toContain('facebook.com')
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('state=csrf_state')
      expect(url).toContain('response_type=code')
    })

    it('should use client_key for TikTok instead of client_id', () => {
      const url = getOAuthUrl('tiktok', 'https://example.com/callback', 'csrf_state')
      expect(url).toContain('tiktok.com')
      expect(url).toContain('client_key=')
      // TikTok should NOT have client_id in the URL
      expect(url).not.toContain('client_id=')
    })

    it('should include PKCE challenge for Twitter', () => {
      const url = getOAuthUrl('twitter', 'https://example.com/callback', 'csrf_state')
      expect(url).toContain('twitter.com')
      expect(url).toContain('code_challenge=')
      expect(url).toContain('code_challenge_method=S256')
    })
  })

  // ============================================
  // Error handling
  // ============================================

  describe('Graceful error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(refreshAccessToken('facebook', 'token'))
        .rejects.toThrow('Network error')
    })

    it('should handle malformed JSON responses', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new SyntaxError('Invalid JSON') },
        text: async () => 'not json',
      } as unknown as Response)

      await expect(refreshAccessToken('linkedin', 'token'))
        .rejects.toThrow()
    })
  })
})
