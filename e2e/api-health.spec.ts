import { test, expect } from '@playwright/test'

test.describe('API endpoints return correct status codes', () => {
  test('health endpoint returns 200', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.status()).toBe(200)
  })

  test('OpenAPI spec returns valid JSON', async ({ request }) => {
    const res = await request.get('/api/v1/openapi.json')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.openapi).toBe('3.0.3')
    expect(body.info.title).toBeTruthy()
    expect(body.paths).toBeTruthy()
  })

  test('unauthenticated API v1 returns 401', async ({ request }) => {
    const res = await request.get('/api/v1/listings')
    expect(res.status()).toBe(401)
  })

  test('invalid API key returns 401', async ({ request }) => {
    const res = await request.get('/api/v1/listings', {
      headers: { Authorization: 'Bearer sk_live_invalid_key_12345' },
    })
    expect(res.status()).toBe(401)
  })

  test('cron endpoints require CRON_SECRET', async ({ request }) => {
    // Cron uses GET with Bearer auth check
    const res = await request.get('/api/cron/publish-scheduled')
    expect(res.status()).toBe(401)
  })

  test('enhance endpoint rejects invalid body', async ({ request }) => {
    // Zod validation runs before auth — empty body returns 400
    const res = await request.post('/api/enhance', {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('upload endpoint rejects without auth', async ({ request }) => {
    const res = await request.post('/api/upload')
    expect(res.status()).toBe(401)
  })

  test('leads endpoint rejects without auth', async ({ request }) => {
    const res = await request.get('/api/leads')
    expect(res.status()).toBe(401)
  })
})

test.describe('API rate limiting', () => {
  test('rate limit headers are present on API responses', async ({ request }) => {
    const res = await request.get('/api/health')
    const limit = res.headers()['x-ratelimit-limit']
    const remaining = res.headers()['x-ratelimit-remaining']
    expect(limit).toBeTruthy()
    expect(remaining).toBeTruthy()
  })
})

test.describe('API input validation', () => {
  test('stripe checkout rejects invalid body', async ({ request }) => {
    const res = await request.post('/api/stripe/checkout', {
      data: { plan: '' },
    })
    // Should reject — either 400 (validation) or 401 (auth first)
    expect([400, 401]).toContain(res.status())
  })

  test('contact endpoint rejects empty body', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: {},
    })
    expect([400, 422]).toContain(res.status())
  })
})
