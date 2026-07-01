const CACHE_NAME = 'revia-master-pwa-v1';
const OFFLINE_URL = './index.html';
const PRECACHE_URLS = [
  './',
  './index.html',
  './revia-master.css',
  './revia-angel.js',
  './revia-dark.js',
  './revia-command.js',
  './revia-repo-hub.js',
  './manifest.json',
  './assets/angel-bg.jpg',
  './assets/dark-bg.jpg',
  './assets/angel-icon-192.png',
  './assets/dark-icon-192.png',
  './assets/angel-icon-512.png',
  './assets/dark-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => key !== CACHE_NAME)
      .map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isHtml = event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
