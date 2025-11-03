const CACHE_NAME = "vaf-cache-v0.35";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=0.31",
  "./manifest.json",
  "./src/app.js?v=0.35",
  "./src/engine.js?v=0.35",
  "./src/teams.js?v=0.35"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});
