// sw.js — základní service worker pro PWA + notifikace
// --- 🟢 CACHE (offline režim pro Batolesvět) ---
const CACHE_NAME = 'batolesvet-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './badges.js',
  './data/members.json'
];

// uloží soubory do cache při instalaci
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// obsluha načítání (offline fallback)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// lokální notifikace (funguje i bez push)
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'Batolesvět', body: 'Zpráva' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './icon-192.png',
      vibrate: [60, 30, 60],
      data: data.data || {}
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});