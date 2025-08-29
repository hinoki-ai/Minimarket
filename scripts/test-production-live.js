const { chromium } = require('playwright');

(async () => {
  console.log('🔍 TESTING LIVE PRODUCTION SITE...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Compare local vs production
    const localUrl = 'http://localhost:3001';
    
    console.log('🔧 TESTING LOCAL DEV SERVER FIRST...');
    console.log(`🎯 URL: ${localUrl}`);
    
    try {
      await page.goto(localUrl, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('✅ Local dev server loaded successfully');
    } catch (e) {
      console.log('❌ Local dev server failed:', e.message);
      console.log('📡 Skipping to production...');
      await page.goto('https://minimarket.aramac.dev', { waitUntil: 'networkidle', timeout: 30000 });
      console.log('✅ Production domain loaded successfully');
    }
    console.log('✅ Page loaded successfully\n');
    
    // Check if force-interactive class exists
    console.log('🎯 CHECKING FOR INTERACTION FIXES:');
    
    const forceInteractiveElements = await page.locator('.force-interactive').count();
    console.log(`   - force-interactive elements: ${forceInteractiveElements}`);
    
    // Check CSS for ULTRATHINK fixes
    const cssContent = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      let allCSS = '';
      for (let sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          for (let rule of rules) {
            allCSS += rule.cssText + '\n';
          }
        } catch (e) {
          // Ignore cross-origin stylesheets
        }
      }
      return allCSS;
    });
    
    const hasUltrathinkFixes = cssContent.includes('ULTRATHINK COMPREHENSIVE INTERACTION FIXES');
    console.log(`   - ULTRATHINK fixes in CSS: ${hasUltrathinkFixes}`);
    
    const hasForceInteractiveCSS = cssContent.includes('.force-interactive');
    console.log(`   - .force-interactive CSS rule: ${hasForceInteractiveCSS}`);
    
    // Check cookie banner buttons
    console.log('\n🍪 COOKIE BANNER TESTS:');
    
    const cookieButtons = await page.locator('button').all();
    let cookieButtonsWithClass = 0;
    
    for (let button of cookieButtons) {
      const text = await button.textContent();
      if (text && (text.includes('Aceptar') || text.includes('Rechazar') || text.includes('Administrar'))) {
        const hasClass = await button.evaluate(el => el.classList.contains('force-interactive'));
        if (hasClass) cookieButtonsWithClass++;
        console.log(`   - "${text}": force-interactive=${hasClass}`);
      }
    }
    
    // Test actual clicking
    console.log('\n🖱️ CLICK TESTS:');
    
    try {
      const acceptButton = page.locator('button:has-text("Aceptar todas")').first();
      const isVisible = await acceptButton.isVisible({ timeout: 5000 });
      
      if (isVisible) {
        const isClickable = await acceptButton.isEnabled();
        console.log(`   - "Aceptar todas" button: visible=${isVisible}, clickable=${isClickable}`);
        
        // Try clicking
        try {
          await acceptButton.click({ timeout: 3000 });
          console.log(`   - Click attempt: SUCCESS`);
        } catch (e) {
          console.log(`   - Click attempt: FAILED - ${e.message}`);
        }
      } else {
        console.log(`   - "Aceptar todas" button: NOT VISIBLE`);
      }
    } catch (e) {
      console.log(`   - Cookie button test failed: ${e.message}`);
    }
    
    // Aurora background test
    console.log('\n🎨 AURORA BACKGROUND TESTS:');

    const auroraElements = await page.locator('[class*="aurora"]').count();
    console.log(`   - Aurora elements found: ${auroraElements}`);

    if (auroraElements > 0) {
      const auroraData = await page.evaluate(() => {
        const auroraEl = document.querySelector('[class*="aurora"]');
        if (auroraEl) {
          const style = window.getComputedStyle(auroraEl);
          return {
            pointerEvents: style.pointerEvents,
            zIndex: style.zIndex,
            position: style.position
          };
        }
        return null;
      });
      console.log(`   - Aurora pointer-events: ${auroraData?.pointerEvents}`);
      console.log(`   - Aurora z-index: ${auroraData?.zIndex}`);
      console.log(`   - Aurora position: ${auroraData?.position}`);
    }

    // Test cookie banner vs aurora z-index comparison
    console.log('\n🔝 Z-INDEX COMPARISON TEST:');
    const zIndexTest = await page.evaluate(() => {
      const cookieBanner = document.querySelector('[role="dialog"][aria-label="Consentimiento de cookies"]');
      const aurora = document.querySelector('[class*="aurora"]');

      if (cookieBanner && aurora) {
        const cookieZ = parseInt(window.getComputedStyle(cookieBanner).zIndex) || 0;
        const auroraZ = parseInt(window.getComputedStyle(aurora).zIndex) || 0;
        return { cookieZ, auroraZ, cookieWins: cookieZ > auroraZ };
      }
      return { cookieZ: 'not found', auroraZ: 'not found', cookieWins: false };
    });

    console.log(`   - Cookie banner z-index: ${zIndexTest.cookieZ}`);
    console.log(`   - Aurora z-index: ${zIndexTest.auroraZ}`);
    console.log(`   - Cookie banner on top: ${zIndexTest.cookieWins ? '✅ YES' : '❌ NO'}`);

    // Test specific cookie banner button z-index
    const buttonTest = await page.evaluate(() => {
      const buttons = document.querySelectorAll('[role="dialog"][aria-label="Consentimiento de cookies"] button');
      const results = [];

      buttons.forEach((btn, index) => {
        const style = window.getComputedStyle(btn);
        results.push({
          index: index + 1,
          zIndex: style.zIndex,
          pointerEvents: style.pointerEvents,
          hasForceInteractive: btn.classList.contains('force-interactive'),
          hasCookieBannerBtn: btn.classList.contains('cookie-banner-btn')
        });
      });

      return results;
    });

    console.log('\n🔘 COOKIE BANNER BUTTON TESTS:');
    buttonTest.forEach(btn => {
      console.log(`   - Button ${btn.index}: z-index=${btn.zIndex}, pointer-events=${btn.pointerEvents}, force-interactive=${btn.hasForceInteractive}, cookie-banner-btn=${btn.hasCookieBannerBtn}`);
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`   - Force-interactive elements: ${forceInteractiveElements}`);
    console.log(`   - ULTRATHINK fixes present: ${hasUltrathinkFixes}`);
    console.log(`   - Cookie buttons with class: ${cookieButtonsWithClass}`);
    console.log(`   - Aurora elements: ${auroraElements}`);
    console.log(`   - Cookie banner on top of aurora: ${zIndexTest.cookieWins ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Cookie banner buttons working: ${buttonTest.length > 0 && buttonTest.every(btn => btn.pointerEvents === 'auto') ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();