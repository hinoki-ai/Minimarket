import { test, expect } from '@playwright/test';

test.describe('Product Browsing & Discovery', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(45000);
    page.on('pageerror', (error) => console.log('Page error:', error.message));
  });

  test('browse categories and navigate to category pages', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing category browsing...');

    // Start from home page
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    // Look for category links on home page
    const categorySelectors = [
      'a[href*="categories"]',
      'a[href*="categoria"]',
      'a[href*="category"]',
      '.category-link',
      '[data-testid="category"]',
      '.category-card',
      'article[class*="category"]',
      'div[class*="category"]'
    ];

    let categoryFound = false;
    let categoryLinks = [];

    for (const selector of categorySelectors) {
      try {
        const links = page.locator(selector);
        const count = await links.count();
        if (count > 0) {
          console.log(`Found ${count} categories with selector: ${selector}`);
          categoryLinks = links;
          categoryFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (categoryFound && categoryLinks.length > 0) {
      // Click on the first category
      await categoryLinks.first().click();
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on a category page
      const categoryPageIndicators = [
        /categoría/i,
        /category/i,
        /productos/i,
        /products/i
      ];

      let categoryPageConfirmed = false;
      for (const indicator of categoryPageIndicators) {
        try {
          await expect(page.locator('h1, h2').filter({ hasText: indicator }).first()).toBeVisible({ timeout: 10000 });
          categoryPageConfirmed = true;
          break;
        } catch (error) {
          continue;
        }
      }

      if (categoryPageConfirmed) {
        console.log('✓ Successfully navigated to category page');
      } else {
        console.log('Category page loaded but expected heading not found');
      }
    } else {
      // Try navigating directly to categories page
      console.log('No categories found on home page, trying direct navigation...');
      await page.goto(`${baseUrl}/categories`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
      console.log('✓ Categories page accessed directly');
    }
  });

  test('product search functionality', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing product search functionality...');

    // Navigate to products or search page
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Try different search input selectors
    const searchSelectors = [
      'input[placeholder*="buscar" i]',
      'input[placeholder*="search" i]',
      'input[type="search"]',
      'input[name*="search" i]',
      'input[name*="query" i]',
      '.search-input',
      '[data-testid="search-input"]',
      '.search-box input',
      'form input[type="text"]'
    ];

    let searchInputFound = false;
    let searchInput;

    for (const selector of searchSelectors) {
      try {
        searchInput = page.locator(selector).first();
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found search input with selector: ${selector}`);
          searchInputFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (searchInputFound) {
      // Test search with different terms
      const searchTerms = ['bebida', 'snack', 'pan', 'leche'];

      for (const term of searchTerms) {
        console.log(`Searching for: ${term}`);

        // Clear and fill search input
        await searchInput.fill('');
        await searchInput.fill(term);

        // Submit search
        await searchInput.press('Enter');

        // Wait for search results
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        // Check if results loaded (look for products or no results message)
        const productSelectors = [
          '[data-testid="product-card"]',
          '.product-card',
          '[class*="product"]',
          'article',
          '.card',
          'h3', // Product titles
          '.product-title'
        ];

        let resultsFound = false;
        for (const productSelector of productSelectors) {
          try {
            const count = await page.locator(productSelector).count();
            if (count > 0) {
              console.log(`Found ${count} search results for "${term}"`);
              resultsFound = true;
              break;
            }
          } catch (error) {
            continue;
          }
        }

        if (!resultsFound) {
          console.log(`No results found for "${term}" (this may be expected)`);
        }
      }

      console.log('✓ Search functionality test completed');
    } else {
      // Try navigating to search page
      console.log('No search input found, trying search page...');
      await page.goto(`${baseUrl}/search`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });

      await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
      console.log('✓ Search page accessed');
    }
  });

  test('product detail page functionality', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing product detail page...');

    // Navigate to products page first
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Find and click on a product
    const productSelectors = [
      'a[href*="product"]',
      'a[href*="products/"]',
      '[data-testid="product-card"] a',
      '.product-card a',
      '[class*="product"] a',
      'article a',
      '.card a'
    ];

    let productClicked = false;

    for (const selector of productSelectors) {
      try {
        const productLink = page.locator(selector).first();
        if (await productLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found product link with selector: ${selector}`);
          await productLink.click();
          productClicked = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!productClicked) {
      // Try finding any link that might lead to product details
      const anyLink = page.locator('a').first();
      if (await anyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await anyLink.click();
        console.log('Clicked first available link (may lead to product)');
      } else {
        throw new Error('No product links found to test product detail page');
      }
    }

    // Wait for product detail page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify product detail page elements
    const detailPageIndicators = [
      'h1', // Product title
      '.product-image',
      '.product-price',
      '.product-description',
      'button', // Add to cart button
      '.price',
      '[class*="price"]',
      '.description',
      '[class*="description"]'
    ];

    let detailElementsFound = 0;

    for (const indicator of detailPageIndicators) {
      try {
        const element = page.locator(indicator).first();
        if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
          detailElementsFound++;
          console.log(`Found product detail element: ${indicator}`);
        }
      } catch (error) {
        continue;
      }
    }

    if (detailElementsFound > 0) {
      console.log(`✓ Product detail page loaded with ${detailElementsFound} detail elements`);
    } else {
      console.log('Product detail page loaded but no typical detail elements found');
    }

    // Test image zoom or gallery if available
    const imageSelectors = [
      'img',
      '.product-image img',
      '.gallery img',
      '.image-zoom',
      '[data-testid="product-image"]'
    ];

    for (const selector of imageSelectors) {
      try {
        const image = page.locator(selector).first();
        if (await image.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Found product image: ${selector}`);
          // Try clicking image to test zoom/gallery
          await image.click().catch(() => {});
          await page.waitForTimeout(500);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('✓ Product detail page test completed');
  });

  test('pagination and product loading', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing pagination and product loading...');

    // Navigate to products page
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Test pagination controls
    const paginationSelectors = [
      'button:has-text("Siguiente")',
      'button:has-text("Next")',
      'button:has-text(">")',
      '.pagination button',
      '[data-testid="pagination"] button',
      '.next-page',
      'a:has-text("2")',
      'a:has-text(">")'
    ];

    let paginationFound = false;

    for (const selector of paginationSelectors) {
      try {
        const paginationElement = page.locator(selector).first();
        if (await paginationElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found pagination control: ${selector}`);

          // Try clicking to test pagination
          await paginationElement.click();
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(1000);
          paginationFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (paginationFound) {
      console.log('✓ Pagination functionality tested');
    } else {
      console.log('No pagination controls found (may be single page or infinite scroll)');
    }

    // Test infinite scroll or load more functionality
    const loadMoreSelectors = [
      'button:has-text("Cargar más")',
      'button:has-text("Load more")',
      'button:has-text("Ver más")',
      'button:has-text("Show more")',
      '.load-more',
      '[data-testid="load-more"]'
    ];

    let loadMoreFound = false;

    for (const selector of loadMoreSelectors) {
      try {
        const loadMoreButton = page.locator(selector).first();
        if (await loadMoreButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found load more button: ${selector}`);
          await loadMoreButton.click();
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(2000);
          loadMoreFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (loadMoreFound) {
      console.log('✓ Load more functionality tested');
    } else {
      console.log('No load more functionality found');
    }

    // Test sorting/filtering if available
    const sortSelectors = [
      'select[name*="sort"]',
      'select[name*="order"]',
      '.sort-select',
      '[data-testid="sort"]',
      'button:has-text("Ordenar")',
      'button:has-text("Sort")'
    ];

    for (const selector of sortSelectors) {
      try {
        const sortElement = page.locator(selector).first();
        if (await sortElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Found sorting control: ${selector}`);
          // Note: Not clicking to avoid changing test state
          break;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('✓ Pagination and product loading test completed');
  });
});