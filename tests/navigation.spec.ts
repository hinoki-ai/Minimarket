import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with better error handling  
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('can navigate to products and account (carrito)', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    // Start from home page
    await page.goto(baseUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForLoadState('domcontentloaded');

    // Navigate to products page
    await page.goto(`${baseUrl}/products`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await expect(page).toHaveURL(/\/products$/, { timeout: 15000 });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Check for products heading
    await expect(page.locator('h1').filter({ hasText: /productos/i }).first()).toBeVisible({ timeout: 15000 });

    // Navigate to carrito (merged account/cart) - this is a protected route
    await page.goto(`${baseUrl}/carrito`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check if redirected to authentication (expected for protected route)
    const currentURL = page.url();
    if (currentURL.includes('sign-in') || currentURL.includes('login') || currentURL.includes('auth')) {
      console.log('✓ Carrito route correctly redirects to authentication (protected route)');
    } else {
      // If not redirected, check for carrito/account content
      await expect(page.locator('h1').filter({ hasText: /carrito|panel|mi cuenta|cart|account/i }).first()).toBeVisible({ timeout: 15000 });
      console.log('✓ Carrito page loaded successfully');
    }
  });
});

