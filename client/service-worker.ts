/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const RESOURCE_CACHE = 'resource-cache_2026-05';
const HOUR_CACHE = 'hour-cache';

const RESOURCE_URLS: readonly string[] = [
  '/',
  '/stylesheets/seasons.css',
  '/stylesheets/daily.css',
  '/stylesheets/bulma.min.css',
  '/js/home.js',
  '/js/hour.js',
  '/js/manifest.json',
  '/images/favicon.png',
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(RESOURCE_CACHE).then((cache) =>
      cache.addAll(RESOURCE_URLS).catch((e: unknown) => {
        console.warn('SW install partial cache failure', e);
      }),
    ),
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== RESOURCE_CACHE && k !== HOUR_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && new URL(request.url).origin === self.location.origin) {
          const clone = response.clone();
          void caches.open(HOUR_CACHE).then((c) => c.put(request, clone));
        }
        return response;
      }).catch(() => cached ?? new Response('offline', { status: 503 }));
    }),
  );
});

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
