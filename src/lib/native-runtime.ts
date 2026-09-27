import { useSyncExternalStore } from 'react';

export const PICO_NATIVE_USER_AGENT_MARKER = 'PicoNativeApp/';

export function isPicoNativePackage(userAgent: string | null | undefined) {
  return Boolean(userAgent?.includes(PICO_NATIVE_USER_AGENT_MARKER));
}

const subscribe = () => () => {};
const browserSnapshot = () => isPicoNativePackage(navigator.userAgent);
const serverSnapshot = () => false;

export function usePicoNativePackage() {
  return useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
}
