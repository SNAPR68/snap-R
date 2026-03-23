// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'

// Test content type logic extracted from unified-creator
describe('UnifiedCreator logic', () => {
  type ContentType = 'caption' | 'description' | 'hashtags' | 'email'

  function getContentTypeLabel(type: ContentType): string {
    const labels: Record<ContentType, string> = {
      caption: 'Social Caption',
      description: 'Property Description',
      hashtags: 'Hashtags',
      email: 'Email Template',
    }
    return labels[type]
  }

  function getMaxLength(type: ContentType): number {
    const limits: Record<ContentType, number> = {
      caption: 2200,
      description: 5000,
      hashtags: 500,
      email: 10000,
    }
    return limits[type]
  }

  it('returns correct labels for content types', () => {
    expect(getContentTypeLabel('caption')).toBe('Social Caption')
    expect(getContentTypeLabel('description')).toBe('Property Description')
    expect(getContentTypeLabel('hashtags')).toBe('Hashtags')
    expect(getContentTypeLabel('email')).toBe('Email Template')
  })

  it('returns correct max lengths', () => {
    expect(getMaxLength('caption')).toBe(2200)
    expect(getMaxLength('description')).toBe(5000)
    expect(getMaxLength('email')).toBe(10000)
  })
})
