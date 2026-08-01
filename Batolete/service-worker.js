/**
 * Batolete – Service Worker
 * Offline-first PWA pro dětskou aplikaci
 * Vivere atque Frui'T → Batolete
 */

'use strict';

const CACHE_NAME    = 'batolete-v1';
const OFFLINE_PAGE  = './';
const CORE_FILES    = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './characters.js',
  './manifest.json'
];

/* ── INSTALL: Cache all core files ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(
        CORE_FILES.map(async file => {
          try {
            const response = await fetch(file, { cache: 'no-store' });
            if (response.ok) await cache.put(file, response);
          } catch (e) {
            // ignore individual fetch errors during install
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: Remove old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: Cache-first for assets, network-first for navigation ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => null);
    })
  );
});

/* ── MESSAGE: Force update ── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
