import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';
import { resolve } from 'path';

export default defineConfig({
  plugins: [solid()],

  // Path aliases for clean imports (matching main vite.config.ts)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/pages': resolve(__dirname, 'src/pages'),
      '@/stores': resolve(__dirname, 'src/stores'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/assets': resolve(__dirname, 'src/assets'),
      '@/styles': resolve(__dirname, 'src/styles'),
      '@/types': resolve(__dirname, 'src/types'),
    },
  },

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
