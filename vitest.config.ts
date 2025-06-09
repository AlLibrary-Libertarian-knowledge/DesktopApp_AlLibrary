import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Use jsdom for browser APIs
    setupFiles: ['./src/test-setup.ts'], // Setup file for mocks
    globals: true, // Enable global test functions
    css: true, // Process CSS files
  },
  define: {
    global: 'globalThis',
  },
});
