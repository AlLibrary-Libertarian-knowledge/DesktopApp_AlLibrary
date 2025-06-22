import { defineConfig, devices } from '@playwright/test';

/**
 * Windows-Only Playwright Configuration
 *
 * This config is optimized for Windows development and CI/CD:
 * - Only tests Chromium (matches Tauri's WebView2 on Windows)
 * - Simplified setup for faster local development
 * - More reliable than cross-platform testing
 *
 * Use this for:
 * - Local Windows development
 * - Windows CI/CD pipelines
 * - When WebKit stability is an issue
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: [['html', { open: 'never' }], ['list']],

  timeout: 30000, // Reduced timeout for faster feedback
  expect: {
    timeout: 10000,
  },

  use: {
    baseURL: 'http://localhost:1420',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Optimized settings for Tauri WebView2 testing
        viewport: { width: 1280, height: 720 },
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },
  ],

  webServer: {
    command: 'yarn tauri dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
