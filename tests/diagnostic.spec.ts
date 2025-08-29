import { test, expect } from '@playwright/test';

test.describe('Diagnostic Tests', () => {
  test('investigate products page content', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('=== DIAGNOSTIC: Investigating products page ===');

    // Navigate to products page
    console.log('Navigating to products page...');
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for dynamic content

    // Take a screenshot for debugging
    await page.screenshot({
      path: 'test-results/diagnostic-products-page.png',
      fullPage: true
    });

    // Get page content for analysis
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);

    // Check for headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    console.log(`Found ${headingCount} headings:`);

    for (let i = 0; i < Math.min(headingCount, 5); i++) {
      const heading = headings.nth(i);
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const text = await heading.textContent();
      console.log(`  ${tagName}: "${text.trim()}"`);
    }

    // Check for product-related elements
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      '[class*="product"]',
      'article',
      '.card',
      '[role="article"]',
      '.product',
      '[data-testid="product"]'
    ];

    for (const selector of productSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ Found ${count} elements with selector: ${selector}`);

          // Get details of first element
          const firstElement = elements.first();
          const text = await firstElement.textContent();
          const className = await firstElement.getAttribute('class') || '';
          const dataTestId = await firstElement.getAttribute('data-testid') || '';

          console.log(`   First element details:`);
          console.log(`   - Text: ${text.substring(0, 100)}...`);
          console.log(`   - Class: ${className}`);
          console.log(`   - data-testid: ${dataTestId}`);
        } else {
          console.log(`❌ No elements found with selector: ${selector}`);
        }
      } catch (error) {
        console.log(`⚠️  Error with selector ${selector}: ${error.message}`);
      }
    }

    // Check for links that might be products
    const links = page.locator('a');
    const linkCount = await links.count();
    console.log(`Found ${linkCount} links on page`);

    let productLinks = 0;
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href') || '';
      const text = await link.textContent();

      if (href.includes('product') || href.includes('productos') || text.toLowerCase().includes('product')) {
        productLinks++;
        console.log(`   Product link ${productLinks}: "${text.trim()}" -> ${href}`);
      }
    }

    // Check for loading states or empty states
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      '.skeleton',
      '.empty',
      '.no-products',
      '.no-data'
    ];

    for (const selector of loadingSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
          const text = await element.textContent();
          console.log(`⚠️  Found loading/empty state: ${selector} - "${text.trim()}"`);
        }
      } catch (error) {
        // Element not found or not visible
      }
    }

    // Check for JavaScript errors
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log(`⚠️  JavaScript errors detected:`);
      errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }

    // Check network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('product') || request.url().includes('api')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        });
      }
    });

    await page.waitForTimeout(3000);

    if (networkRequests.length > 0) {
      console.log(`📡 Network requests related to products:`);
      networkRequests.slice(0, 5).forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.method} ${req.url} (${req.resourceType})`);
      });
    }

    console.log('=== DIAGNOSTIC COMPLETE ===');
  });

  test('investigate home page content', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('=== DIAGNOSTIC: Investigating home page ===');

    // Navigate to home page
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/diagnostic-home-page.png',
      fullPage: true
    });

    // Check for category elements
    const categorySelectors = [
      '.category',
      '.categories',
      '[data-testid="category"]',
      '.category-card',
      '.category-link',
      'a[href*="category"]',
      'a[href*="categoria"]'
    ];

    console.log('Checking for category elements:');
    for (const selector of categorySelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          console.log(`✅ Found ${count} category elements with selector: ${selector}`);
        }
      } catch (error) {
        console.log(`❌ Error with selector ${selector}: ${error.message}`);
      }
    }

    console.log('=== HOME PAGE DIAGNOSTIC COMPLETE ===');
  });
});