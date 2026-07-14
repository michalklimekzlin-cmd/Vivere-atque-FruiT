"use strict";

const CACHE_NAME = "cht360-batole-v1";
const OFFLINE_PAGE = "./index.html";
const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/batole.svg",
  "./icons/batole-192.png",
  "./icons/batole-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await Promise.allSettled(
          CORE_FILES.map(async file => {
            const response = await fetch(file, { cache: "no-store" });
            if (!response.ok) throw new Error("Nelze uložit " + file);
            await cache.put(file, response);
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") return cache.match(OFFLINE_PAGE);
    throw new Error("Offline and no cache");
  }
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request));
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
