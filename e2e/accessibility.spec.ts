import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Axe-core automated accessibility audit for public pages
// Checks WCAG 2.1 AA compliance on pages accessible without auth

test.describe('Accessibility audit (WCAG 2.1 AA)', () => {
  test('homepage passes accessibility checks', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.remotion-player') // Remotion embeds have their own a11y context
      .analyze()

    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (violations.length > 0) {
      const summary = violations.map(
        (v) =>
          `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)\n` +
          v.nodes.map((n) => `  - ${n.html.slice(0, 120)}`).join('\n')
      )
      console.log('Accessibility violations:\n' + summary.join('\n\n'))
    }

    expect(violations).toHaveLength(0)
  })

  test('login page passes accessibility checks', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (violations.length > 0) {
      const summary = violations.map(
        (v) =>
          `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)\n` +
          v.nodes.map((n) => `  - ${n.html.slice(0, 120)}`).join('\n')
      )
      console.log('Accessibility violations:\n' + summary.join('\n\n'))
    }

    expect(violations).toHaveLength(0)
  })

  test('signup page passes accessibility checks', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(violations).toHaveLength(0)
  })

  test('developer portal passes accessibility checks', async ({ page }) => {
    await page.goto('/developers')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(violations).toHaveLength(0)
  })

  test('API reference page passes accessibility checks', async ({ page }) => {
    await page.goto('/developers/api-reference')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    expect(violations).toHaveLength(0)
  })
})
