import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve } from 'path';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [solid()],

  // Path aliases for clean imports
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
    },
  },

  // Production optimizations
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log'], // Remove specific functions
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // OPTIMIZATION: Enhanced chunk grouping for better caching
          // Core vendor libraries (rarely change)
          'vendor-core': ['solid-js'],
          'vendor-ui': ['@solidjs/router', 'lucide-solid'],
          'vendor-tauri': ['@tauri-apps/api', '@tauri-apps/plugin-opener'],

          // UI components (frequently used, group together)
          'ui-components': [
            './src/components/foundation/Button/Button.tsx',
            './src/components/foundation/Loading/Loading.tsx',
            './src/components/layout/Header.tsx',
            './src/components/layout/Sidebar.tsx',
          ],

          // Performance-critical network components (separate for caching)
          'network-graph': [
            './src/components/composite/NetworkGraph/NetworkGraph.tsx',
            './src/utils/performance.ts',
          ],

          // Page components (lazy-loaded, separate chunks)
          'pages-main': ['./src/pages/Home/Home.tsx', './src/pages/Collections/Collections.tsx'],
          'pages-secondary': [
            './src/pages/DocumentManagement/DocumentManagement.tsx',
            './src/pages/Browse/Browse.tsx',
            './src/pages/Trending/Trending.tsx',
          ],
          'pages-network': [
            './src/pages/Peers/Peers.tsx',
            './src/pages/Favorites/Favorites.tsx',
            './src/pages/Recent/Recent.tsx',
          ],
        },
      },
    },
    // Enable compression
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // Ensure we're using client-side rendering for tests
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
}));
