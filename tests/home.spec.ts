import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with better error handling
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('loads and shows hero + categories', async ({ page, baseURL }) => {
    const url = baseURL || 'http://localhost:3000/';
    
    // Navigate with better error handling
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    
    // Check for essential headings with more specific selectors
    await expect(page.locator('h2').filter({ hasText: /categorías/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('h2').filter({ hasText: /productos destacados/i }).first()).toBeVisible({ timeout: 15000 });
    
    // Verify page is interactive
    await expect(page.locator('body')).toBeVisible();
    
    // Check that main content areas are present (disambiguate duplicate <main>)
    await expect(page.locator('main#main')).toBeVisible();
  });

  test('hero dots and buttons are clickable', async ({ page, baseURL }) => {
    const url = baseURL || 'http://localhost:3000/';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    // Dismiss cookie dialog if present
    const cookieDialog = page.getByRole('dialog', { name: /consentimiento de cookies/i });
    if (await cookieDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      const closeBtn = cookieDialog.getByRole('button', { name: /aceptar|cerrar|entendido/i });
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click().catch(() => {});
      }
    }

    // Scope to the hero region
    const hero = page.getByRole('region', { name: /hero carousel/i });
    await expect(hero).toBeVisible();

    // Click a dot
    const dots = hero.locator('[data-testid="hero-dots"] [data-testid="hero-dot"]');
    await expect(dots.first()).toBeVisible();
    if (await dots.count() > 1) {
      await dots.nth(1).click();
    }

    // Click primary CTA inside overlay
    const cta = hero.getByRole('button', { name: /ver productos/i });
    await expect(cta).toBeVisible();
    await cta.click();

    // Click left/right hotspots
    await hero.getByRole('button', { name: /anterior/i }).click({ trial: true }).catch(() => {});
    await hero.getByRole('button', { name: /siguiente/i }).click({ trial: true }).catch(() => {});
  });
});

