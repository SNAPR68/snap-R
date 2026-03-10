/**
 * Tests for lib/utils.ts — Core utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cn, getR2PublicUrl } from '@/lib/utils'

describe('cn (class name merger)', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('merges conflicting tailwind classes', () => {
    // twMerge should keep the last conflicting class
    expect(cn('p-4', 'p-8')).toBe('p-8')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('handles empty call', () => {
    expect(cn()).toBe('')
  })

  it('handles array input', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})

describe('getR2PublicUrl', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns null for null input', () => {
    expect(getR2PublicUrl(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(getR2PublicUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getR2PublicUrl('')).toBeNull()
  })

  it('returns full URLs as-is (http)', () => {
    const url = 'http://example.com/image.jpg'
    expect(getR2PublicUrl(url)).toBe(url)
  })

  it('returns full URLs as-is (https)', () => {
    const url = 'https://cdn.example.com/photos/test.jpg'
    expect(getR2PublicUrl(url)).toBe(url)
  })

  it('prepends R2 public URL for raw/ keys when env is set', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL', 'https://r2.snap-r.com')
    expect(getR2PublicUrl('raw/job-123/photo.jpg')).toBe(
      'https://r2.snap-r.com/raw/job-123/photo.jpg'
    )
  })

  it('falls back to CLOUDFLARE_R2_PUBLIC_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL', '')
    vi.stubEnv('CLOUDFLARE_R2_PUBLIC_URL', 'https://r2-alt.snap-r.com')
    expect(getR2PublicUrl('raw/job-123/photo.jpg')).toBe(
      'https://r2-alt.snap-r.com/raw/job-123/photo.jpg'
    )
  })

  it('returns key as-is when no R2 env var set', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL', '')
    vi.stubEnv('CLOUDFLARE_R2_PUBLIC_URL', '')
    expect(getR2PublicUrl('raw/job-123/photo.jpg')).toBe('raw/job-123/photo.jpg')
  })

  it('returns non-raw keys as-is', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL', 'https://r2.snap-r.com')
    expect(getR2PublicUrl('some-other-key')).toBe('some-other-key')
  })
})
