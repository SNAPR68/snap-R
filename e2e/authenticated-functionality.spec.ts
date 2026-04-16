import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { chromium as browserChromium } from 'playwright'

loadEnv({ path: path.join(process.cwd(), '.env.local') })

const STORAGE_STATE_PATH = path.join(process.cwd(), 'e2e/.auth/user.json')
const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? `e2e+snapr-${Date.now()}@example.com`
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'SnapR!23456'

const DASHBOARD_ROUTES = [
  '/dashboard',
  '/dashboard/listings',
  '/dashboard/content-studio',
  '/dashboard/brand',
  '/dashboard/staging',
  '/dashboard/content-studio/sites',
  '/dashboard/calendar',
  '/dashboard/auto-post',
  '/dashboard/campaigns',
  '/dashboard/analytics',
  '/dashboard/leads',
  '/dashboard/showings',
  '/dashboard/open-houses',
  '/dashboard/approvals',
  '/dashboard/photographer',
  '/dashboard/notify',
  '/dashboard/ai-descriptions',
  '/dashboard/portfolio',
  '/dashboard/virtual-tours',
  '/dashboard/voiceover',
  '/dashboard/cma',
  '/dashboard/photo-culling',
  '/dashboard/renovation',
  '/dashboard/listing-intelligence',
  '/dashboard/content-studio/email',
  '/dashboard/print',
  '/dashboard/partner',
  '/dashboard/mls',
  '/dashboard/team',
  '/dashboard/broker',
  '/dashboard/settings',
  '/dashboard/settings/social',
  '/dashboard/settings/notifications',
  '/dashboard/content-studio/video',
  '/dashboard/billing',
]

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const isConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

async function provisionAndAuthenticate(baseURL: string): Promise<void> {
  const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const usersResult = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existingUser = usersResult.data?.users.find((user) => user.email?.toLowerCase() === TEST_EMAIL.toLowerCase())

  let userId: string

  if (existingUser) {
    userId = existingUser.id
    await admin.auth.admin.updateUserById(existingUser.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Automation User' },
    })
  } else {
    const createdUser = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Automation User' },
    })
    userId = createdUser.data.user?.id ?? ''
  }

  if (!userId) {
    throw new Error('Failed to resolve test user id for provisioning')
  }

  // Mark user as onboarded to avoid dashboard redirects during authenticated sweeps.
  await admin.from('profiles').upsert(
    {
      id: userId,
      email: TEST_EMAIL,
      full_name: 'E2E Automation User',
      role: 'agent',
      plan: 'free',
      subscription_tier: 'free',
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  await mkdir(path.dirname(STORAGE_STATE_PATH), { recursive: true })
  await writeFile(STORAGE_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }), 'utf-8')

  const browser = await browserChromium.launch({ headless: true })
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  await page.goto('/auth/login', { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(2500)
  await page.locator('input[aria-label="Email address"]').fill(TEST_EMAIL)
  await page.locator('input[aria-label="Password"]').first().fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /^Sign In$/i }).click()
  await page.waitForTimeout(1500)

  if (page.url().includes('/onboarding')) {
    // Profile is pre-marked as onboarded above; a direct dashboard hit should clear stale routing.
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(600)
  }

  await context.storageState({ path: STORAGE_STATE_PATH })
  await browser.close()
}

test.describe('Authenticated functionality sweep', () => {
  test.setTimeout(300_000)
  test.skip(!isConfigured, 'Supabase service role env is required for authenticated E2E provisioning')
  test.use({ storageState: STORAGE_STATE_PATH })

  test.beforeAll(async ({ baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL is not configured')
    await provisionAndAuthenticate(baseURL)
  })

  test('dashboard routes, links, and key auth-gated integrations are functional', async ({ page }) => {
    const routeResults: Array<{ route: string; status: string; badLinks: string[]; buttonCount: number }> = []
    const linkStatuses = new Map<string, number>()

    for (const route of DASHBOARD_ROUTES) {
      let navigationError: string | null = null
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 })
          navigationError = null
          break
        } catch (error: unknown) {
          navigationError = error instanceof Error ? error.message : 'Unknown navigation error'
          await page.waitForTimeout(500)
        }
      }

      if (navigationError) {
        routeResults.push({ route, status: `navigation-error: ${navigationError}`, badLinks: [], buttonCount: 0 })
        continue
      }

      const currentUrl = page.url()
      const status = currentUrl.includes('/auth/login')
        ? 'redirected-login'
        : currentUrl.includes('/onboarding')
          ? 'redirected-onboarding'
          : 'loaded'

      const visibleLinks = page.locator('a[href]:visible')
      const linkCount = await visibleLinks.count()
      const badLinks: string[] = []

      for (let i = 0; i < Math.min(linkCount, 15); i++) {
        const href = await visibleLinks.nth(i).getAttribute('href')
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
        const absolute = new URL(href, page.url())
        if (!absolute.origin.includes('localhost')) continue
        const key = `${absolute.pathname}${absolute.search}`

        if (!linkStatuses.has(key)) {
          const response = await page.request.get(key, { maxRedirects: 0 })
          linkStatuses.set(key, response.status())
        }

        const statusCode = linkStatuses.get(key)!
        if (!(statusCode >= 200 && statusCode < 400)) {
          badLinks.push(`${key} (${statusCode})`)
        }
      }

      const visibleButtons = page.locator('button:visible')
      const buttonCount = await visibleButtons.count()

      routeResults.push({ route, status, badLinks, buttonCount })
    }

    const failedRoutes = routeResults.filter((route) => route.status !== 'loaded')
    const routesWithBadLinks = routeResults.filter((route) => route.badLinks.length > 0)

    // Facebook connect route should no longer treat authenticated user as unauthorized
    const facebookConnect = await page.request.get('/api/social/connect/facebook', { maxRedirects: 0 })
    const facebookLocation = facebookConnect.headers()['location'] ?? ''
    const facebookUnauthorized = /error=unauthorized/i.test(facebookLocation)

    // Video generation should be auth-accepted (validation errors are acceptable for minimal payload)
    const videoGenerate = await page.request.post('/api/video/generate', {
      data: { listingId: '00000000-0000-0000-0000-000000000000' },
    })
    const videoUnauthorized = videoGenerate.status() === 401

    expect(failedRoutes, `Route load failures: ${JSON.stringify(failedRoutes, null, 2)}`).toHaveLength(0)
    expect(routesWithBadLinks, `Bad internal links: ${JSON.stringify(routesWithBadLinks, null, 2)}`).toHaveLength(0)
    expect(facebookConnect.status()).toBe(307)
    expect(facebookUnauthorized, `Facebook location: ${facebookLocation}`).toBe(false)
    expect(videoUnauthorized, `Unexpected unauthorized response from /api/video/generate`).toBe(false)
  })
})
