const CACHE_NAME = 'michal-ai-pwa-v1';
const OFFLINE_URL = './index.html';
const PRECACHE_URLS = ['./', './index.html', './manifest.json', './style.css'];
self.addEventListener('install', (e) => {e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()))});
self.addEventListener('activate', (e) => {e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))));self.clients.claim();});
self.addEventListener('fetch', (e) => {if (e.request.method !== 'GET') return;
const u = new URL(e.request.url);
if (u.origin !== self.location.origin) return;
const h = e.request.mode === 'navigate' || e.request.destination === 'document' || (e.request.headers.get('accept') || '').includes('text/html');
if (h) {e.respondWith(fetch(e.request).then((r) => {const c = r.clone();caches.open(CACHE_NAME).then((s) => s.put(e.request, c));return r;}).catch(() => caches.match(e.request).then((c) => c || caches.match(OFFLINE_URL))));return;}
e.respondWith(caches.match(e.request).then((c) => {if (c) return c;return fetch(e.request).then((r) => {if (!r || r.status !== 200 || r.type !== 'basic') return r;const s = r.clone();caches.open(CACHE_NAME).then((t) => t.put(e.request, s));return r;});}));});
