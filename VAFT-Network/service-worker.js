const CACHE_NAME = 'vaft-network-v1';
const OFFLINE_URLS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  '../vaft.network.js',
  '../assets/images/AFA0870E-F586-4406-8BAA-0A7944120AA3.png',
  '../assets/images/50F62985-1E64-4F1B-934A-64A8C4DC98CB.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match('./index.html'))));
});
