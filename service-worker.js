// service-worker.js
const CACHE_NAME = 'vaft-cache-v3';

// podle potřeby můžeš přidat další soubory
const OFFLINE_URLS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './AFA0870E-F586-4406-8BAA-0A7944120AA3.png'
];

self.addEventListener('install', event => {
  console.log('[VAFT SW] install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[VAFT SW] activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(resp => {
      if (resp) return resp;

      return fetch(event.request).catch(() => {
        // fallback na index, když jsme offline
        return caches.match('./index.html');
      });
    })
  );
});
