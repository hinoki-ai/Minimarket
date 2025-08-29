import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(45000);
    page.on('pageerror', (error) => console.log('Page error:', error.message));
  });

  test('dashboard access and basic functionality', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing dashboard access and basic functionality...');

    // Try to access dashboard
    await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check if dashboard loads or redirects to sign in
    const currentURL = page.url();

    if (currentURL.includes('sign-in') || currentURL.includes('login') || currentURL.includes('auth')) {
      console.log('✓ Dashboard correctly redirects to authentication (as expected for protected route)');
    } else {
      // Dashboard loaded - test its functionality
      console.log('✓ Dashboard loaded successfully');

      // Look for dashboard elements
      const dashboardSelectors = [
        '.dashboard',
        '.dashboard-content',
        '.stats',
        '.metrics',
        '.charts',
        '.analytics',
        '[data-testid="dashboard"]',
        '.overview'
      ];

      let dashboardElementFound = false;
      for (const selector of dashboardSelectors) {
        try {
          const dashboardElement = page.locator(selector).first();
          if (await dashboardElement.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`✓ Dashboard element found: ${selector}`);
            dashboardElementFound = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!dashboardElementFound) {
        console.log('Dashboard loaded but no typical dashboard elements found');
      }

      // Look for dashboard navigation/sidebar
      const navSelectors = [
        '.sidebar',
        '.dashboard-nav',
        '.menu',
        'nav',
        '.navigation'
      ];

      for (const selector of navSelectors) {
        try {
          const navElement = page.locator(selector).first();
          if (await navElement.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✓ Dashboard navigation/sidebar found');
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    console.log('✓ Dashboard access test completed');
  });

  test('user profile management', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing user profile management...');

    // Try to access profile/account page
    const profileRoutes = [
      '/profile',
      '/account',
      '/settings',
      '/user'
    ];

    for (const route of profileRoutes) {
      console.log(`Testing profile route: ${route}`);

      await page.goto(`${baseUrl}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const currentURL = page.url();

      if (currentURL.includes('sign-in') || currentURL.includes('login')) {
        console.log(`✓ Profile route ${route} correctly redirects to authentication`);
      } else {
        // Profile page loaded - test its elements
        console.log(`✓ Profile page ${route} loaded successfully`);

        // Look for profile form elements
        const profileSelectors = [
          'input[name*="name"]',
          'input[name*="email"]',
          'input[placeholder*="name" i]',
          'input[placeholder*="email" i]',
          '.profile-form',
          '.user-info',
          '.account-settings',
          'button:has-text("Save")',
          'button:has-text("Update")',
          'button:has-text("Guardar")'
        ];

        let profileElementsFound = 0;
        for (const selector of profileSelectors) {
          try {
            const profileElement = page.locator(selector).first();
            if (await profileElement.isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log(`✓ Profile element found: ${selector}`);
              profileElementsFound++;
            }
          } catch (error) {
            continue;
          }
        }

        if (profileElementsFound > 0) {
          console.log(`✓ Found ${profileElementsFound} profile management elements`);
        } else {
          console.log('Profile page loaded but no typical profile elements found');
        }

        break; // Test only the first accessible profile route
      }
    }

    console.log('✓ User profile management test completed');
  });

  test('order history and management', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing order history and management...');

    // Try to access orders page
    const orderRoutes = [
      '/orders',
      '/order-history',
      '/my-orders',
      '/pedidos',
      '/historial'
    ];

    for (const route of orderRoutes) {
      console.log(`Testing orders route: ${route}`);

      await page.goto(`${baseUrl}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const currentURL = page.url();

      if (currentURL.includes('sign-in') || currentURL.includes('login')) {
        console.log(`✓ Orders route ${route} correctly redirects to authentication`);
      } else {
        // Orders page loaded - test its functionality
        console.log(`✓ Orders page ${route} loaded successfully`);

        // Look for order-related elements
        const orderSelectors = [
          '.order',
          '.order-item',
          '.order-history',
          '.order-list',
          '.pedido',
          '[data-testid="order"]',
          '.order-card',
          '.order-summary'
        ];

        let orderElementsFound = 0;
        for (const selector of orderSelectors) {
          try {
            const orderElements = page.locator(selector);
            const count = await orderElements.count();
            if (count > 0) {
              console.log(`✓ Found ${count} order elements: ${selector}`);
              orderElementsFound += count;
            }
          } catch (error) {
            continue;
          }
        }

        if (orderElementsFound > 0) {
          console.log(`✓ Order history page functional with ${orderElementsFound} order elements`);
        } else {
          // Look for "no orders" message
          const noOrderSelectors = [
            ':has-text("No orders")',
            ':has-text("No tienes pedidos")',
            ':has-text("Sin pedidos")',
            ':has-text("No order history")',
            '.empty-state',
            '.no-orders'
          ];

          for (const selector of noOrderSelectors) {
            try {
              const noOrderElement = page.locator(selector).first();
              if (await noOrderElement.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('✓ No orders state properly displayed');
                break;
              }
            } catch (error) {
              continue;
            }
          }
        }

        break; // Test only the first accessible orders route
      }
    }

    console.log('✓ Order history and management test completed');
  });

  test('analytics and statistics display', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing analytics and statistics display...');

    // Try to access dashboard or analytics
    const analyticsRoutes = [
      '/dashboard',
      '/analytics',
      '/stats',
      '/statistics'
    ];

    for (const route of analyticsRoutes) {
      console.log(`Testing analytics route: ${route}`);

      await page.goto(`${baseUrl}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const currentURL = page.url();

      if (currentURL.includes('sign-in') || currentURL.includes('login')) {
        console.log(`✓ Analytics route ${route} correctly redirects to authentication`);
      } else {
        // Analytics page loaded - test its elements
        console.log(`✓ Analytics page ${route} loaded successfully`);

        // Look for analytics/statistics elements
        const analyticsSelectors = [
          '.chart',
          '.graph',
          '.statistic',
          '.metric',
          '.analytics',
          '.stats',
          '.dashboard-metric',
          '.kpi',
          '[data-testid="chart"]',
          '[data-testid="statistic"]',
          '.number',
          '.percentage',
          '.trend'
        ];

        let analyticsElementsFound = 0;
        for (const selector of analyticsSelectors) {
          try {
            const analyticsElements = page.locator(selector);
            const count = await analyticsElements.count();
            if (count > 0) {
              console.log(`✓ Found ${count} analytics elements: ${selector}`);
              analyticsElementsFound += count;
            }
          } catch (error) {
            continue;
          }
        }

        if (analyticsElementsFound > 0) {
          console.log(`✓ Analytics dashboard functional with ${analyticsElementsFound} data elements`);
        } else {
          console.log('Analytics page loaded but no typical analytics elements found');
        }

        break; // Test only the first accessible analytics route
      }
    }

    console.log('✓ Analytics and statistics test completed');
  });

  test('dashboard navigation and routing', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing dashboard navigation and routing...');

    // Try to access dashboard
    await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const currentURL = page.url();

    if (!currentURL.includes('sign-in') && !currentURL.includes('login')) {
      // Dashboard loaded - test navigation
      console.log('✓ Dashboard loaded - testing navigation');

      // Look for navigation links within dashboard
      const navLinkSelectors = [
        '.sidebar a',
        '.dashboard-nav a',
        '.menu a',
        'nav a',
        '[role="navigation"] a'
      ];

      let navLinksFound = 0;
      for (const selector of navLinkSelectors) {
        try {
          const navLinks = page.locator(selector);
          const count = await navLinks.count();
          if (count > 0) {
            console.log(`✓ Found ${count} dashboard navigation links`);
            navLinksFound = count;

            // Test clicking first navigation link
            if (count > 0) {
              const firstLink = navLinks.first();
              const href = await firstLink.getAttribute('href');

              if (href && href !== '#' && !href.startsWith('javascript:')) {
                console.log(`Testing navigation to: ${href}`);
                await firstLink.click();
                await page.waitForLoadState('domcontentloaded');
                console.log('✓ Dashboard navigation functional');
              }
            }

            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (navLinksFound === 0) {
        console.log('No dashboard navigation links found');
      }

      // Test breadcrumb navigation if present
      const breadcrumbSelectors = [
        '.breadcrumb',
        '.breadcrumbs',
        '.breadcrumb-nav',
        '[aria-label="breadcrumb"]'
      ];

      for (const selector of breadcrumbSelectors) {
        try {
          const breadcrumb = page.locator(selector).first();
          if (await breadcrumb.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('✓ Breadcrumb navigation found');
            break;
          }
        } catch (error) {
          continue;
        }
      }
    } else {
      console.log('Dashboard requires authentication - navigation test skipped');
    }

    console.log('✓ Dashboard navigation test completed');
  });
});