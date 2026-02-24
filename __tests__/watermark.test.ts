/**
 * Tests for lib/compliance/watermark.ts — Watermark logic
 * =========================================================
 * MLS compliance requires specific watermarks for digitally altered photos.
 * Getting this wrong means agents violate MLS rules and risk license issues.
 */

import { describe, it, expect } from 'vitest'
import { requiresWatermark, getWatermarkText } from '@/lib/compliance/watermark'

// ── requiresWatermark ──

describe('requiresWatermark', () => {
  it('returns true for virtual staging tools', () => {
    expect(requiresWatermark('virtual-staging')).toBe(true)
    expect(requiresWatermark('item-removal')).toBe(true)
    expect(requiresWatermark('declutter')).toBe(true)
  })

  it('returns true for digital enhancement tools', () => {
    expect(requiresWatermark('fire-in-fireplace')).toBe(true)
    expect(requiresWatermark('tv-screen-replacement')).toBe(true)
    expect(requiresWatermark('art-wall-replacement')).toBe(true)
  })

  it('returns false for standard enhancement tools', () => {
    expect(requiresWatermark('sky-replacement')).toBe(false)
    expect(requiresWatermark('hdr')).toBe(false)
    expect(requiresWatermark('auto-enhance')).toBe(false)
    expect(requiresWatermark('perspective-correction')).toBe(false)
    expect(requiresWatermark('lens-correction')).toBe(false)
    expect(requiresWatermark('color-balance')).toBe(false)
    expect(requiresWatermark('virtual-twilight')).toBe(false)
    expect(requiresWatermark('lawn-repair')).toBe(false)
    expect(requiresWatermark('pool-enhance')).toBe(false)
    expect(requiresWatermark('lights-on')).toBe(false)
    expect(requiresWatermark('window-masking')).toBe(false)
  })

  it('returns false for unknown tool IDs', () => {
    expect(requiresWatermark('')).toBe(false)
    expect(requiresWatermark('some-future-tool')).toBe(false)
    expect(requiresWatermark('magic-enhance')).toBe(false)
  })
})

// ── getWatermarkText ──

describe('getWatermarkText', () => {
  it('returns "VIRTUALLY STAGED" for virtual-staging', () => {
    expect(getWatermarkText('virtual-staging')).toBe('VIRTUALLY STAGED')
  })

  it('returns "DIGITALLY EDITED" for content removal tools', () => {
    expect(getWatermarkText('item-removal')).toBe('DIGITALLY EDITED')
    expect(getWatermarkText('declutter')).toBe('DIGITALLY EDITED')
  })

  it('returns "DIGITALLY ENHANCED" for enhancement tools', () => {
    expect(getWatermarkText('fire-in-fireplace')).toBe('DIGITALLY ENHANCED')
    expect(getWatermarkText('tv-screen-replacement')).toBe('DIGITALLY ENHANCED')
    expect(getWatermarkText('art-wall-replacement')).toBe('DIGITALLY ENHANCED')
  })

  it('returns "DIGITALLY ENHANCED" as fallback for unknown tools', () => {
    expect(getWatermarkText('unknown-tool')).toBe('DIGITALLY ENHANCED')
    expect(getWatermarkText('')).toBe('DIGITALLY ENHANCED')
  })

  it('each watermark tool has a specific text mapping', () => {
    // Verify no tool in requiresWatermark list is missing from getWatermarkText
    const watermarkTools = [
      'virtual-staging',
      'item-removal',
      'declutter',
      'fire-in-fireplace',
      'tv-screen-replacement',
      'art-wall-replacement',
    ]

    for (const tool of watermarkTools) {
      expect(requiresWatermark(tool)).toBe(true)
      expect(getWatermarkText(tool)).toBeTruthy()
      expect(getWatermarkText(tool).length).toBeGreaterThan(0)
    }
  })
})
