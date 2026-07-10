/* VaF'i'T Signal Tower Engine - PWA offline worker
   Soubor nahraj vedle index.html jako sw.js.
   Stejný obsah můžeš použít i jako service-worker.js.
*/

const CACHE_NAME = "vafit-signal-tower-engine-v16-cache-1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./service-worker.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS.map(url => new Request(url, { cache: "reload" }))))
      .catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy).catch(() => null);
          });

          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return caches.match("./index.html");
        });
    })
  );
});