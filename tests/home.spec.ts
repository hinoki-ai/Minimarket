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
    
    // Check that main content areas are present
    await expect(page.locator('main')).toBeVisible();
  });
});

