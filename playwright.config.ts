import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000, // Increased timeout for stability
  expect: { timeout: 15_000 }, // Increased expect timeout
  fullyParallel: true,
  retries: process.env.CI ? 3 : 1, // More retries for stability
  workers: process.env.CI ? 1 : undefined, // Reduced parallelism in CI for stability
  reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-CL',
    // Improved stability settings
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    // Better mobile emulation
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Wait for network requests to settle
    waitForURL: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific stability improvements
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'dom.ipc.processCount': 1,
          }
        }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit-specific settings for stability
      },
    },
  ],
  // Global setup for better test isolation
  globalSetup: require.resolve('./tests/global-setup.ts'),
});

