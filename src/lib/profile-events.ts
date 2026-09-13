export function notifyProfileChanged() {
  window.dispatchEvent(new Event('pico:profile-saved'));
  // Invalidation only: no identity, image or draft is stored or broadcast.
  try {
    const channel = new BroadcastChannel('pico:profile');
    channel.postMessage('refresh');
    channel.close();
  } catch { /* This tab still updates when cross-tab messaging is unavailable. */ }
}
