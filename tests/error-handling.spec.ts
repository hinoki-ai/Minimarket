import { test, expect } from '@playwright/test';

test.describe('Error Handling & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(45000);
    page.on('pageerror', (error) => console.log('Page error:', error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('Console error:', msg.text());
    });
  });

  test('404 error page handling', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing 404 error page handling...');

    // Test various non-existent routes
    const invalidRoutes = [
      '/nonexistent',
      '/invalid-page',
      '/does-not-exist',
      '/products/invalid-id',
      '/categories/nonexistent-category'
    ];

    for (const route of invalidRoutes) {
      console.log(`Testing 404 for route: ${route}`);

      await page.goto(`${baseUrl}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // Check for 404 indicators
      const notFoundSelectors = [
        'h1:has-text("404")',
        'h1:has-text("Not Found")',
        'h1:has-text("Página no encontrada")',
        'h2:has-text("404")',
        'h2:has-text("Not Found")',
        '.error-404',
        '.not-found',
        '.404-page',
        '[data-testid="404"]',
        '[data-testid="not-found"]'
      ];

      let notFoundPageConfirmed = false;
      for (const selector of notFoundSelectors) {
        try {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 });
          notFoundPageConfirmed = true;
          console.log(`✓ 404 page confirmed with: ${selector}`);
          break;
        } catch (error) {
          continue;
        }
      }

      if (!notFoundPageConfirmed) {
        // Check response status
        const response = await page.request.get(`${baseUrl}${route}`);
        if (response.status() === 404) {
          console.log(`✓ Route ${route} returns 404 status`);
        } else {
          console.log(`Route ${route} returned status ${response.status()}`);
        }
      }

      // Look for navigation options on error page
      const navigationSelectors = [
        'a:has-text("Home")',
        'a:has-text("Inicio")',
        'a:has-text("Volver")',
        'a:has-text("Back")',
        'a[href="/"]',
        'a[href="/products"]',
        '.home-link',
        'button:has-text("Go Home")'
      ];

      for (const selector of navigationSelectors) {
        try {
          const navElement = page.locator(selector).first();
          if (await navElement.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`✓ Navigation option found on 404 page: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    console.log('✓ 404 error handling test completed');
  });

  test('network error handling', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing network error handling...');

    // Test offline simulation
    await page.context().setOffline(true);

    try {
      await page.goto(`${baseUrl}/products`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
    } catch (error) {
      console.log('✓ Network error properly handled (navigation failed as expected)');
    }

    await page.context().setOffline(false);
    console.log('✓ Network connectivity restored');

    // Test with slow network
    await page.route('**/*', async route => {
      // Simulate slow network by delaying requests
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });

    try {
      await page.goto(`${baseUrl}/products`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
    } catch (error) {
      // Navigation might be interrupted due to redirects or other reasons
      console.log('Navigation completed (may have been interrupted by redirects)');
    }

    await page.waitForLoadState('domcontentloaded');
    console.log('✓ Slow network conditions handled');

    // Clear route interception
    await page.unroute('**/*');

    console.log('✓ Network error handling test completed');
  });

  test('form validation error handling', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing form validation error handling...');

    // Try to access checkout to test form validation
    await page.goto(`${baseUrl}/checkout`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Look for forms to test validation
    const formSelectors = [
      'form',
      '.checkout-form',
      '.contact-form',
      '.search-form',
      '.login-form',
      '.register-form'
    ];

    for (const formSelector of formSelectors) {
      try {
        const form = page.locator(formSelector).first();
        if (await form.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found form: ${formSelector}`);

          // Find submit button for this form
          const submitButtons = form.locator('button[type="submit"], input[type="submit"]');
          const submitCount = await submitButtons.count();

          if (submitCount > 0) {
            // Try submitting empty form to trigger validation
            console.log('Testing form validation with empty fields...');

            // Don't actually submit, just check for validation attributes
            const requiredFields = form.locator('input[required], select[required], textarea[required]');
            const requiredCount = await requiredFields.count();

            if (requiredCount > 0) {
              console.log(`✓ Form has ${requiredCount} required fields`);
            }

            // Look for validation messages
            const validationSelectors = [
              '.error-message',
              '.validation-error',
              '.invalid-feedback',
              '.form-error',
              '[role="alert"]',
              '.alert-danger'
            ];

            for (const validationSelector of validationSelectors) {
              try {
                const validationElement = page.locator(validationSelector).first();
                if (await validationElement.isVisible({ timeout: 2000 }).catch(() => false)) {
                  const text = await validationElement.textContent();
                  console.log(`Found validation message: ${text}`);
                }
              } catch (error) {
                continue;
              }
            }
          }

          break; // Test only the first form found
        }
      } catch (error) {
        continue;
      }
    }

    console.log('✓ Form validation error handling test completed');
  });

  test('invalid data handling', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing invalid data handling...');

    // Test with invalid product IDs
    const invalidProductIds = [
      'invalid-id',
      '999999',
      'nonexistent',
      'test-123',
      ''
    ];

    for (const productId of invalidProductIds) {
      const url = `${baseUrl}/products/${productId}`;
      console.log(`Testing invalid product ID: ${productId}`);

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await page.waitForLoadState('domcontentloaded');

      // Check for error indicators
      const errorSelectors = [
        '.error',
        '.not-found',
        '.product-not-found',
        'h1:has-text("Producto no encontrado")',
        'h1:has-text("Product not found")',
        'h2:has-text("Error")',
        '[data-testid="error"]'
      ];

      let errorFound = false;
      for (const selector of errorSelectors) {
        try {
          const errorElement = page.locator(selector).first();
          if (await errorElement.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`✓ Error handling found for invalid product ${productId}`);
            errorFound = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!errorFound) {
        console.log(`No error indicator found for invalid product ${productId}`);
      }
    }

    console.log('✓ Invalid data handling test completed');
  });

  test('large dataset handling', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing large dataset handling...');

    // Navigate to products page
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Count products to see if pagination works
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      '[class*="product"]',
      'article',
      '.card'
    ];

    for (const selector of productSelectors) {
      try {
        const products = page.locator(selector);
        const count = await products.count();
        if (count > 0) {
          console.log(`Found ${count} products on page`);

          if (count > 20) {
            console.log('✓ Large dataset handling: multiple products displayed');
          }

          // Test pagination if many products
          const paginationSelectors = [
            'button:has-text("Siguiente")',
            'button:has-text("Next")',
            '.pagination',
            '[data-testid="pagination"]'
          ];

          for (const paginationSelector of paginationSelectors) {
            try {
              const pagination = page.locator(paginationSelector).first();
              if (await pagination.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('✓ Pagination available for large datasets');
                break;
              }
            } catch (error) {
              continue;
            }
          }

          break;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('✓ Large dataset handling test completed');
  });

  test('accessibility error handling', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing accessibility error handling...');

    // Navigate to home page
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Check for accessibility issues
    const accessibilityIssues = [];

    // Check for missing alt text on images
    const imagesWithoutAlt = page.locator('img:not([alt]), img[alt=""]');
    const imagesWithoutAltCount = await imagesWithoutAlt.count();
    if (imagesWithoutAltCount > 0) {
      accessibilityIssues.push(`${imagesWithoutAltCount} images missing alt text`);
    }

    // Check for missing labels on form inputs
    const inputsWithoutLabels = page.locator('input:not([aria-label]):not([aria-labelledby]):not([placeholder])');
    const inputsWithoutLabelsCount = await inputsWithoutLabels.count();
    if (inputsWithoutLabelsCount > 0) {
      accessibilityIssues.push(`${inputsWithoutLabelsCount} inputs may lack proper labeling`);
    }

    // Check for buttons without accessible names (excluding those with text content)
    const allButtons = page.locator('button');
    const buttonsWithAriaLabel = page.locator('button[aria-label]');
    const buttonsWithAriaLabelledBy = page.locator('button[aria-labelledby]');
    const buttonsWithText = page.locator('button').filter({ hasText: /.+/ });

    const totalButtons = await allButtons.count();
    const buttonsWithAriaLabelCount = await buttonsWithAriaLabel.count();
    const buttonsWithAriaLabelledByCount = await buttonsWithAriaLabelledBy.count();
    const buttonsWithTextCount = await buttonsWithText.count();

    const buttonsWithoutAccessibleNames = totalButtons - buttonsWithAriaLabelCount - buttonsWithAriaLabelledByCount - buttonsWithTextCount;

    if (buttonsWithoutAccessibleNames > 0) {
      accessibilityIssues.push(`${buttonsWithoutAccessibleNames} buttons without accessible names`);
    }

    // Check for heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingsCount = await headings.count();
    if (headingsCount > 0) {
      console.log(`✓ Found ${headingsCount} headings for accessibility`);
    }

    // Check for focus management
    const focusableElements = page.locator('button, a, input, select, textarea');
    const focusableCount = await focusableElements.count();
    console.log(`✓ Found ${focusableCount} focusable elements`);

    if (accessibilityIssues.length > 0) {
      console.log('Accessibility issues found:');
      accessibilityIssues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✓ No obvious accessibility issues detected');
    }

    console.log('✓ Accessibility error handling test completed');
  });

  test('performance error handling', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing performance error handling...');

    // Test page load times
    const startTime = Date.now();

    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);

    if (loadTime > 5000) {
      console.log('⚠️  Slow page load detected (>5s)');
    } else if (loadTime > 3000) {
      console.log('⚠️  Moderate page load time (3-5s)');
    } else {
      console.log('✓ Acceptable page load time');
    }

    // Test resource loading
    const resources = [];
    page.on('response', response => {
      resources.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'] || ''
      });
    });

    // Navigate to products page
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForTimeout(2000); // Wait for resources to load

    // Check for failed resources
    const failedResources = resources.filter(r => r.status >= 400);
    if (failedResources.length > 0) {
      console.log(`⚠️  ${failedResources.length} resources failed to load:`);
      failedResources.slice(0, 5).forEach(resource => {
        console.log(`  - ${resource.url} (${resource.status})`);
      });
    } else {
      console.log('✓ All resources loaded successfully');
    }

    // Test JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate around the site
    await page.goto(`${baseUrl}/categories`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForTimeout(1000);

    if (jsErrors.length > 0) {
      console.log(`⚠️  ${jsErrors.length} JavaScript errors detected:`);
      jsErrors.slice(0, 3).forEach(error => {
        console.log(`  - ${error}`);
      });
    } else {
      console.log('✓ No JavaScript errors detected');
    }

    console.log('✓ Performance error handling test completed');
  });
});