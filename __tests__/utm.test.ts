/**
 * Tests for lib/social/utm.ts — UTM parameter construction
 * ==========================================================
 * UTM params are how we attribute leads to specific social posts.
 * Getting this wrong means broken analytics for paying users.
 */

import { describe, it, expect } from 'vitest'
import { appendUtmParams } from '@/lib/social/utm'

describe('appendUtmParams', () => {
  it('appends all 4 UTM parameters', () => {
    const result = appendUtmParams('https://snap-r.com/p/123-main-st', {
      platform: 'instagram',
      postType: 'just_listed',
      listingId: 'abc-123',
    })

    const url = new URL(result)
    expect(url.searchParams.get('utm_source')).toBe('instagram')
    expect(url.searchParams.get('utm_medium')).toBe('social')
    expect(url.searchParams.get('utm_campaign')).toBe('just_listed')
    expect(url.searchParams.get('utm_content')).toBe('abc-123')
  })

  it('preserves the original URL path', () => {
    const result = appendUtmParams('https://snap-r.com/p/my-property', {
      platform: 'facebook',
      postType: 'open_house',
      listingId: 'def-456',
    })

    const url = new URL(result)
    expect(url.pathname).toBe('/p/my-property')
    expect(url.hostname).toBe('snap-r.com')
  })

  it('preserves existing query parameters', () => {
    const result = appendUtmParams('https://snap-r.com/p/test?ref=email', {
      platform: 'linkedin',
      postType: 'price_drop',
      listingId: 'ghi-789',
    })

    const url = new URL(result)
    expect(url.searchParams.get('ref')).toBe('email')
    expect(url.searchParams.get('utm_source')).toBe('linkedin')
  })

  it('handles all supported platforms', () => {
    const platforms = ['instagram', 'facebook', 'linkedin', 'tiktok']

    for (const platform of platforms) {
      const result = appendUtmParams('https://snap-r.com/p/test', {
        platform,
        postType: 'just_listed',
        listingId: 'test-id',
      })
      const url = new URL(result)
      expect(url.searchParams.get('utm_source')).toBe(platform)
    }
  })

  it('handles all campaign types', () => {
    const types = ['just_listed', 'open_house', 'price_drop', 'sold']

    for (const postType of types) {
      const result = appendUtmParams('https://snap-r.com/p/test', {
        platform: 'facebook',
        postType,
        listingId: 'test-id',
      })
      const url = new URL(result)
      expect(url.searchParams.get('utm_campaign')).toBe(postType)
    }
  })

  it('always sets utm_medium to "social"', () => {
    const result = appendUtmParams('https://snap-r.com/p/test', {
      platform: 'tiktok',
      postType: 'just_listed',
      listingId: 'id-1',
    })

    const url = new URL(result)
    expect(url.searchParams.get('utm_medium')).toBe('social')
  })

  it('overwrites existing UTM params if already present', () => {
    const result = appendUtmParams(
      'https://snap-r.com/p/test?utm_source=old&utm_medium=old',
      {
        platform: 'instagram',
        postType: 'sold',
        listingId: 'new-id',
      }
    )

    const url = new URL(result)
    expect(url.searchParams.get('utm_source')).toBe('instagram')
    expect(url.searchParams.get('utm_medium')).toBe('social')
  })

  it('handles URLs with hash fragments', () => {
    const result = appendUtmParams('https://snap-r.com/p/test#gallery', {
      platform: 'facebook',
      postType: 'just_listed',
      listingId: 'hash-id',
    })

    const url = new URL(result)
    expect(url.hash).toBe('#gallery')
    expect(url.searchParams.get('utm_source')).toBe('facebook')
  })
})
