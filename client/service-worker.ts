/// <reference lib="webworker" />

/**
 * Push-only service worker. No caching: every fetch hits the network. We keep
 * an SW registration because the Push API requires one — install/activate
 * also opportunistically delete any leftover CacheStorage entries from older
 * deployments.
 */

declare const self: ServiceWorkerGlobalScope;

async function clearAllCaches(): Promise<void> {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    /* ignore */
  }
}

self.addEventListener('install', (event: ExtendableEvent) => {
  // Take over immediately so an old caching SW gets replaced.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      await clearAllCaches();
      await self.clients.claim();
    })(),
  );
});

// Intentionally no `fetch` handler — requests fall through to the network.

self.addEventListener('push', (event: PushEvent) => {
  const text = event.data?.text() ?? 'Call to Prayer';
  event.waitUntil(
    self.registration.showNotification('Call to Prayer', {
      body: text,
      icon: '/images/bell.png',
      badge: '/images/clockw.png',
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  event.waitUntil(self.clients.openWindow(`/hour/${event.notification.body.toLowerCase()}/${date}`));
});

export {};
