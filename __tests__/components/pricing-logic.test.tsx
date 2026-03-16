// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'

// Extract and test the pricing logic from pricing-section.tsx
// This is business-critical billing calculation logic

const getPricePerListing = (planId: string, listings: number, billingId: string): number => {
  const basePrices: Record<string, number> = {
    gold: 28,
    platinum: 30,
  }

  const base = basePrices[planId] || 28

  if (billingId === 'paygo') {
    return base
  }

  if (planId === 'gold') {
    if (billingId === 'monthly') {
      return listings >= 75 ? 16 : 20
    } else {
      return listings >= 75 ? 11 : 16
    }
  } else if (planId === 'platinum') {
    if (billingId === 'monthly') {
      return listings >= 75 ? 18 : 22
    } else {
      return listings >= 75 ? 12 : 18
    }
  }

  return base
}

describe('Pricing Logic — getPricePerListing', () => {
  describe('Pay as you go', () => {
    it('Gold PAYG = $28', () => {
      expect(getPricePerListing('gold', 5, 'paygo')).toBe(28)
      expect(getPricePerListing('gold', 100, 'paygo')).toBe(28)
    })

    it('Platinum PAYG = $30', () => {
      expect(getPricePerListing('platinum', 5, 'paygo')).toBe(30)
      expect(getPricePerListing('platinum', 300, 'paygo')).toBe(30)
    })
  })

  describe('Gold monthly', () => {
    it('$20/listing for 5-50 listings', () => {
      expect(getPricePerListing('gold', 5, 'monthly')).toBe(20)
      expect(getPricePerListing('gold', 50, 'monthly')).toBe(20)
    })

    it('$16/listing for 75+ listings (volume discount)', () => {
      expect(getPricePerListing('gold', 75, 'monthly')).toBe(16)
      expect(getPricePerListing('gold', 300, 'monthly')).toBe(16)
    })

    it('volume tier boundary at exactly 75', () => {
      expect(getPricePerListing('gold', 74, 'monthly')).toBe(20)
      expect(getPricePerListing('gold', 75, 'monthly')).toBe(16)
    })
  })

  describe('Gold annual', () => {
    it('$16/listing for 5-50 listings', () => {
      expect(getPricePerListing('gold', 5, 'annual')).toBe(16)
      expect(getPricePerListing('gold', 50, 'annual')).toBe(16)
    })

    it('$11/listing for 75+ listings (best deal)', () => {
      expect(getPricePerListing('gold', 75, 'annual')).toBe(11)
      expect(getPricePerListing('gold', 300, 'annual')).toBe(11)
    })
  })

  describe('Platinum monthly', () => {
    it('$22/listing for 5-50 listings', () => {
      expect(getPricePerListing('platinum', 10, 'monthly')).toBe(22)
    })

    it('$18/listing for 75+ listings', () => {
      expect(getPricePerListing('platinum', 100, 'monthly')).toBe(18)
    })
  })

  describe('Platinum annual', () => {
    it('$18/listing for 5-50 listings', () => {
      expect(getPricePerListing('platinum', 25, 'annual')).toBe(18)
    })

    it('$12/listing for 75+ listings', () => {
      expect(getPricePerListing('platinum', 200, 'annual')).toBe(12)
    })
  })

  describe('Unknown plan', () => {
    it('falls back to $28 base for unknown plan', () => {
      expect(getPricePerListing('unknown', 10, 'paygo')).toBe(28)
      expect(getPricePerListing('unknown', 10, 'monthly')).toBe(28)
    })
  })

  describe('Price hierarchy correctness', () => {
    it('Gold annual is always cheapest for same volume', () => {
      for (const listings of [5, 50, 75, 300]) {
        const paygo = getPricePerListing('gold', listings, 'paygo')
        const monthly = getPricePerListing('gold', listings, 'monthly')
        const annual = getPricePerListing('gold', listings, 'annual')
        expect(annual).toBeLessThanOrEqual(monthly)
        expect(monthly).toBeLessThanOrEqual(paygo)
      }
    })

    it('Platinum is always more expensive than Gold for same billing', () => {
      for (const billing of ['paygo', 'monthly', 'annual']) {
        for (const listings of [5, 50, 75, 300]) {
          const gold = getPricePerListing('gold', listings, billing)
          const platinum = getPricePerListing('platinum', listings, billing)
          expect(platinum).toBeGreaterThanOrEqual(gold)
        }
      }
    })

    it('volume discount (75+) is always cheaper than low volume', () => {
      for (const plan of ['gold', 'platinum']) {
        for (const billing of ['monthly', 'annual']) {
          const low = getPricePerListing(plan, 50, billing)
          const high = getPricePerListing(plan, 75, billing)
          expect(high).toBeLessThan(low)
        }
      }
    })
  })
})
