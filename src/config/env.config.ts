// Environment Configuration
export const envConfig = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',

  // Tauri specific
  isTauri: typeof window !== 'undefined' && '__TAURI__' in window,

  // Feature flags
  enableLogging: import.meta.env.DEV,
  enableDebug: import.meta.env.DEV,
  enableTelemetry: false, // Privacy-first approach
};
