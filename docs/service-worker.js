const CACHE_NAME = "vaft-pamet-modularni-v1";
const SOUBORY = [
  "./",
  "./index.html",
  "./css/pamet.css",
  "./js/aplikace.js",
  "./js/uloziste.js",
  "./js/sloty.js",
  "./js/export-import.js",
  "./data/schema-pameti.json",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SOUBORY))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match("./index.html"))
  );
});
