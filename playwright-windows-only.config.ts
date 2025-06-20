import { defineConfig, devices } from '@playwright/test';

/**
 * Windows-focused E2E configuration for Tauri v2
 * Only tests Chromium since Windows WebView2 is Chromium-based
 * Use this for fast development testing
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  /* Configure Tauri dev server */
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Windows-only testing: Chromium matches WebView2 */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Windows WebView2 testing (Chromium-based)
      },
    },
  ],
});
