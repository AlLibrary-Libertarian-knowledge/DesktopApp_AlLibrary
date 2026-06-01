// Application Configuration
import { APP_NAME, APP_VERSION } from '@/config/appMeta';

export const appConfig = {
  name: APP_NAME,
  version: APP_VERSION,
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
