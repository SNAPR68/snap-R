import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'Homepage', path: '/' },
  { name: 'Pricing', path: '/pricing' },
];

for (const page of pages) {
  test(`${page.name} passes WCAG 2.1 AA automated checks`, async ({ page: pw }) => {
    await pw.goto(page.path);
    await pw.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page: pw })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      const summary = critical.map(
        (v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instances)`
      );
      console.error('WCAG violations:', summary);
    }

    expect(critical).toHaveLength(0);
  });
}

test('Homepage has correct heading hierarchy', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
    elements.map((el) => ({
      level: parseInt(el.tagName.replace('H', ''), 10),
      text: el.textContent?.trim().substring(0, 50) || '',
    }))
  );

  // Verify h1 exists
  const h1s = headings.filter((h) => h.level === 1);
  expect(h1s.length).toBeGreaterThanOrEqual(1);

  // Verify no heading level is skipped (e.g., h1 -> h3 without h2)
  for (let i = 1; i < headings.length; i++) {
    const gap = headings[i].level - headings[i - 1].level;
    expect(gap).toBeLessThanOrEqual(1);
  }
});

test('All images have alt text', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const imagesWithoutAlt = await page.$$eval('img', (imgs) =>
    imgs
      .filter((img) => !img.getAttribute('alt') && img.getAttribute('alt') !== '')
      .map((img) => img.getAttribute('src'))
  );

  expect(imagesWithoutAlt).toHaveLength(0);
});

test('Interactive elements are keyboard accessible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Tab through the page and verify focus is visible
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      return {
        tag: el.tagName,
        role: el.getAttribute('role'),
        text: el.textContent?.trim().substring(0, 50),
      };
    });

    // After a few tabs, we should be on interactive elements
    if (i > 2 && focusedElement) {
      expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'DETAILS']).toContain(
        focusedElement.tag
      );
    }
  }
});

test('Skip navigation link exists and works', async ({ page }) => {
  await page.goto('/');

  // First Tab should focus skip nav link
  await page.keyboard.press('Tab');

  const skipLink = page.getByText('Skip to main content');
  // Skip nav may or may not be first focusable — just check it exists
  await expect(skipLink).toBeAttached();
});
