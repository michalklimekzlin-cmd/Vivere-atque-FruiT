const CACHE_NAME = 'fruit-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './TEACHER_STUDIO.html',
  './manifest.json',
  './VIVERE_atque_FruiT_CORE.js',
  './fruiT_learning_engine.js',
  './fruiT_memory_system.js',
  './vivere-ai.html',
  './vivere-ai-manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.pathname.includes('vivere-ai')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match('./vivere-ai.html'))
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match('./TEACHER_STUDIO.html'));
    })
  );
});
