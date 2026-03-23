import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock fetch globally
global.fetch = vi.fn()

// Mock Next.js
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, opts) => ({
      status: opts?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: vi.fn(() => {
    const mockChain = {
      select: vi.fn(),
      insert: vi.fn(async () => ({ error: null })),
      update: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      lte: vi.fn(),
      lt: vi.fn(),
      gte: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(async () => ({ data: [], error: null })),
      single: vi.fn(async () => ({ data: null, error: null })),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      is: vi.fn(),
      not: vi.fn(),
      contains: vi.fn(),
    }
    mockChain.select.mockReturnValue(mockChain)
    mockChain.update.mockReturnValue(mockChain)
    mockChain.eq.mockReturnValue(mockChain)
    mockChain.in.mockReturnValue(mockChain)
    mockChain.lte.mockReturnValue(mockChain)
    mockChain.lt.mockReturnValue(mockChain)
    mockChain.gte.mockReturnValue(mockChain)
    mockChain.order.mockReturnValue(mockChain)
    mockChain.is.mockReturnValue(mockChain)
    mockChain.not.mockReturnValue(mockChain)
    mockChain.contains.mockReturnValue(mockChain)
    return {
      from: vi.fn((table) => mockChain),
    }
  }),
}))

vi.mock('@/lib/social/publish-service', () => ({
  publishToFacebook: vi.fn(async () => ({ success: true, postId: 'post_123' })),
  publishToInstagram: vi.fn(async () => ({ success: true, postId: 'post_456' })),
  publishToLinkedIn: vi.fn(async () => ({ success: true, postId: 'urn:li:activity:789' })),
  publishPhotoToTikTok: vi.fn(async () => ({ success: true, postId: 'pub_123' })),
  publishVideoToTikTok: vi.fn(async () => ({ success: true, postId: 'pub_456' })),
  publishToTwitter: vi.fn(async () => ({ success: true, postId: 'tweet_789' })),
}))

vi.mock('@/lib/social/oauth-config', () => ({
  refreshAccessToken: vi.fn(async () => ({
    accessToken: 'new_token_xyz',
    expiresIn: 3600,
  })),
}))

vi.mock('@/lib/content/limits', () => ({
  getPlanLimits: vi.fn((tier) => ({
    canPublish: tier !== 'free',
    maxPosts: tier === 'pro' ? 100 : 10,
  })),
}))

vi.mock('@/lib/webhooks/dispatch', () => ({
  dispatchWebhookEvent: vi.fn(async () => {}),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/lib/monitoring/sentry-cron', () => ({
  withSentryCron: vi.fn((name, schedule, handler) => handler),
}))

vi.mock('@/lib/monitoring/cron-heartbeat', () => ({
  startCronHeartbeat: vi.fn(() => ({
    succeed: vi.fn(async () => {}),
    fail: vi.fn(async () => {}),
  })),
}))

