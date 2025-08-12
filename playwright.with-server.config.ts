import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  webServer: {
    command: 'pnpm dev',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
};

