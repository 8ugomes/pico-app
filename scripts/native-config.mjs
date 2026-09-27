/** @typedef {import('@capacitor/cli').CapacitorConfig} CapacitorConfig */

export const NATIVE_PREVIEW_APP_ID = 'com.picosocial.preview';
export const NATIVE_PREVIEW_APP_NAME = 'Pico Social Preview';

/**
 * Build the Capacitor configuration without silently turning the hosted Pico
 * into a production WebView wrapper. A remote URL is an explicit preview-only
 * escape hatch and is removed again by the default sync.
 *
 * @param {Record<string, string | undefined>} environment
 * @returns {CapacitorConfig}
 */
export function createNativeConfig(environment = process.env) {
  /** @type {CapacitorConfig} */
  const config = {
    appId: NATIVE_PREVIEW_APP_ID,
    appName: NATIVE_PREVIEW_APP_NAME,
    webDir: 'native-shell',
    backgroundColor: '#F8F3E7',
    loggingBehavior: 'none',
    appendUserAgent: ' PicoNativeApp/1',
    ios: {
      allowsLinkPreview: false,
      backgroundColor: '#F8F3E7',
      contentInset: 'never',
    },
    android: {
      allowMixedContent: false,
      backgroundColor: '#F8F3E7',
      webContentsDebuggingEnabled: false,
    },
    plugins: {
      SplashScreen: {
        backgroundColor: '#F8F3E7',
        launchAutoHide: true,
        launchShowDuration: 800,
        showSpinner: false,
      },
      StatusBar: {
        backgroundColor: '#F8F3E7',
        overlaysWebView: false,
        style: 'LIGHT',
      },
    },
  };

  const previewUrl = environment.PICO_NATIVE_PREVIEW_URL?.trim();
  const previewEnabled = environment.PICO_NATIVE_PREVIEW === '1';

  if (!previewUrl && !previewEnabled) return config;
  if (!previewEnabled) {
    throw new Error('Defina PICO_NATIVE_PREVIEW=1 para usar uma URL de preview.');
  }
  if (!previewUrl) {
    throw new Error('PICO_NATIVE_PREVIEW_URL é obrigatória no preview hospedado.');
  }

  let parsed;
  try {
    parsed = new URL(previewUrl);
  } catch {
    throw new Error('URL de preview inválida.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('A URL de preview precisa usar HTTPS.');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('A URL de preview não pode conter credenciais, consulta ou fragmento.');
  }

  config.server = {
    url: `${parsed.origin}${parsed.pathname === '/' ? '/feed' : parsed.pathname}`,
    cleartext: false,
    errorPath: 'native-error.html',
  };
  config.loggingBehavior = 'debug';
  return config;
}
