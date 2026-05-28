import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: './report', open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:8100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 390, height: 844 }, // iPhone 14 mobile viewport
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Pixel 5'], // Android device → uses Chromium, not WebKit
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 8100',
    url: 'http://localhost:8100',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
