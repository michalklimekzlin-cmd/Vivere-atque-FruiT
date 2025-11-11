// 🧠 Nový čistý service-worker.js
const CACHE_NAME = 'vaft-cache-v2'; // zvýš verzi, ať se starý zneplatní

self.addEventListener('install', (event) => {
  console.log('[SW] Instalace nové verze...');
  self.skipWaiting(); // hned aktivuj novou verzi
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Aktivace a čištění starých cache...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Mazání cache:', key);
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Vždy ber novou verzi z internetu, pokud jde
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
