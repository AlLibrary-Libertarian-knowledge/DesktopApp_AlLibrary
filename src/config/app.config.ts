// Application Configuration
export const appConfig = {
  name: 'AlLibrary',
  version: '1.0.0',
  environment: import.meta.env.DEV ? 'development' : 'production',
  features: {
    culturalInformation: true,
    p2pNetwork: true,
    torIntegration: true,
    offlineMode: true,
    antiCensorship: true,
  },
  ui: {
    theme: 'system', // 'light' | 'dark' | 'system'
    language: 'en',
    accessibility: {
      highContrast: false,
      largeText: false,
      screenReader: true,
    },
  },
};
