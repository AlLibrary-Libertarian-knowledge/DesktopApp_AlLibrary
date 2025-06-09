import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { resolve } from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [solid()],

  // Path aliases for clean imports
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/components": resolve(__dirname, "src/components"),
      "@/pages": resolve(__dirname, "src/pages"),
      "@/stores": resolve(__dirname, "src/stores"),
      "@/services": resolve(__dirname, "src/services"),
      "@/utils": resolve(__dirname, "src/utils"),
      "@/assets": resolve(__dirname, "src/assets"),
      "@/styles": resolve(__dirname, "src/styles"),
    },
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
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
