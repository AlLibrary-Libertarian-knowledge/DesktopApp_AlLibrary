// API and Network Constants
export const API_ENDPOINTS = {
  DOCUMENTS: '/api/documents',
  COLLECTIONS: '/api/collections',
  SEARCH: '/api/search',
  CULTURAL: '/api/cultural',
  SECURITY: '/api/security',
  NETWORK: '/api/network',
};

export const NETWORK_CONFIG = {
  P2P_PORT: 4001,
  HTTP_PORT: 3000,
  WEBSOCKET_PORT: 8080,
  MAX_PEERS: 100,
  CONNECTION_TIMEOUT: 30000,
};

export const API_TIMEOUTS = {
  DEFAULT: 10000,
  UPLOAD: 60000,
  DOWNLOAD: 120000,
  SEARCH: 5000,
};
