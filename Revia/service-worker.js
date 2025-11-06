// 🪽 Service Worker pro Revia (v0.1)
const CACHE_NAME = 'revia-cache-v1';
const OFFLINE_URLS = [
  './index.html',
  './revia.css',
  './revia.js',
  './manifest.json',
  './assets/revia-bg.jpg',
  './assets/revia-icon.png',
  './assets/revia-icon-512.png'
];

// Instalace SW a uložení souborů do cache
self.addEventListener('install', event => {
  console.log('🪽 Revia SW: instalace…');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Aktivace – čištění starých verzí
self.addEventListener('activate', event => {
  console.log('🪽 Revia SW: aktivováno');
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Načítání souborů
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      // Vrátí z cache, nebo stáhne novou verzi
      return resp || fetch(event.request)
        .then(response => {
          // Aktualizace cache
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match('./index.html')); // fallback offline
    })
  );
});
