import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Optional: warm up the site before running tests
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`Warming up site: ${baseURL}`);
    
    // Visit the home page to warm up the application
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for critical resources to load
    await page.waitForLoadState('domcontentloaded');
    
    console.log('Site warmup completed successfully');
  } catch (error) {
    console.log(`Site warmup failed (this is okay): ${error}`);
  } finally {
    await browser.close();
  }
}

export default globalSetup;