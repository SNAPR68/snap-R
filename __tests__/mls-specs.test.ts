/**
 * Tests for lib/compliance/mls-specs.ts — MLS validation rules
 */

import { describe, it, expect } from 'vitest'
import { getMlsSpec, getMlsOptions, validateForMls } from '@/lib/compliance/mls-specs'

describe('getMlsSpec', () => {
  it('returns spec for known MLS (crmls)', () => {
    const spec = getMlsSpec('crmls')
    expect(spec.id).toBe('crmls')
    expect(spec.name).toContain('California')
  })

  it('returns spec for known MLS (bright)', () => {
    const spec = getMlsSpec('bright')
    expect(spec.id).toBe('bright')
    expect(spec.region).toContain('Mid-Atlantic')
  })

  it('returns default spec for unknown MLS', () => {
    const spec = getMlsSpec('nonexistent-mls')
    expect(spec.id).toBe('default')
    expect(spec.watermarkRequired).toBe(true)
  })
})

describe('getMlsOptions', () => {
  it('returns array of options without default', () => {
    const options = getMlsOptions()
    expect(options.length).toBeGreaterThan(0)
    expect(options.find(o => o.value === 'default')).toBeUndefined()
  })

  it('each option has value, label, and region', () => {
    const options = getMlsOptions()
    for (const opt of options) {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
      expect(opt.region).toBeTruthy()
    }
  })

  it('includes major MLS systems', () => {
    const options = getMlsOptions()
    const ids = options.map(o => o.value)
    expect(ids).toContain('crmls')
    expect(ids).toContain('bright')
    expect(ids).toContain('stellar')
  })
})

describe('validateForMls', () => {
  it('passes valid image for CRMLS', () => {
    const result = validateForMls('crmls', 5 * 1024 * 1024, 2048, 1536, 'jpg')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when file size exceeds maximum', () => {
    const result = validateForMls('crmls', 20 * 1024 * 1024, 2048, 1536, 'jpg')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('File size')
    expect(result.errors[0]).toContain('exceeds maximum')
  })

  it('fails when dimensions exceed maximum', () => {
    const result = validateForMls('crmls', 1024, 5000, 5000, 'jpg')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('exceed maximum'))).toBe(true)
  })

  it('fails when dimensions below minimum', () => {
    const result = validateForMls('crmls', 1024, 640, 480, 'jpg')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('below minimum'))).toBe(true)
  })

  it('fails when format not allowed', () => {
    // Bright MLS only allows jpg/jpeg
    const result = validateForMls('bright', 1024, 2048, 1536, 'png')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Format'))).toBe(true)
  })

  it('accepts png for MLS that allows it', () => {
    const result = validateForMls('crmls', 1024, 2048, 1536, 'png')
    expect(result.valid).toBe(true)
  })

  it('handles format with dot prefix', () => {
    const result = validateForMls('crmls', 1024, 2048, 1536, '.jpg')
    expect(result.valid).toBe(true)
  })

  it('handles uppercase format', () => {
    const result = validateForMls('crmls', 1024, 2048, 1536, 'JPG')
    expect(result.valid).toBe(true)
  })

  it('collects multiple errors', () => {
    // Too large, too small dimensions, wrong format
    const result = validateForMls('bright', 20 * 1024 * 1024, 100, 100, 'bmp')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('uses default spec for unknown MLS', () => {
    const result = validateForMls('unknown-mls', 5 * 1024 * 1024, 2048, 1536, 'jpg')
    expect(result.valid).toBe(true)
  })
})