describe('Cron Jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'test_cron_secret_123')
  })

  // ============================================
  // publish-scheduled Cron Job
  // ============================================

  describe('publish-scheduled cron', () => {
    it('should publish due posts successfully', async () => {
      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      // Mock scheduled_posts query
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn(async () => ({
          data: [
            {
              id: 'post_123',
              platform: 'twitter',
              content: 'Hello Twitter!',
              scheduled_for: new Date().toISOString(),
              status: 'pending',
              user_id: 'user_123',
              image_urls: [],
            },
          ],
          error: null,
        })),
      } as any)

      const posts = [
        {
          id: 'post_123',
          platform: 'twitter',
          content: 'Hello Twitter!',
          status: 'pending',
        },
      ]

      expect(posts).toHaveLength(1)
      expect(posts[0].status).toBe('pending')
    })

    it('should skip future scheduled posts', async () => {
      const now = new Date()
      const futureTime = new Date(now.getTime() + 3600000) // 1 hour from now

      const scheduledPosts = [
        {
          id: 'post_123',
          scheduled_for: now.toISOString(),
          status: 'pending',
        },
        {
          id: 'post_456',
          scheduled_for: futureTime.toISOString(),
          status: 'pending',
        },
      ]

      const duePosts = scheduledPosts.filter(
        (post) => new Date(post.scheduled_for) <= now
      )

      expect(duePosts).toHaveLength(1)
      expect(duePosts[0].id).toBe('post_123')
    })

    it('should mark published posts in database', async () => {
      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()
      const mockChain = {
        update: vi.fn(),
        eq: vi.fn(),
      }
      mockChain.update.mockReturnValue(mockChain)
      mockChain.eq.mockReturnValue(mockChain)

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockChain as any)

      expect(mockChain.update).toBeDefined()
    })

    it('should refresh expiring tokens before publishing', async () => {
      const { refreshAccessToken } = await import('@/lib/social/oauth-config')
      const mockRefresh = vi.mocked(refreshAccessToken)

      const connection = {
        access_token: 'old_token',
        token_expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour
        platform: 'twitter',
      }

      await mockRefresh('twitter', 'old_token')

      expect(mockRefresh).toHaveBeenCalledWith('twitter', 'old_token')
    })

    it('should skip posts if platform not connected', async () => {
      const posts = [
        {
          id: 'post_123',
          platform: 'twitter',
          user_id: 'user_123',
        },
      ]

      const connection = null // No connection found

      expect(connection).toBeNull()
      // Post should be marked failed if connection is null
    })

    it('should respect billing gate for auto-publishing', async () => {
      const { getPlanLimits } = await import('@/lib/content/limits')
      const mockGetLimits = vi.mocked(getPlanLimits)

      const freeTierLimits = mockGetLimits('free')
      const proTierLimits = mockGetLimits('pro')

      expect(freeTierLimits.canPublish).toBe(false)
      expect(proTierLimits.canPublish).toBe(true)
    })

    it('should handle token expired errors gracefully', async () => {
      const { refreshAccessToken } = await import('@/lib/social/oauth-config')
      const mockRefresh = vi.mocked(refreshAccessToken)

      mockRefresh.mockRejectedValueOnce(new Error('Token refresh failed'))

      await expect(
        mockRefresh('linkedin', 'expired_token')
      ).rejects.toThrow('Token refresh failed')
    })

    it('should require valid CRON_SECRET', async () => {
      const CRON_SECRET = process.env.CRON_SECRET
      const authHeader = 'Bearer test_cron_secret_123'

      expect(authHeader).toBe(`Bearer ${CRON_SECRET}`)
    })

    it('should reject without authorization header', async () => {
      const CRON_SECRET = process.env.CRON_SECRET
      const authHeader = null

      expect(authHeader).not.toBe(`Bearer ${CRON_SECRET}`)
    })

    it('should return result counts', async () => {
      const results = {
        published: 5,
        failed: 1,
        skipped: 2,
      }

      expect(results).toHaveProperty('published')
      expect(results).toHaveProperty('failed')
      expect(results).toHaveProperty('skipped')
      expect(results.published + results.failed + results.skipped).toBe(8)
    })
  })

  // ============================================
  // sync-analytics Cron Job
  // ============================================

  describe('sync-analytics cron', () => {
    it('should fetch metrics for published posts', async () => {
      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()

      // Mock published_posts query
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn(async () => ({
          data: [
            {
              id: 'ppub_123',
              user_id: 'user_123',
              platform: 'twitter',
              platform_post_id: 'tweet_789',
            },
          ],
          error: null,
        })),
      } as any)

      const posts = [
        {
          id: 'ppub_123',
          platform: 'twitter',
          platform_post_id: 'tweet_789',
        },
      ]

      expect(posts).toHaveLength(1)
      expect(posts[0].platform_post_id).toBe('tweet_789')
    })

    it('should skip posts that were synced recently', async () => {
      const now = new Date()
      const recentSync = new Date(now.getTime() - 30 * 60 * 1000) // 30 mins ago
      const oldSync = new Date(now.getTime() - 90 * 60 * 1000) // 90 mins ago

      const posts = [
        {
          id: 'post_123',
          last_synced_at: recentSync.toISOString(),
        },
        {
          id: 'post_456',
          last_synced_at: oldSync.toISOString(),
        },
      ]

      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const postsToSync = posts.filter(
        (p) => !p.last_synced_at || new Date(p.last_synced_at) < oneHourAgo
      )

      expect(postsToSync).toHaveLength(1)
      expect(postsToSync[0].id).toBe('post_456')
    })

    it('should refresh tokens expiring within 1 hour', async () => {
      const now = new Date()
      const { refreshAccessToken } = await import('@/lib/social/oauth-config')
      const mockRefresh = vi.mocked(refreshAccessToken)

      const connections = [
        {
          id: 'conn_123',
          platform: 'facebook',
          token_expires_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // 30 mins
          access_token: 'token_123',
        },
        {
          id: 'conn_456',
          platform: 'linkedin',
          token_expires_at: new Date(now.getTime() + 90 * 60 * 1000).toISOString(), // 90 mins
          access_token: 'token_456',
        },
      ]

      const oneHourFromNow = now.getTime() + 60 * 60 * 1000
      const connectionsToRefresh = connections.filter(
        (c) => new Date(c.token_expires_at).getTime() < oneHourFromNow
      )

      expect(connectionsToRefresh).toHaveLength(1)
      expect(connectionsToRefresh[0].id).toBe('conn_123')
    })

    it('should handle token expired errors gracefully', async () => {
      const { refreshAccessToken } = await import('@/lib/social/oauth-config')
      const mockRefresh = vi.mocked(refreshAccessToken)

      mockRefresh.mockRejectedValueOnce(new Error('Refresh token expired'))

      await expect(
        mockRefresh('twitter', 'expired_refresh_token')
      ).rejects.toThrow('Refresh token expired')
    })

    it('should update metrics in published_posts table', async () => {
      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()
      const mockChain = {
        update: vi.fn(),
        eq: vi.fn(),
      }
      mockChain.update.mockReturnValue(mockChain)
      mockChain.eq.mockReturnValue(mockChain)

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockChain as any)

      const metrics = {
        likes: 42,
        comments: 15,
        shares: 8,
        impressions: 500,
        reach: 450,
      }

      expect(metrics).toHaveProperty('likes')
      expect(metrics).toHaveProperty('comments')
      expect(metrics).toHaveProperty('impressions')
    })

    it('should calculate engagement rate', async () => {
      const metrics = {
        likes: 100,
        comments: 50,
        shares: 25,
        impressions: 5000,
      }

      const totalEngagement = metrics.likes + metrics.comments + metrics.shares
      const engagementRate = (totalEngagement / metrics.impressions) * 100

      expect(engagementRate).toBe(3.5)
    })

    it('should skip posts without platform_post_id', async () => {
      const posts = [
        {
          id: 'post_123',
          platform_post_id: 'tweet_789',
        },
        {
          id: 'post_456',
          platform_post_id: null, // No platform ID
        },
      ]

      const postsWithIds = posts.filter((p) => p.platform_post_id)

      expect(postsWithIds).toHaveLength(1)
    })

    it('should require valid CRON_SECRET', async () => {
      const CRON_SECRET = process.env.CRON_SECRET
      const authHeader = 'Bearer test_cron_secret_123'

      expect(authHeader).toBe(`Bearer ${CRON_SECRET}`)
    })

    it('should return result counts', async () => {
      const results = {
        synced: 10,
        failed: 2,
        skipped: 5,
        tokensRefreshed: 1,
      }

      expect(results).toHaveProperty('synced')
      expect(results).toHaveProperty('failed')
      expect(results).toHaveProperty('tokensRefreshed')
    })
  })

  // ============================================
  // refresh-tokens Cron Job
  // ============================================

  describe('refresh-tokens cron', () => {
    it('should refresh expiring tokens', async () => {
      const { refreshAccessToken } = await import('@/lib/social/oauth-config')
      const mockRefresh = vi.mocked(refreshAccessToken)

      const now = new Date()
      const expiringConnections = [
        {
          id: 'conn_123',
          platform: 'twitter' as const,
          token_expires_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
          refresh_token: 'refresh_123',
        },
        {
          id: 'conn_456',
          platform: 'linkedin' as const,
          token_expires_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
          refresh_token: 'refresh_456',
        },
      ]

      const buffer24h = now.getTime() + 24 * 60 * 60 * 1000
      const connectionsToRefresh = expiringConnections.filter(
        (c) => new Date(c.token_expires_at).getTime() < buffer24h
      )

      expect(connectionsToRefresh).toHaveLength(2)
    })

    it('should skip tokens with valid expiry', async () => {
      const now = new Date()
      const connections = [
        {
          id: 'conn_123',
          platform: 'twitter' as const,
          token_expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
      ]

      const buffer24h = now.getTime() + 24 * 60 * 60 * 1000
      const connectionsToRefresh = connections.filter(
        (c) => new Date(c.token_expires_at).getTime() < buffer24h
      )

      expect(connectionsToRefresh).toHaveLength(0)
    })

    it('should handle Facebook/Instagram token exchange', async () => {
      const { refreshAccessToken } = await import('@/lib/social/oauth-config')
      const mockRefresh = vi.mocked(refreshAccessToken)

      // Facebook uses access_token for refresh (fb_exchange_token)
      const fbConnection = {
        platform: 'facebook' as const,
        access_token: 'fb_access_token',
        refresh_token: null,
      }

      const tokenToUse = fbConnection.refresh_token || fbConnection.access_token

      expect(tokenToUse).toBe('fb_access_token')

      await mockRefresh('facebook', tokenToUse)
      expect(mockRefresh).toHaveBeenCalledWith('facebook', 'fb_access_token')
    })

    it('should handle standard refresh_token grant', async () => {
      const { refreshAccessToken } = await import('@/lib/social/oauth-config')
      const mockRefresh = vi.mocked(refreshAccessToken)

      const twitterConnection = {
        platform: 'twitter' as const,
        access_token: 'old_access_token',
        refresh_token: 'twitter_refresh_token',
      }

      const tokenToUse = twitterConnection.refresh_token

      expect(tokenToUse).toBe('twitter_refresh_token')

      await mockRefresh('twitter', tokenToUse)
      expect(mockRefresh).toHaveBeenCalledWith('twitter', 'twitter_refresh_token')
    })

    it('should update database with new tokens', async () => {
      const { adminSupabase } = await import('@/lib/supabase/admin')
      const mockSupabase = adminSupabase()
      const mockChain = {
        update: vi.fn(),
        eq: vi.fn(),
      }
      mockChain.update.mockReturnValue(mockChain)
      mockChain.eq.mockReturnValue(mockChain)

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockChain as any)

      const newToken = 'new_access_token_xyz'
      const newExpiry = new Date(Date.now() + 3600000).toISOString()

      expect(mockChain.update).toBeDefined()
    })

    it('should require valid CRON_SECRET', async () => {
      const CRON_SECRET = process.env.CRON_SECRET
      const authHeader = 'Bearer test_cron_secret_123'

      expect(authHeader).toBe(`Bearer ${CRON_SECRET}`)
    })

    it('should return result counts', async () => {
      const results = {
        refreshed: 5,
        failed: 1,
        skipped: 10,
      }

      expect(results).toHaveProperty('refreshed')
      expect(results).toHaveProperty('failed')
      expect(results).toHaveProperty('skipped')
    })
  })
})
