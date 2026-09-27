declare global {
  interface Window {
    __PICO_MOBILE_CONFIG__?: {
      apiOrigin?: string;
      clientVersion?: string;
    };
  }
}

const configuredOrigin = window.__PICO_MOBILE_CONFIG__?.apiOrigin?.trim();

export const mobileConfig = Object.freeze({
  apiOrigin: (configuredOrigin || 'https://pico-app-sepia.vercel.app').replace(/\/$/, ''),
  clientVersion: window.__PICO_MOBILE_CONFIG__?.clientVersion?.trim() || '1.0.0',
});

export const legalUrls = Object.freeze({
  privacy: `${mobileConfig.apiOrigin}/privacidade`,
  terms: `${mobileConfig.apiOrigin}/termos`,
  guidelines: `${mobileConfig.apiOrigin}/diretrizes`,
  support: `${mobileConfig.apiOrigin}/suporte`,
});
