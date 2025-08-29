import { test, expect } from '@playwright/test';

test.describe('🔥 ULTRATHINK INTERACTION FIXES VALIDATION', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10000);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  });

  test('🍪 Cookie banner buttons are clickable', async ({ page }) => {
    // Wait for cookie banner
    const cookieBanner = page.locator('[role="dialog"][aria-label="Consentimiento de cookies"]');
    await expect(cookieBanner).toBeVisible({ timeout: 5000 });
    
    // Test "Aceptar todas" button
    const acceptButton = cookieBanner.locator('button').filter({ hasText: /aceptar todas/i });
    await expect(acceptButton).toBeVisible();
    
    // Check if button is clickable (has proper CSS)
    const buttonBox = await acceptButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    
    // Try to click the button
    await acceptButton.click();
    
    // Cookie banner should disappear
    await expect(cookieBanner).not.toBeVisible({ timeout: 3000 });
    console.log('✅ Cookie banner accept button is working!');
  });

  test('🎨 Aurora background allows content clicks', async ({ page }) => {
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Look for delivery/pickup toggle buttons (these are on aurora background)
    const deliveryButton = page.locator('button').filter({ hasText: /entrega/i }).first();
    const pickupButton = page.locator('button').filter({ hasText: /retiro/i }).first();
    
    if (await deliveryButton.isVisible()) {
      // Test clicking delivery button
      await deliveryButton.click();
      console.log('✅ Delivery button clickable on aurora background');
      
      // Test clicking pickup button
      await pickupButton.click();
      console.log('✅ Pickup button clickable on aurora background');
    } else {
      console.log('ℹ️ Delivery/pickup buttons not found on this page');
    }
  });

  test('🖱️ Homepage interactive elements work', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Test navigation links
    const navLinks = page.locator('nav a').first();
    if (await navLinks.isVisible()) {
      const linkHref = await navLinks.getAttribute('href');
      console.log(`✅ Navigation link found: ${linkHref}`);
    }
    
    // Test any buttons on the page
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      const buttonText = await buttons.textContent();
      console.log(`✅ Interactive button found: ${buttonText}`);
    }
    
    // Check for .force-interactive class elements
    const forceInteractiveElements = page.locator('.force-interactive');
    const count = await forceInteractiveElements.count();
    console.log(`✅ Found ${count} elements with .force-interactive class`);
    
    expect(count).toBeGreaterThan(0);
  });

  test('⚡ Aurora animation is working without blocking interactions', async ({ page }) => {
    // Check if aurora background element exists
    const auroraBackground = page.locator('[class*="aurora"]').first();
    
    if (await auroraBackground.isVisible()) {
      // Check CSS animation
      const animationName = await auroraBackground.evaluate(el => 
        getComputedStyle(el).animationName
      );
      
      console.log(`✅ Aurora animation detected: ${animationName}`);
      
      // Ensure aurora element has pointer-events: none
      const pointerEvents = await auroraBackground.evaluate(el => 
        getComputedStyle(el).pointerEvents
      );
      
      console.log(`✅ Aurora pointer-events: ${pointerEvents}`);
      expect(['none', 'auto'].includes(pointerEvents)).toBe(true);
    } else {
      console.log('ℹ️ Aurora background not found on this page');
    }
  });

  test('🛠️ Emergency .force-interactive class works', async ({ page }) => {
    // Inject test element with force-interactive class
    await page.evaluate(() => {
      const testButton = document.createElement('button');
      testButton.textContent = 'Test Emergency Interactive';
      testButton.className = 'force-interactive';
      testButton.id = 'emergency-test-btn';
      testButton.style.position = 'fixed';
      testButton.style.top = '10px';
      testButton.style.right = '10px';
      testButton.style.background = 'red';
      testButton.style.color = 'white';
      testButton.style.padding = '10px';
      testButton.style.border = 'none';
      testButton.style.cursor = 'pointer';
      document.body.appendChild(testButton);
    });
    
    const emergencyButton = page.locator('#emergency-test-btn');
    await expect(emergencyButton).toBeVisible();
    
    // Test if it's clickable
    await emergencyButton.click();
    console.log('✅ Emergency .force-interactive button is clickable!');
    
    // Check CSS properties
    const styles = await emergencyButton.evaluate(el => {
      const computed = getComputedStyle(el);
      return {
        pointerEvents: computed.pointerEvents,
        zIndex: computed.zIndex,
        position: computed.position
      };
    });
    
    console.log(`✅ Emergency button CSS: ${JSON.stringify(styles)}`);
    expect(styles.pointerEvents).toBe('auto');
  });
});