/** App identity — values injected from APP_VERSION / VITE_APP_NAME in `.env` via Vite. */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'AlLibrary';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0-dev';
export const APP_VERSION_LABEL = `v${APP_VERSION}`;
export const APP_FOOTER_VERSION = `${APP_NAME} ${APP_VERSION_LABEL}`;
