import { registerPlugin } from '@capacitor/core';
import { App as CapacitorApp, type AppState, type URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

interface SecureSessionPlugin {
  saveRefreshToken(options: { refreshToken: string }): Promise<void>;
  readRefreshToken(): Promise<{ refreshToken: string | null }>;
  clearRefreshToken(): Promise<void>;
  releasePrivacyCover(): Promise<void>;
}

interface VideoPlayerPlugin {
  play(options: {
    apiOrigin: string;
    path: string;
    accessToken: string;
    clientVersion: string;
  }): Promise<void>;
}

export const PicoSecureSession = registerPlugin<SecureSessionPlugin>('PicoSecureSession');
export const PicoVideoPlayer = registerPlugin<VideoPlayerPlugin>('PicoVideoPlayer');

export async function readRefreshToken() {
  const result = await PicoSecureSession.readRefreshToken();
  return result.refreshToken || null;
}

export async function saveRefreshToken(refreshToken: string) {
  await PicoSecureSession.saveRefreshToken({ refreshToken });
}

export async function clearRefreshToken() {
  await PicoSecureSession.clearRefreshToken();
}

export async function releasePrivacyCover() {
  await PicoSecureSession.releasePrivacyCover().catch(() => undefined);
}

export async function playPrivateVideo(options: {
  apiOrigin: string;
  path: string;
  accessToken: string;
  clientVersion: string;
}) {
  await PicoVideoPlayer.play(options);
}

export async function choosePhoto(square: boolean) {
  const result = await Camera.getPhoto({
    allowEditing: square,
    correctOrientation: true,
    height: square ? 1200 : 1800,
    width: square ? 1200 : 1800,
    quality: 90,
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt,
  });
  if (!result.webPath) throw new Error('A foto não ficou disponível. Escolha outra imagem.');
  const response = await fetch(result.webPath);
  if (!response.ok) throw new Error('Não foi possível abrir essa foto.');
  return normalizePhoto(await response.blob(), square);
}

async function normalizePhoto(source: Blob, square: boolean): Promise<Blob> {
  const url = URL.createObjectURL(source);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Não foi possível ler essa foto.'));
      element.src = url;
    });
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const maxEdge = square ? 1024 : 1600;
    const cropWidth = square ? Math.min(sourceWidth, sourceHeight) : sourceWidth;
    const cropHeight = square ? cropWidth : sourceHeight;
    const scale = Math.min(1, maxEdge / Math.max(cropWidth, cropHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(cropWidth * scale));
    canvas.height = Math.max(1, Math.round(cropHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar essa foto.');
    context.drawImage(
      image,
      square ? (sourceWidth - cropWidth) / 2 : 0,
      square ? (sourceHeight - cropHeight) / 2 : 0,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const output = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.84));
    if (!output || output.size > 3 * 1024 * 1024) {
      throw new Error('A foto ficou grande demais. Escolha uma imagem menor.');
    }
    return output;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function sharePost(id: string, isPrivate: boolean, webOrigin: string) {
  await Share.share({
    dialogTitle: 'Compartilhar pelo Pico',
    title: 'Publicação no Pico Social',
    text: isPrivate
      ? 'Abra esta publicação privada no Pico Social. O acesso continua restrito aos participantes autorizados.'
      : 'Olha esta publicação no Pico Social.',
    url: `${webOrigin}/publicacoes/${encodeURIComponent(id)}`,
  });
}

export async function shareExport(data: unknown) {
  await Share.share({
    dialogTitle: 'Salvar meus dados',
    title: 'Meus dados do Pico Social',
    text: JSON.stringify(data, null, 2),
  });
}

export async function openExternal(url: string) {
  await Browser.open({ url, presentationStyle: 'popover' });
}

export async function successHaptic() {
  await Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
}

export async function selectionHaptic() {
  await Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
}

export async function prepareNativeChrome() {
  await Promise.allSettled([
    SplashScreen.hide({ fadeOutDuration: 180 }),
    StatusBar.setOverlaysWebView({ overlay: true }),
    StatusBar.setStyle({ style: Style.Light }),
  ]);
}

export async function setStatusBarContrast(lightBackground: boolean) {
  await StatusBar.setStyle({ style: lightBackground ? Style.Light : Style.Dark }).catch(() => undefined);
}

export function onAppStateChange(listener: (state: AppState) => void) {
  return CapacitorApp.addListener('appStateChange', listener);
}

export function onAppUrlOpen(listener: (event: URLOpenListenerEvent) => void) {
  return CapacitorApp.addListener('appUrlOpen', listener);
}

export function getLaunchUrl() {
  return CapacitorApp.getLaunchUrl();
}

export function getNetworkStatus() {
  return Network.getStatus();
}

export function onNetworkChange(listener: (status: ConnectionStatus) => void) {
  return Network.addListener('networkStatusChange', listener);
}

export async function bindKeyboardState() {
  const show = await Keyboard.addListener('keyboardWillShow', () => document.documentElement.classList.add('keyboard-open'));
  const hide = await Keyboard.addListener('keyboardWillHide', () => document.documentElement.classList.remove('keyboard-open'));
  return () => {
    void show.remove();
    void hide.remove();
  };
}
