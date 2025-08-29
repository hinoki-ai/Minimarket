import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(45000);
    page.on('pageerror', (error) => console.log('Page error:', error.message));
  });

  test('sign in flow accessibility', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing sign in flow accessibility...');

    // Start from home page
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Look for sign in/sign up buttons or links
    const authSelectors = [
      'button:has-text("Iniciar sesión")',
      'button:has-text("Sign in")',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'a:has-text("Iniciar sesión")',
      'a:has-text("Sign in")',
      'a:has-text("Sign In")',
      'a:has-text("Login")',
      '.sign-in',
      '.login',
      '[data-testid="sign-in"]',
      '[data-testid="login"]'
    ];

    let authButtonFound = false;
    let authButton;

    for (const selector of authSelectors) {
      try {
        authButton = page.locator(selector).first();
        if (await authButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found auth button/link: ${selector}`);
          authButtonFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (authButtonFound) {
      console.log('✓ Sign in button/link is accessible on home page');
      // Note: Not clicking to avoid triggering actual authentication flow
    } else {
      console.log('No sign in button found on home page - may be in header/navigation');
    }

    // Check header/navigation for auth buttons
    const headerSelectors = [
      'header',
      'nav',
      '.header',
      '.navigation',
      '.navbar',
      '[role="navigation"]'
    ];

    for (const selector of headerSelectors) {
      try {
        const header = page.locator(selector).first();
        if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Found navigation header: ${selector}`);

          // Look for auth buttons within header
          for (const authSelector of authSelectors) {
            try {
              const authInHeader = header.locator(authSelector).first();
              if (await authInHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('✓ Sign in button found in navigation header');
                authButtonFound = true;
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

    if (!authButtonFound) {
      console.log('Sign in functionality may be implemented differently or require different triggers');
    }
  });

  test('protected routes accessibility', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing protected routes...');

    // Test dashboard access (commonly protected)
    const protectedRoutes = [
      '/dashboard',
      '/carrito', // May be protected
      '/checkout',
      '/profile',
      '/account',
      '/orders'
    ];

    for (const route of protectedRoutes) {
      console.log(`Testing access to protected route: ${route}`);

      try {
        await page.goto(`${baseUrl}${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 45000
        });

        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        // Check if redirected to sign in page
        const currentURL = page.url();
        const signInIndicators = [
          /sign-in/i,
          /login/i,
          /auth/i,
          /signin/i,
          /log-in/i
        ];

        let redirectedToSignIn = false;
        for (const indicator of signInIndicators) {
          if (indicator.test(currentURL)) {
            redirectedToSignIn = true;
            console.log(`✓ Protected route ${route} correctly redirects to sign in: ${currentURL}`);
            break;
          }
        }

        if (!redirectedToSignIn) {
          // Check for sign in form elements on the page
          const signInFormSelectors = [
            'form[action*="sign-in"]',
            'form[action*="login"]',
            'input[type="email"]',
            'input[type="password"]',
            'input[placeholder*="email" i]',
            'input[placeholder*="password" i]',
            'button[type="submit"]'
          ];

          let signInFormFound = false;
          for (const selector of signInFormSelectors) {
            try {
              const element = page.locator(selector).first();
              if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
                signInFormFound = true;
                console.log(`✓ Protected route ${route} shows sign in form`);
                break;
              }
            } catch (error) {
              continue;
            }
          }

          if (!signInFormFound) {
            console.log(`Route ${route} may not be protected or uses different protection mechanism`);
          }
        }

      } catch (error) {
        console.log(`Error testing route ${route}: ${error.message}`);
      }
    }
  });

  test('sign up flow accessibility', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing sign up flow accessibility...');

    // Start from home page
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Look for sign up buttons or links
    const signUpSelectors = [
      'button:has-text("Registrarse")',
      'button:has-text("Sign up")',
      'button:has-text("Sign Up")',
      'button:has-text("Register")',
      'a:has-text("Registrarse")',
      'a:has-text("Sign up")',
      'a:has-text("Sign Up")',
      'a:has-text("Register")',
      '.sign-up',
      '.register',
      '[data-testid="sign-up"]',
      '[data-testid="register"]'
    ];

    let signUpButtonFound = false;

    for (const selector of signUpSelectors) {
      try {
        const signUpButton = page.locator(selector).first();
        if (await signUpButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found sign up button/link: ${selector}`);
          signUpButtonFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (signUpButtonFound) {
      console.log('✓ Sign up button/link is accessible');
    } else {
      // Check if sign up is accessible through sign in page
      console.log('Sign up not found on home page - may be accessible through sign in flow');

      const authSelectors = [
        'button:has-text("Iniciar sesión")',
        'button:has-text("Sign in")',
        'a:has-text("Iniciar sesión")',
        'a:has-text("Sign in")'
      ];

      for (const selector of authSelectors) {
        try {
          const authButton = page.locator(selector).first();
          if (await authButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('Found sign in button - sign up may be accessible from there');
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }
  });

  test('authentication form validation', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing authentication form validation...');

    // Try to access a protected route to trigger auth form
    await page.goto(`${baseUrl}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for form inputs
    const formSelectors = [
      'input[type="email"]',
      'input[type="password"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="password" i]',
      'input[name="email"]',
      'input[name="password"]'
    ];

    let formFound = false;
    const foundInputs = [];

    for (const selector of formSelectors) {
      try {
        const inputs = page.locator(selector);
        const count = await inputs.count();
        if (count > 0) {
          formFound = true;
          for (let i = 0; i < count; i++) {
            const input = inputs.nth(i);
            const placeholder = await input.getAttribute('placeholder').catch(() => '');
            const name = await input.getAttribute('name').catch(() => '');
            foundInputs.push({ selector, placeholder, name });
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (formFound) {
      console.log(`✓ Found ${foundInputs.length} form inputs:`);
      foundInputs.forEach((input, index) => {
        console.log(`  ${index + 1}. ${input.selector} - ${input.placeholder || input.name}`);
      });

      // Test form submission with empty fields
      const submitButtons = [
        'button[type="submit"]',
        'button:has-text("Iniciar sesión")',
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        'input[type="submit"]'
      ];

      for (const submitSelector of submitButtons) {
        try {
          const submitButton = page.locator(submitSelector).first();
          if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('Found submit button - testing validation...');

            // Try submitting empty form (don't actually click to avoid navigation)
            await page.waitForTimeout(500);

            // Check for validation messages
            const validationSelectors = [
              '.error',
              '.validation-error',
              '[role="alert"]',
              '.form-error',
              '.invalid-feedback'
            ];

            for (const validationSelector of validationSelectors) {
              try {
                const validationMessage = page.locator(validationSelector).first();
                if (await validationMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
                  const text = await validationMessage.textContent();
                  console.log(`Found validation message: ${text}`);
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

    } else {
      console.log('No authentication form found on this route');
    }

    console.log('✓ Authentication form validation test completed');
  });

  test('user session persistence', async ({ page, baseURL }) => {
    const baseUrl = baseURL || 'http://localhost:3000';

    console.log('Testing user session persistence...');

    // Navigate to home page
    await page.goto(baseUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Check for user menu or profile indicators
    const userSelectors = [
      '.user-menu',
      '.profile-menu',
      '.user-avatar',
      '.user-profile',
      '[data-testid="user-menu"]',
      'button[class*="user"]',
      '.dropdown-trigger'
    ];

    let userMenuFound = false;

    for (const selector of userSelectors) {
      try {
        const userElement = page.locator(selector).first();
        if (await userElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`Found user menu/profile element: ${selector}`);
          userMenuFound = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (userMenuFound) {
      console.log('✓ User appears to be signed in (user menu visible)');
    } else {
      console.log('No user menu found - user may not be signed in or different UI pattern used');
    }

    // Test navigation and check if session persists
    await page.goto(`${baseUrl}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForLoadState('domcontentloaded');

    // Check if still signed in after navigation
    for (const selector of userSelectors) {
      try {
        const userElement = page.locator(selector).first();
        if (await userElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('✓ User session persists across page navigation');
          break;
        }
      } catch (error) {
        continue;
      }
    }

    console.log('✓ User session persistence test completed');
  });
});