const CACHE_NAME = 'vaft-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './hlavoun.js',
  './manifest.json',
  './VafiT-gallery/index.html',
  './VafiT-gallery/style.css',
  './VafiT-gallery/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
