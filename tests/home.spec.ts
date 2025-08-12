import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test('loads and shows hero + categories', async ({ page, baseURL }) => {
    await page.goto(baseURL || 'http://localhost:3000/');

    await expect(page).toHaveTitle(/Minimarket ARAMAC/i);

    await expect(page.locator('main')).toBeVisible();

    await expect(page.getByRole('heading', { name: /Categorías/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Productos destacados/i })).toBeVisible();
  });
});

