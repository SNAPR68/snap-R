import { describe, expect, it, vi } from 'vitest'

import { mergeNotificationPreferences } from '@/lib/notifications/preferences'
import { normalizePhoneNumber, normalizeWhatsAppAddress, phoneNumbersMatch } from '@/lib/phone'
import { getSocialPlatformCapabilities } from '@/lib/social/capabilities'

describe('launch hardening helpers', () => {
  it('normalizes phone numbers to E.164', () => {
    expect(normalizePhoneNumber('(555) 123-4567')).toBe('+15551234567')
    expect(normalizePhoneNumber('+91 98765 43210')).toBe('+919876543210')
    expect(normalizePhoneNumber('')).toBeNull()
  })

  it('normalizes whatsapp addresses and matches normalized phones', () => {
    expect(normalizeWhatsAppAddress('whatsapp:+1 (555) 123-4567')).toBe('whatsapp:+15551234567')
    expect(phoneNumbersMatch('+1 555 123 4567', '(555)123-4567')).toBe(true)
  })

  it('merges notification preferences without dropping unrelated keys', () => {
    expect(mergeNotificationPreferences(
      { email: true, devices: [{ pushToken: 'abc' }], weeklySummary: true },
      { whatsapp: false }
    )).toEqual({
      email: true,
      devices: [{ pushToken: 'abc' }],
      weeklySummary: true,
      whatsapp: false,
    })
  })

  it('keeps TikTok and X hidden from the launch UI even if env is present', () => {
    vi.stubEnv('NEXT_PUBLIC_FACEBOOK_APP_ID', 'fb')
    vi.stubEnv('FACEBOOK_APP_SECRET', 'fb-secret')
    vi.stubEnv('NEXT_PUBLIC_LINKEDIN_CLIENT_ID', 'li')
    vi.stubEnv('LINKEDIN_CLIENT_SECRET', 'li-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://snap-r.com')
    vi.stubEnv('NEXT_PUBLIC_TIKTOK_CLIENT_KEY', 'tt-public')
    vi.stubEnv('TIKTOK_CLIENT_KEY', 'tt-server')
    vi.stubEnv('TIKTOK_CLIENT_SECRET', 'tt-secret')
    vi.stubEnv('NEXT_PUBLIC_TWITTER_CLIENT_ID', 'tw-public')
    vi.stubEnv('TWITTER_CLIENT_ID', 'tw-server')
    vi.stubEnv('TWITTER_CLIENT_SECRET', 'tw-secret')

    const capabilities = getSocialPlatformCapabilities()

    expect(capabilities.find((capability) => capability.platform === 'facebook')?.launchVisible).toBe(true)
    expect(capabilities.find((capability) => capability.platform === 'linkedin')?.launchVisible).toBe(true)
    expect(capabilities.find((capability) => capability.platform === 'tiktok')?.launchVisible).toBe(false)
    expect(capabilities.find((capability) => capability.platform === 'twitter')?.launchVisible).toBe(false)

    vi.unstubAllEnvs()
  })
})
