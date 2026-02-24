/**
 * Tests for lib/rate-limit.ts — Rate limiting logic
 * ===================================================
 * The rate limiter protects all API routes. Getting this wrong means
 * either DoS vulnerability (too permissive) or blocking legitimate users.
 */

import { describe, it, expect, beforeEach } from 'vitest'

// We need to reset the module state between tests since the Map is module-level
let checkRateLimit: typeof import('@/lib/rate-limit').checkRateLimit

beforeEach(async () => {
  // Force re-import to reset the in-memory Map
  const mod = await import('@/lib/rate-limit')
  checkRateLimit = mod.checkRateLimit
})

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const result = checkRateLimit('test-ip-1', 10, 60000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('decrements remaining count on each call', () => {
    const id = 'test-ip-decrement'
    const r1 = checkRateLimit(id, 5, 60000)
    expect(r1.remaining).toBe(4)

    const r2 = checkRateLimit(id, 5, 60000)
    expect(r2.remaining).toBe(3)

    const r3 = checkRateLimit(id, 5, 60000)
    expect(r3.remaining).toBe(2)
  })

  it('blocks requests at the limit', () => {
    const id = 'test-ip-limit'
    const limit = 3

    // Use up all 3 slots
    checkRateLimit(id, limit, 60000) // remaining: 2
    checkRateLimit(id, limit, 60000) // remaining: 1
    checkRateLimit(id, limit, 60000) // remaining: 0

    // 4th should be blocked
    const blocked = checkRateLimit(id, limit, 60000)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('uses different counters for different identifiers', () => {
    const r1 = checkRateLimit('ip-a', 2, 60000)
    const r2 = checkRateLimit('ip-b', 2, 60000)

    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)

    checkRateLimit('ip-a', 2, 60000) // use up ip-a's quota
    const r3 = checkRateLimit('ip-a', 2, 60000)
    const r4 = checkRateLimit('ip-b', 2, 60000)

    expect(r3.success).toBe(false) // ip-a blocked
    expect(r4.success).toBe(true)  // ip-b still has quota
  })

  it('uses default limit of 100 when not specified', () => {
    const result = checkRateLimit('test-default')
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(99)
  })

  it('tracks exact count up to the limit', () => {
    const id = 'test-exact-count'
    const limit = 5

    for (let i = 0; i < limit; i++) {
      const r = checkRateLimit(id, limit, 60000)
      expect(r.success).toBe(true)
      expect(r.remaining).toBe(limit - (i + 1))
    }

    // Next request should fail
    const blocked = checkRateLimit(id, limit, 60000)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })
})
