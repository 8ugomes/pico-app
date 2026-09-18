/* global self */
// Push only: deliberately no fetch listener, CacheStorage, IndexedDB, tokens,
// background sync, or offline copies of private pages/media.
self.addEventListener('push', event => {
  let kind = 'community';
  try {
    const payload = event.data?.json();
    if (payload?.version === 1 && payload.kind === 'message') kind = 'message';
  } catch { /* A malformed push still receives a generic visible notification. */ }
  event.waitUntil(self.registration.showNotification('Pico Club', {
    body: kind === 'message' ? 'Você tem novas mensagens no Pico.' : 'Você tem novidades nas suas comunidades.',
    icon: '/icons/pico-club-192.png',
    tag: kind === 'message' ? 'pico-message' : 'pico-community',
    renotify: false,
    data: { path: kind === 'message' ? '/mensagens' : '/notificacoes' },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const path = event.notification.data?.path === '/mensagens' ? '/mensagens' : '/notificacoes';
  const target = new URL(path, self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => client.url === target);
    // Focus the inbox if already open. Opening another window avoids replacing
    // a page where the person may still be editing an unsaved post.
    if (existing) await existing.focus();
    else await self.clients.openWindow(target);
  })());
});
