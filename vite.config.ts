import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [solid()],

  // Path aliases for clean imports
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@/components': new URL('./src/components', import.meta.url).pathname,
      '@/pages': new URL('./src/pages', import.meta.url).pathname,
      '@/stores': new URL('./src/stores', import.meta.url).pathname,
      '@/services': new URL('./src/services', import.meta.url).pathname,
      '@/utils': new URL('./src/utils', import.meta.url).pathname,
      '@/assets': new URL('./src/assets', import.meta.url).pathname,
      '@/styles': new URL('./src/styles', import.meta.url).pathname,
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
        manualChunks(id) {
          // Keep chunk grouping stable while using function form required by newer rolldown.
          if (id.includes('node_modules/solid-js')) return 'vendor-core';
          if (
            id.includes('node_modules/@solidjs/router') ||
            id.includes('node_modules/lucide-solid')
          ) {
            return 'vendor-ui';
          }
          if (
            id.includes('node_modules/@tauri-apps/api') ||
            id.includes('node_modules/@tauri-apps/plugin-opener')
          ) {
            return 'vendor-tauri';
          }

          if (
            id.includes('/src/components/foundation/Button/Button.tsx') ||
            id.includes('/src/components/foundation/Loading/Loading.tsx') ||
            id.includes('/src/components/layout/Header.tsx') ||
            id.includes('/src/components/layout/Sidebar.tsx')
          ) {
            return 'ui-components';
          }

          if (
            id.includes('/src/components/composite/NetworkGraph/NetworkGraph.tsx') ||
            id.includes('/src/utils/performance.ts')
          ) {
            return 'network-graph';
          }

          if (
            id.includes('/src/pages/Home/Home.tsx') ||
            id.includes('/src/pages/Collections/Collections.tsx')
          ) {
            return 'pages-main';
          }

          if (
            id.includes('/src/pages/DocumentManagement/DocumentManagement.tsx') ||
            id.includes('/src/pages/Browse/BrowsePage.tsx') ||
            id.includes('/src/pages/Trending/Trending.tsx')
          ) {
            return 'pages-secondary';
          }

          if (
            id.includes('/src/pages/Peers/Peers.tsx') ||
            id.includes('/src/pages/Favorites/Favorites.tsx') ||
            id.includes('/src/pages/Recent/Recent.tsx')
          ) {
            return 'pages-network';
          }
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
