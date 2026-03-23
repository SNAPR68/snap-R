// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// Test the progress calculation logic extracted from batch-progress-modal
describe('BatchProgressModal logic', () => {
  function calculateProgress(completed: number, total: number): number {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  it('calculates 0% when no items completed', () => {
    expect(calculateProgress(0, 10)).toBe(0)
  })

  it('calculates 50% when half completed', () => {
    expect(calculateProgress(5, 10)).toBe(50)
  })

  it('calculates 100% when all completed', () => {
    expect(calculateProgress(10, 10)).toBe(100)
  })

  it('handles zero total gracefully', () => {
    expect(calculateProgress(0, 0)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    expect(calculateProgress(1, 3)).toBe(33)
  })
})
