// Application Configuration Constants
import { APP_NAME, APP_VERSION } from '@/config/appMeta';

export const APP_CONFIG = {
  name: APP_NAME,
  version: APP_VERSION,
  description: 'Decentralized document library and P2P network',
  author: 'AlLibrary Team',
};

export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  COLLECTIONS: '/collections',
  FAVORITES: '/favorites',
  RECENT: '/recent',
  TRENDING: '/trending',
  BROWSE: '/browse',
  PEERS: '/peers',
};

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'allibrary-user-preferences',
  VISITED: 'allibrary-visited',
  THEME: 'allibrary-theme',
  LANGUAGE: 'allibrary-language',
};
