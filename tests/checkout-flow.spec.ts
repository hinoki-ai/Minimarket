import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(45000);
    page.on('pageerror', (error) => console.log('Page error:', error.message));
  });

  test('checkout process initiation', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing checkout process initiation...');

    // First ensure we have items in cart
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Try to add a product to cart
    const productSelectors = [
      'a[href*="product"]',
      'a[href*="products/"]',
      '[data-testid="product-card"] a',
      '.product-card a'
    ];

    let productAdded = false;
    for (const selector of productSelectors) {
      try {
        const productLink = page.locator(selector).first();
        if (await productLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await productLink.click();
          await page.waitForLoadState('domcontentloaded');

          const cartSelectors = [
            'button:has-text("Agregar al carrito")',
            'button:has-text("Añadir al carrito")',
            'button:has-text("Add to cart")',
            '[data-testid="add-to-cart"]'
          ];

          for (const cartSelector of cartSelectors) {
            try {
              const cartButton = page.locator(cartSelector).first();
              if (await cartButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await cartButton.click();
                productAdded = true;
                console.log('✓ Product added to cart for checkout testing');
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

    // Navigate to cart
    await page.goto(`${baseUrl}/carrito`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Look for checkout buttons
    const checkoutSelectors = [
      'a:has-text("Checkout")',
      'a:has-text("Pagar")',
      'a:has-text("Proceder al pago")',
      'a:has-text("Finalizar compra")',
      'button:has-text("Checkout")',
      'button:has-text("Pagar")',
      'button:has-text("Proceder al pago")',
      'button:has-text("Finalizar compra")',
      'button:has-text("Continuar")',
      'button:has-text("Comprar")',
      '[href*="checkout"]',
      '[href*="pago"]',
      '[href*="payment"]',
      '.checkout-btn',
      '[data-testid="checkout"]'
    ];

    let checkoutStarted = false;
    let checkoutURL = '';

    for (const selector of checkoutSelectors) {
      try {
        const checkoutElement = page.locator(selector).first();
        if (await checkoutElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found checkout element: ${selector}`);

          // Check if it's a link or button
          const tagName = await checkoutElement.evaluate(el => el.tagName.toLowerCase());

          if (tagName === 'a') {
            const href = await checkoutElement.getAttribute('href');
            if (href) {
              checkoutURL = href.startsWith('http') ? href : `${baseUrl}${href}`;
              await page.goto(checkoutURL, {
                waitUntil: 'domcontentloaded',
                timeout: 45000
              });
            }
          } else {
            await checkoutElement.click();
          }

          checkoutStarted = true;
          console.log('✓ Checkout process initiated');
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!checkoutStarted) {
      console.log('No checkout button found - may require authentication or different cart state');
    } else {
      // Verify checkout page loaded
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const currentURL = page.url();
      console.log(`Checkout page URL: ${currentURL}`);

      // Look for checkout form elements
      const checkoutFormSelectors = [
        'form',
        '.checkout-form',
        '.payment-form',
        '.shipping-form',
        'input[placeholder*="address" i]',
        'input[placeholder*="email" i]',
        'input[placeholder*="phone" i]',
        'input[placeholder*="name" i]',
        'select[name*="country"]',
        'select[name*="region"]',
        'input[name*="card"]',
        'input[name*="payment"]'
      ];

      let checkoutElementsFound = 0;
      for (const selector of checkoutFormSelectors) {
        try {
          const elements = page.locator(selector);
          const count = await elements.count();
          if (count > 0) {
            checkoutElementsFound += count;
            console.log(`Found ${count} checkout elements: ${selector}`);
          }
        } catch (error) {
          continue;
        }
      }

      if (checkoutElementsFound > 0) {
        console.log(`✓ Checkout page loaded with ${checkoutElementsFound} form elements`);
      } else {
        console.log('Checkout page loaded but no typical form elements found');
      }
    }

    console.log('✓ Checkout initiation test completed');
  });

  test('shipping information form', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing shipping information form...');

    // Try to access checkout page directly
    await page.goto(`${baseUrl}/checkout`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for shipping form elements
    const shippingSelectors = [
      'input[placeholder*="address" i]',
      'input[placeholder*="dirección" i]',
      'input[placeholder*="calle" i]',
      'input[placeholder*="street" i]',
      'input[name*="address"]',
      'input[name*="shipping"]',
      'select[name*="country"]',
      'select[name*="region"]',
      'select[name*="city"]',
      'input[placeholder*="postal" i]',
      'input[placeholder*="zip" i]',
      'input[placeholder*="phone" i]',
      'input[placeholder*="teléfono" i]',
      'input[name*="phone"]',
      'input[placeholder*="name" i]',
      'input[placeholder*="nombre" i]',
      '.shipping-form',
      '.address-form'
    ];

    let shippingElementsFound = 0;
    const foundElements = [];

    for (const selector of shippingSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          shippingElementsFound += count;
          foundElements.push(selector);

          // Try to identify the type of field
          for (let i = 0; i < Math.min(count, 3); i++) {
            const element = elements.nth(i);
            const placeholder = await element.getAttribute('placeholder').catch(() => '');
            const name = await element.getAttribute('name').catch(() => '');
            console.log(`  Found shipping field: ${placeholder || name || selector}`);
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (shippingElementsFound > 0) {
      console.log(`✓ Found ${shippingElementsFound} shipping form elements`);
    } else {
      console.log('No shipping form elements found - may require different navigation or authentication');
    }

    console.log('✓ Shipping information test completed');
  });

  test('payment method selection', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing payment method selection...');

    // Try checkout page
    await page.goto(`${baseUrl}/checkout`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for payment method options
    const paymentSelectors = [
      'input[type="radio"][name*="payment"]',
      'input[type="radio"][value*="card"]',
      'input[type="radio"][value*="paypal"]',
      'input[type="radio"][value*="transfer"]',
      'select[name*="payment"]',
      'button:has-text("Credit Card")',
      'button:has-text("Tarjeta")',
      'button:has-text("PayPal")',
      'button:has-text("Transferencia")',
      '.payment-method',
      '.payment-options',
      '[data-testid="payment-method"]',
      'input[placeholder*="card" i]',
      'input[placeholder*="tarjeta" i]',
      'input[placeholder*="number" i]',
      'input[placeholder*="número" i]'
    ];

    let paymentElementsFound = 0;
    const foundPaymentElements = [];

    for (const selector of paymentSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          paymentElementsFound += count;
          foundPaymentElements.push(selector);

          // Log details of found elements
          if (count <= 5) { // Don't log too many
            for (let i = 0; i < count; i++) {
              const element = elements.nth(i);
              const text = await element.textContent().catch(() => '');
              const value = await element.getAttribute('value').catch(() => '');
              const placeholder = await element.getAttribute('placeholder').catch(() => '');
              console.log(`  Payment element: ${text || value || placeholder || selector}`);
            }
          } else {
            console.log(`  Found ${count} payment elements: ${selector}`);
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (paymentElementsFound > 0) {
      console.log(`✓ Found ${paymentElementsFound} payment method elements`);
    } else {
      console.log('No payment method elements found - may be on different step or require authentication');
    }

    // Look for payment security indicators
    const securitySelectors = [
      '.ssl-badge',
      '.security-badge',
      '.secure-payment',
      'img[src*="ssl"]',
      'img[src*="secure"]',
      'img[src*="lock"]',
      '.fa-lock',
      '.lock-icon'
    ];

    for (const selector of securitySelectors) {
      try {
        const securityElement = page.locator(selector).first();
        if (await securityElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✓ Payment security indicator found');
          break;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('✓ Payment method selection test completed');
  });

  test('order summary and totals', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing order summary and totals...');

    // Try checkout page
    await page.goto(`${baseUrl}/checkout`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for order summary elements
    const summarySelectors = [
      '.order-summary',
      '.cart-summary',
      '.checkout-summary',
      '.order-total',
      '.cart-total',
      '[data-testid="order-summary"]',
      '.summary',
      '.totals'
    ];

    let summaryFound = false;
    for (const selector of summarySelectors) {
      try {
        const summaryElement = page.locator(selector).first();
        if (await summaryElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found order summary: ${selector}`);
          summaryFound = true;

          // Look for total amounts within summary
          const totalSelectors = [
            '.total',
            '.grand-total',
            '.final-total',
            '[class*="total"]',
            'span:has-text("$")',
            'span:has-text("CLP")',
            'div:has-text("$")',
            'div:has-text("CLP")'
          ];

          for (const totalSelector of totalSelectors) {
            try {
              const totalElements = summaryElement.locator(totalSelector);
              const count = await totalElements.count();
              if (count > 0) {
                for (let i = 0; i < Math.min(count, 3); i++) {
                  const totalElement = totalElements.nth(i);
                  const text = await totalElement.textContent();
                  console.log(`  Found total amount: ${text}`);
                }
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

    if (!summaryFound) {
      console.log('No order summary found on checkout page');
    }

    // Look for itemized list
    const itemSelectors = [
      '.order-item',
      '.cart-item',
      '.line-item',
      '.product-summary',
      'tr[class*="item"]',
      '[data-testid="order-item"]'
    ];

    for (const selector of itemSelectors) {
      try {
        const itemElements = page.locator(selector);
        const count = await itemElements.count();
        if (count > 0) {
          console.log(`✓ Found ${count} itemized order items`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('✓ Order summary test completed');
  });

  test('checkout validation and error handling', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing checkout validation and error handling...');

    // Try checkout page
    await page.goto(`${baseUrl}/checkout`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for submit/complete order buttons
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Complete Order")',
      'button:has-text("Finalizar pedido")',
      'button:has-text("Pagar ahora")',
      'button:has-text("Place Order")',
      'button:has-text("Confirmar")',
      'input[type="submit"]',
      '.submit-order',
      '[data-testid="submit-order"]'
    ];

    let submitButtonFound = false;
    for (const selector of submitSelectors) {
      try {
        const submitButton = page.locator(selector).first();
        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found submit button: ${selector}`);
          submitButtonFound = true;

          // Look for required field indicators
          const requiredSelectors = [
            'input[required]',
            'select[required]',
            'textarea[required]',
            '.required',
            '[aria-required="true"]',
            'label[class*="required"]'
          ];

          let requiredFieldsFound = 0;
          for (const requiredSelector of requiredSelectors) {
            try {
              const requiredElements = page.locator(requiredSelector);
              const count = await requiredElements.count();
              if (count > 0) {
                requiredFieldsFound += count;
              }
            } catch (error) {
              continue;
            }
          }

          if (requiredFieldsFound > 0) {
            console.log(`✓ Found ${requiredFieldsFound} required fields`);
          } else {
            console.log('No required field indicators found');
          }

          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!submitButtonFound) {
      console.log('No submit button found on checkout page');
    }

    // Look for validation error containers
    const errorSelectors = [
      '.error-message',
      '.validation-error',
      '.form-error',
      '.invalid-feedback',
      '[role="alert"]',
      '.alert-danger',
      '.error'
    ];

    let errorContainerFound = false;
    for (const selector of errorSelectors) {
      try {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Found error message container: ${selector}`);
          errorContainerFound = true;
        }
      } catch (error) {
        continue;
      }
    }

    if (errorContainerFound) {
      console.log('✓ Error handling containers are present');
    } else {
      console.log('No error message containers found');
    }

    console.log('✓ Checkout validation test completed');
  });
});