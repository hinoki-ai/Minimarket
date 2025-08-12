import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with better error handling  
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('can navigate to products and cart', async ({ page, baseURL }) => {
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
    
    // Check for catalog heading with more specific selector
    await expect(page.locator('h1').filter({ hasText: /catálogo/i }).first()).toBeVisible({ timeout: 15000 });

    // Navigate to cart page  
    await page.goto(`${baseUrl}/cart`, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await expect(page).toHaveURL(/\/cart$/, { timeout: 15000 });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Check for cart heading with more specific selector
    await expect(page.locator('h1').filter({ hasText: /tu carrito/i }).first()).toBeVisible({ timeout: 15000 });
  });
});

