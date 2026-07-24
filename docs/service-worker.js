"use strict";

const CACHE_PREFIX = "cht360-shared-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_PAGE = "./index.html";

const CORE_FILES = [
  "./",
  "./index.html",
  "./css/pamet.css",
  "./css/revia-dock.css",
  "./js/app.js",
  "./js/aplikace.js",
  "./js/glyph-kostra.js",
  "./js/cht-chybozrout.js",
  "./js/revia-context.js",
  "./js/revia-continuity.js",
  "./js/revia-local-mesh.js",
  "./js/revia-glyph-memory.js",
  "./js/revia-repository-memory.js",
  "./js/revia-dock.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        CORE_FILES.map(async file => {
          const response = await fetch(file, { cache: "no-store" });
          if (response.ok) await cache.put(file, response.clone());
        })
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isFreshAsset(url, request) {
  return request.mode === "navigate" ||
    /\.(?:html|css|js|json|webmanifest)$/i.test(url.pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, { cache: "no-store" });

    if (response && response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });

    if (cached) return cached;
    if (request.mode === "navigate") return cache.match(OFFLINE_PAGE);

    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });

  const fresh = fetch(request, { cache: "no-store" })
    .then(async response => {
      if (response && response.ok) {
        await cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => null);

  return cached || fresh;
}

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    isFreshAsset(url, request)
      ? networkFirst(request)
      : staleWhileRevalidate(request)
  );
});

async function clearOwnCaches() {
  const keys = await caches.keys();

  await Promise.all(
    keys
      .filter(key => key.startsWith(CACHE_PREFIX))
      .map(key => caches.delete(key))
  );
}

async function refreshUrls(urls = []) {
  const cache = await caches.open(CACHE_NAME);

  const results = await Promise.allSettled(
    urls.map(async url => {
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`${url}: ${response.status}`);
      }

      await cache.put(url, response.clone());
      return url;
    })
  );

  return results.map((result, index) => ({
    url: urls[index],
    ok: result.status === "fulfilled"
  }));
}

self.addEventListener("message", event => {
  const data = event.data || {};
  const reply = payload => event.ports?.[0]?.postMessage(payload);

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "CHYBOZROUT_CLEAR_CACHE") {
    event.waitUntil(
      clearOwnCaches()
        .then(() => reply({ ok: true, action: "cache-cleared" }))
        .catch(error => reply({ ok: false, error: String(error) }))
    );
    return;
  }

  if (data.type === "CHYBOZROUT_REFRESH_URLS") {
    event.waitUntil(
      refreshUrls(Array.isArray(data.urls) ? data.urls : [])
        .then(results => reply({ ok: true, results }))
        .catch(error => reply({ ok: false, error: String(error) }))
    );
    return;
  }

  if (data.type === "CHYBOZROUT_STATUS") {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.keys())
        .then(keys => reply({
          ok: true,
          cacheName: CACHE_NAME,
          entries: keys.length
        }))
        .catch(error => reply({ ok: false, error: String(error) }))
    );
  }
});
