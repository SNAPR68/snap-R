import { test, expect } from '@playwright/test'

test.describe('Billing gates: enterprise-only endpoints', () => {
  test('API keys endpoint requires auth', async ({ request }) => {
    const res = await request.get('/api/api-keys')
    expect(res.status()).toBe(401)
  })

  test('custom domains endpoint requires auth', async ({ request }) => {
    const res = await request.get('/api/domains')
    expect(res.status()).toBe(401)
  })

  test('v1 API requires API key (enterprise gate)', async ({ request }) => {
    const res = await request.get('/api/v1/listings')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  test('v1 API create listing requires API key', async ({ request }) => {
    const res = await request.post('/api/v1/listings', {
      data: { address: '123 Test St' },
    })
    expect(res.status()).toBe(401)
  })

  test('v1 video generate requires API key', async ({ request }) => {
    const res = await request.post('/api/v1/video/generate', {
      data: { listingId: '00000000-0000-0000-0000-000000000000' },
    })
    expect(res.status()).toBe(401)
  })

  test('v1 leads endpoint requires API key', async ({ request }) => {
    const res = await request.get('/api/v1/leads')
    expect(res.status()).toBe(401)
  })

  test('v1 webhooks endpoint requires API key', async ({ request }) => {
    const res = await request.get('/api/v1/webhooks')
    expect(res.status()).toBe(401)
  })
})
