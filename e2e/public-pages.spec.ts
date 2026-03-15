import { test, expect } from '@playwright/test'

test.describe('Public pages load correctly', () => {
  test('homepage renders with hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/SnapR/i)
    // Hero section should be visible
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('homepage has navigation links', async ({ page }) => {
    await page.goto('/')
    // Should have pricing, features, or similar nav elements
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })

  test('auth login page renders', async ({ page }) => {
    await page.goto('/auth/login')
    // Should show login form
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })

  test('auth signup page renders', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  })

  test('developer portal renders', async ({ page }) => {
    await page.goto('/developers')
    await expect(page.locator('h1').first()).toBeVisible()
    // Should mention API
    const content = await page.textContent('body')
    expect(content).toMatch(/API/i)
  })

  test('API reference page renders', async ({ page }) => {
    await page.goto('/developers/api-reference')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('Protected pages redirect to login', () => {
  test('dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/auth\/login/)
    expect(page.url()).toContain('/auth/login')
    expect(page.url()).toContain('redirect=')
  })

  test('studio redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard/studio')
    await page.waitForURL(/\/auth\/login/)
    expect(page.url()).toContain('/auth/login')
  })

  test('settings redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard/settings/api-keys')
    await page.waitForURL(/\/auth\/login/)
    expect(page.url()).toContain('/auth/login')
  })

  test('admin redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL(/\/auth\/login/)
    expect(page.url()).toContain('/auth/login')
  })
})
