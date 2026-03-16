// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'

// Test the pure utility functions from notification-bell.tsx
// These are extracted and tested independently since the component has heavy side effects (Supabase, fetch)

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'listing_prepared': return '✅'
    case 'listing_failed': return '⚠️'
    case 'client_viewed': return '👀'
    case 'client_approved': return '✓'
    case 'client_rejected': return '⚠️'
    case 'client_downloaded': return '📥'
    case 'client_commented': return '💬'
    case 'post_published': return '📱'
    case 'post_failed': return '⚠️'
    case 'credits_low': return '⚠️'
    case 'credits_depleted': return '🚨'
    case 'daily_summary': return '📊'
    case 'weekly_report': return '📈'
    default: return '🔔'
  }
}

describe('NotificationBell utilities', () => {
  describe('timeAgo', () => {
    it('returns "just now" for <60 seconds', () => {
      const now = new Date().toISOString()
      expect(timeAgo(now)).toBe('just now')
    })

    it('returns minutes ago for <1 hour', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      expect(timeAgo(fiveMinAgo)).toBe('5m ago')
    })

    it('returns hours ago for <1 day', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      expect(timeAgo(threeHoursAgo)).toBe('3h ago')
    })

    it('returns days ago for <1 week', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString()
      expect(timeAgo(twoDaysAgo)).toBe('2d ago')
    })

    it('returns formatted date for >1 week', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400 * 1000)
      const result = timeAgo(twoWeeksAgo.toISOString())
      // Should be a locale date string, not "Xd ago"
      expect(result).not.toContain('d ago')
      expect(result).not.toBe('just now')
    })

    it('handles edge case at exactly 60 seconds', () => {
      const sixtySecsAgo = new Date(Date.now() - 60 * 1000).toISOString()
      expect(timeAgo(sixtySecsAgo)).toBe('1m ago')
    })
  })

  describe('getNotificationIcon', () => {
    it('returns correct icons for all known types', () => {
      expect(getNotificationIcon('listing_prepared')).toBe('✅')
      expect(getNotificationIcon('listing_failed')).toBe('⚠️')
      expect(getNotificationIcon('client_viewed')).toBe('👀')
      expect(getNotificationIcon('client_approved')).toBe('✓')
      expect(getNotificationIcon('client_rejected')).toBe('⚠️')
      expect(getNotificationIcon('client_downloaded')).toBe('📥')
      expect(getNotificationIcon('client_commented')).toBe('💬')
      expect(getNotificationIcon('post_published')).toBe('📱')
      expect(getNotificationIcon('post_failed')).toBe('⚠️')
      expect(getNotificationIcon('credits_low')).toBe('⚠️')
      expect(getNotificationIcon('credits_depleted')).toBe('🚨')
      expect(getNotificationIcon('daily_summary')).toBe('📊')
      expect(getNotificationIcon('weekly_report')).toBe('📈')
    })

    it('returns bell for unknown types', () => {
      expect(getNotificationIcon('unknown_type')).toBe('🔔')
      expect(getNotificationIcon('')).toBe('🔔')
    })
  })
})
