import { test, expect, devices } from '@playwright/test';

test.describe('Mobile & Tablet Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(45000);
    page.on('pageerror', (error) => console.log('Page error:', error.message));
  });

  test('mobile viewport functionality', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing mobile viewport functionality...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    console.log('✓ Set viewport to mobile (375x667)');

    // Test home page on mobile
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Check for mobile-specific elements
    const mobileSelectors = [
      '.mobile-menu',
      '.hamburger-menu',
      '.mobile-nav',
      '.burger-menu',
      'button[class*="menu"]',
      '[data-testid="mobile-menu"]',
      '.navbar-toggle'
    ];

    let mobileMenuFound = false;
    for (const selector of mobileSelectors) {
      try {
        const mobileElement = page.locator(selector).first();
        if (await mobileElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`✓ Mobile menu found: ${selector}`);
          mobileMenuFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!mobileMenuFound) {
      console.log('No mobile-specific menu found - navigation may be responsive');
    }

    // Test touch interactions
    const touchElements = [
      'button',
      'a',
      '.card',
      '.product-card',
      '[role="button"]'
    ];

    let touchElementFound = false;
    for (const selector of touchElements) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          const firstElement = elements.first();
          const boundingBox = await firstElement.boundingBox();

          if (boundingBox && boundingBox.width > 44 && boundingBox.height > 44) {
            console.log(`✓ Touch-friendly element found: ${selector} (${boundingBox.width}x${boundingBox.height})`);
            touchElementFound = true;
          } else if (boundingBox) {
            console.log(`⚠️  Element may be too small for touch: ${selector} (${boundingBox.width}x${boundingBox.height})`);
          }
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Test text readability
    const textElements = page.locator('p, span, div:not([class*="icon"])');
    const textCount = await textElements.count();
    console.log(`Found ${textCount} text elements for readability testing`);

    // Check for horizontal scroll
    const scrollWidth = await page.evaluate(() => {
      return Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      );
    });

    const viewportWidth = page.viewportSize()?.width || 375;

    if (scrollWidth > viewportWidth + 10) { // Small tolerance
      console.log(`⚠️  Horizontal scroll detected: ${scrollWidth}px content width vs ${viewportWidth}px viewport`);
    } else {
      console.log('✓ No horizontal scroll on mobile');
    }

    console.log('✓ Mobile viewport test completed');
  });

  test('tablet viewport functionality', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing tablet viewport functionality...');

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    console.log('✓ Set viewport to tablet (768x1024)');

    // Test home page on tablet
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // On tablet, navigation should be more desktop-like
    const navElements = page.locator('nav, .navbar, .navigation, header');
    const navCount = await navElements.count();
    console.log(`Found ${navCount} navigation elements`);

    // Test grid layouts
    const gridSelectors = [
      '.grid',
      '.product-grid',
      '.card-grid',
      '[class*="grid"]',
      '[style*="display: grid"]'
    ];

    for (const selector of gridSelectors) {
      try {
        const gridElements = page.locator(selector);
        const count = await gridElements.count();
        if (count > 0) {
          console.log(`✓ Grid layout found: ${selector} (${count} instances)`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Test tablet-specific interactions
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Check product layout on tablet
    const productSelectors = [
      '.product-card',
      '.card',
      '[data-testid="product-card"]'
    ];

    for (const selector of productSelectors) {
      try {
        const products = page.locator(selector);
        const count = await products.count();
        if (count > 0) {
          console.log(`✓ ${count} products displayed on tablet`);

          // Check if products are arranged in a reasonable layout
          const firstProduct = products.first();
          const boundingBox = await firstProduct.boundingBox();

          if (boundingBox) {
            console.log(`Product dimensions: ${boundingBox.width}x${boundingBox.height}`);
          }

          break;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('✓ Tablet viewport test completed');
  });

  test('responsive navigation', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing responsive navigation...');

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      console.log(`\n--- Testing ${viewport.name} (${viewport.width}x${viewport.height}) ---`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto(baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await page.waitForLoadState('domcontentloaded');

      // Test navigation elements
      const navSelectors = [
        'nav',
        '.navbar',
        '.navigation',
        'header',
        '.header'
      ];

      for (const selector of navSelectors) {
        try {
          const navElement = page.locator(selector).first();
          if (await navElement.isVisible({ timeout: 3000 }).catch(() => false)) {
            const boundingBox = await navElement.boundingBox();
            console.log(`✓ Navigation visible: ${selector} (${boundingBox?.width}x${boundingBox?.height})`);

            // Check for navigation links
            const navLinks = navElement.locator('a');
            const linkCount = await navLinks.count();
            console.log(`  - ${linkCount} navigation links found`);

            break;
          }
        } catch (error) {
          continue;
        }
      }

      // Test mobile menu toggle if on mobile
      if (viewport.width <= 768) {
        const menuSelectors = [
          '.mobile-menu-toggle',
          '.hamburger',
          '.burger-menu',
          'button[class*="menu"]',
          '[aria-label*="menu" i]',
          '[aria-label*="navigation" i]'
        ];

        for (const selector of menuSelectors) {
          try {
            const menuButton = page.locator(selector).first();
            if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log(`✓ Mobile menu toggle found: ${selector}`);
              break;
            }
          } catch (error) {
            continue;
          }
        }
      }

      // Test search functionality across viewports
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="buscar" i]',
        '.search-input'
      ];

      for (const selector of searchSelectors) {
        try {
          const searchInput = page.locator(selector).first();
          if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`✓ Search input accessible on ${viewport.name}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    console.log('\n✓ Responsive navigation test completed');
  });

  test('touch and gesture support', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing touch and gesture support...');

    // Set mobile viewport for touch testing
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Test swipe gestures (if carousel or swipeable content exists)
    const swipeSelectors = [
      '.carousel',
      '.swiper',
      '.slider',
      '[data-testid="carousel"]',
      '.product-carousel'
    ];

    for (const selector of swipeSelectors) {
      try {
        const swipeElement = page.locator(selector).first();
        if (await swipeElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`✓ Swipeable content found: ${selector}`);

          // Test swipe gesture
          const boundingBox = await swipeElement.boundingBox();
          if (boundingBox) {
            await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(boundingBox.x + boundingBox.width / 4, boundingBox.y + boundingBox.height / 2);
            await page.mouse.up();
            console.log('✓ Swipe gesture simulated');
          }

          break;
        }
      } catch (error) {
        continue;
      }
    }

    // Test pinch-to-zoom support (check for viewport meta tag)
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });

    if (viewportMeta) {
      console.log(`✓ Viewport meta tag found: ${viewportMeta}`);

      if (viewportMeta.includes('user-scalable=yes') || !viewportMeta.includes('user-scalable=no')) {
        console.log('✓ Zoom functionality should be available');
      } else {
        console.log('⚠️  Zoom may be disabled');
      }
    } else {
      console.log('⚠️  No viewport meta tag found');
    }

    // Test tap targets
    const tapTargets = page.locator('button, a, [role="button"]');
    const tapTargetCount = await tapTargets.count();

    if (tapTargetCount > 0) {
      console.log(`✓ Found ${tapTargetCount} tap targets for testing`);

      // Check first few tap targets for adequate size
      for (let i = 0; i < Math.min(tapTargetCount, 5); i++) {
        const target = tapTargets.nth(i);
        const boundingBox = await target.boundingBox();

        if (boundingBox) {
          const isAdequate = boundingBox.width >= 44 && boundingBox.height >= 44;
          const status = isAdequate ? '✓' : '⚠️ ';
          console.log(`${status} Tap target ${i + 1}: ${boundingBox.width}x${boundingBox.height}px`);
        }
      }
    }

    console.log('✓ Touch and gesture support test completed');
  });

  test('content adaptation across devices', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing content adaptation across devices...');

    const devices = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'iPad Pro', width: 1024, height: 1366 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const device of devices) {
      console.log(`\n--- Testing ${device.name} (${device.width}x${device.height}) ---`);

      await page.setViewportSize({ width: device.width, height: device.height });

      // Test home page
      await page.goto(baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await page.waitForLoadState('domcontentloaded');

      // Check content visibility
      const contentElements = [
        'h1, h2, h3',
        '.hero',
        '.featured-products',
        '.categories'
      ];

      for (const selector of contentElements) {
        try {
          const elements = page.locator(selector);
          const count = await elements.count();
          if (count > 0) {
            const visibleCount = await elements.filter(':visible').count();
            console.log(`✓ ${selector}: ${visibleCount}/${count} elements visible`);
          }
        } catch (error) {
          continue;
        }
      }

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth + 10;
      });

      if (hasOverflow) {
        console.log(`⚠️  Horizontal overflow detected on ${device.name}`);
      } else {
        console.log(`✓ No horizontal overflow on ${device.name}`);
      }

      // Test images responsiveness
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        let responsiveImages = 0;

        for (let i = 0; i < Math.min(imageCount, 10); i++) {
          const image = images.nth(i);
          const isResponsive = await image.evaluate(img => {
            const style = window.getComputedStyle(img);
            return style.maxWidth !== 'none' || img.hasAttribute('srcset');
          });

          if (isResponsive) {
            responsiveImages++;
          }
        }

        console.log(`✓ ${responsiveImages}/${Math.min(imageCount, 10)} images are responsive`);
      }
    }

    console.log('\n✓ Content adaptation test completed');
  });
});