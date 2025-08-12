import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('can navigate to products and cart', async ({ page, baseURL }) => {
    await page.goto(baseURL || 'http://localhost:3000/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    await page.goto((baseURL || 'http://localhost:3000') + '/products');
    await expect(page).toHaveURL(/\/products$/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Catálogo/i })).toBeVisible({ timeout: 15000 });

    await page.goto((baseURL || 'http://localhost:3000') + '/cart');
    await expect(page).toHaveURL(/\/cart$/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Tu carrito/i })).toBeVisible({ timeout: 15000 });
  });
});

