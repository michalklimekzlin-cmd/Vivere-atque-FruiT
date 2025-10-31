// Jednoduchý offline cache pro GitHub Pages
const CACHE = "batole3d-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./main.js?v=34",
  "./manifest.json",
  "./icon512.png",
  "https://unpkg.com/three@0.160.0/build/three.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Network-first pro main.js, jinak cache-first
  if (url.pathname.endsWith("main.js")) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});