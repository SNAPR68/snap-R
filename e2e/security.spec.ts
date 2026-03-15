import { test, expect } from '@playwright/test'

test.describe('Security: bot pattern blocking', () => {
  const suspiciousPaths = [
    '/.env',
    '/.git/config',
    '/wp-admin',
    '/wp-login.php',
    '/phpinfo.php',
    '/admin/login',
  ]

  for (const path of suspiciousPaths) {
    test(`blocks suspicious path: ${path}`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(404)
    })
  }
})

test.describe('Security: CORS and headers', () => {
  test('embed routes are accessible', async ({ request }) => {
    const res = await request.get('/embed/before-after/test-id')
    // Embed routes should return a page (not redirect to login)
    expect([200, 404]).toContain(res.status())
  })

  test('non-embed routes deny framing', async ({ request }) => {
    const res = await request.get('/')
    const xfo = res.headers()['x-frame-options']
    expect(xfo).toBe('DENY')
  })
})

test.describe('Security: rate limiting enforced', () => {
  test('rapid requests get rate limited', async ({ request }) => {
    // Hit a low-limit endpoint many times
    const results: number[] = []
    for (let i = 0; i < 6; i++) {
      const res = await request.post('/api/contact', {
        data: { name: 'test', email: 'test@test.com', message: 'test' },
      })
      results.push(res.status())
    }
    // At least one should be 429 (limit is 3/min for /api/contact)
    expect(results).toContain(429)
  })
})
