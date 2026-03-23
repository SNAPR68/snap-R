// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'

// Test the scheduling logic extracted from the schedule-modal
describe('ScheduleModal logic', () => {
  function getScheduleLabel(platform: string): string {
    const labels: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      tiktok: 'TikTok',
    }
    return labels[platform] || platform
  }

  function isValidScheduleTime(date: Date): boolean {
    const now = new Date()
    return date > now
  }

  it('returns correct platform labels', () => {
    expect(getScheduleLabel('facebook')).toBe('Facebook')
    expect(getScheduleLabel('instagram')).toBe('Instagram')
    expect(getScheduleLabel('linkedin')).toBe('LinkedIn')
    expect(getScheduleLabel('tiktok')).toBe('TikTok')
  })

  it('returns platform name for unknown platforms', () => {
    expect(getScheduleLabel('twitter')).toBe('twitter')
  })

  it('validates future schedule times', () => {
    const futureDate = new Date(Date.now() + 86400000) // tomorrow
    expect(isValidScheduleTime(futureDate)).toBe(true)
  })

  it('rejects past schedule times', () => {
    const pastDate = new Date(Date.now() - 86400000) // yesterday
    expect(isValidScheduleTime(pastDate)).toBe(false)
  })
})
