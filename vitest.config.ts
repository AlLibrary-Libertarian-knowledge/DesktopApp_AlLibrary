/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
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
    // Reduce Tinypool/worker instability on Windows (ERR_IPC_CHANNEL_CLOSED / V8 invalid size)
    pool: 'forks',
    maxThreads: 1,
    minThreads: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      reportsDirectory: 'coverage/unit',
      lines: 0.8,
      functions: 0.8,
      branches: 0.8,
      statements: 0.8,
      exclude: [
        '**/tests/**',
        '**/src-tauri/**',
        '**/dist/**',
        '**/*.config.*',
        '**/scripts/**',
        '**/playwright*.**',
        '**/@vite/**',
      ],
    },
    // Exclude e2e tests from Vitest (they use Playwright)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/tests/e2e/**', // Exclude all e2e tests
    ],
  },
  define: {
    global: 'globalThis',
  },
});
