export type InstallPlatform = 'ios' | 'android' | 'desktop';
export type InstallScene = 'menu' | 'share' | 'home-option' | 'web-app' | 'confirm' | 'home';
export type SafariLayout = 'compact' | 'classic';

export function installDevice(userAgent: string, touchPoints = 0) {
  const ios = /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
  const platform: InstallPlatform = ios ? 'ios' : /Android/.test(userAgent) ? 'android' : 'desktop';
  const internal = /FBAN|FBAV|Instagram|Line\/|Twitter|; wv\)/i.test(userAgent);
  const needsBrowser = internal || (ios && /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)) || (platform === 'android' && (!/Chrome\//.test(userAgent) || /SamsungBrowser|Firefox/.test(userAgent)));
  return { platform, needsBrowser };
}

export function installationScenes(platform: 'ios' | 'android', safari: SafariLayout): InstallScene[] {
  return platform === 'android' ? ['menu', 'home-option', 'web-app', 'confirm', 'home']
    : [...(safari === 'compact' ? ['menu' as const] : []), 'share', 'home-option', 'web-app', 'confirm', 'home'];
}

export function installationJourneyReady({ profileReady, welcomeSettled, tourStatus, finishing, editing }: {
  profileReady: boolean; welcomeSettled: boolean; tourStatus?: string; finishing: boolean; editing: boolean;
}) {
  return profileReady && welcomeSettled && ['complete', 'dismissed'].includes(tourStatus ?? '') && !finishing && !editing;
}

export const installInvitationKey = (identity: string) => `pico.install-invite.v1:${identity}`;
