// API Configuration
export const apiConfig = {
  baseUrl: import.meta.env.DEV ? 'http://localhost:3000' : '',
  timeout: 10000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'X-Client': 'AlLibrary-Desktop',
  },
};
