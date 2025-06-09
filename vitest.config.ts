import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
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
