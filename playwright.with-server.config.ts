import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    // Additional stability for server startup
    stdout: 'pipe',
    stderr: 'pipe',
  },
  // Override some settings for local dev server testing
  use: {
    ...baseConfig.use,
    // More forgiving timeouts when testing against local dev server
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
  },
};

