/**
 * Tests for lib/compliance/disclosure.ts — MLS disclosure generation
 */

import { describe, it, expect } from 'vitest'
import {
  generateDisclosure,
  generateShortDisclosure,
  generatePhotoDescription,
} from '@/lib/compliance/disclosure'

describe('generateDisclosure', () => {
  const baseOptions = {
    enhancementTypes: ['VirtualStaging'],
    enhancementDate: '2026-03-01T00:00:00.000Z',
  }

  it('generates disclosure with required fields', () => {
    const result = generateDisclosure(baseOptions)
    expect(result).toContain('PHOTO ENHANCEMENT DISCLOSURE')
    expect(result).toContain('Virtual Staging')
    expect(result).toContain('March 1, 2026')
    expect(result).toContain('SnapR')
  })

  it('includes listing address when provided', () => {
    const result = generateDisclosure({
      ...baseOptions,
      listingAddress: '123 Main St',
    })
    expect(result).toContain('123 Main St')
  })

  it('uses placeholder when address not provided', () => {
    const result = generateDisclosure(baseOptions)
    expect(result).toContain('[Property Address]')
  })

  it('includes MLS number when provided', () => {
    const result = generateDisclosure({
      ...baseOptions,
      mlsNumber: 'MLS-12345',
    })
    expect(result).toContain('MLS #: MLS-12345')
  })

  it('includes agent and brokerage info', () => {
    const result = generateDisclosure({
      ...baseOptions,
      agentName: 'Jane Doe',
      brokerageName: 'Top Realty',
    })
    expect(result).toContain('Jane Doe')
    expect(result).toContain('Top Realty')
  })

  it('maps multiple enhancement types', () => {
    const result = generateDisclosure({
      ...baseOptions,
      enhancementTypes: ['VirtualStaging', 'SkyReplacement', 'ObjectRemoval'],
    })
    expect(result).toContain('Virtual Staging')
    expect(result).toContain('Sky Replacement')
    expect(result).toContain('Digital Object Removal')
  })

  it('passes through unknown enhancement types as-is', () => {
    const result = generateDisclosure({
      ...baseOptions,
      enhancementTypes: ['CustomEnhancement'],
    })
    expect(result).toContain('CustomEnhancement')
  })

  it('includes NAR compliance note', () => {
    const result = generateDisclosure(baseOptions)
    expect(result).toContain('NAR Code of Ethics')
  })
})

describe('generateShortDisclosure', () => {
  it('returns correct disclosure for virtual-staging', () => {
    expect(generateShortDisclosure('virtual-staging')).toBe(
      'Virtually Staged - Furniture Not Included'
    )
  })

  it('returns correct disclosure for sky-replacement', () => {
    expect(generateShortDisclosure('sky-replacement')).toBe('Sky Digitally Enhanced')
  })

  it('returns correct disclosure for declutter', () => {
    expect(generateShortDisclosure('declutter')).toBe('Digitally Edited - Items Removed')
  })

  it('returns correct disclosure for virtual-twilight', () => {
    expect(generateShortDisclosure('virtual-twilight')).toBe(
      'Digitally Converted to Twilight'
    )
  })

  it('returns default disclosure for unknown tools', () => {
    expect(generateShortDisclosure('unknown-tool')).toBe('Digitally Enhanced')
    expect(generateShortDisclosure('hdr')).toBe('Digitally Enhanced')
  })
})

describe('generatePhotoDescription', () => {
  it('returns just disclosure for minimal input', () => {
    expect(generatePhotoDescription('sky-replacement')).toBe('Sky Digitally Enhanced')
  })

  it('appends room type when provided', () => {
    expect(generatePhotoDescription('virtual-staging', 'Living Room')).toBe(
      'Virtually Staged - Furniture Not Included - Living Room'
    )
  })

  it('appends photo number when provided', () => {
    expect(generatePhotoDescription('sky-replacement', undefined, 3)).toBe(
      'Sky Digitally Enhanced (Photo 3)'
    )
  })

  it('appends both room type and photo number', () => {
    expect(generatePhotoDescription('declutter', 'Kitchen', 5)).toBe(
      'Digitally Edited - Items Removed - Kitchen (Photo 5)'
    )
  })
})
