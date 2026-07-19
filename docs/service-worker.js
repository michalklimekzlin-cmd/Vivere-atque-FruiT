"use strict";

/* Hlavní Paměť má vlastní cache a nemaže cache vedlejších PWA. */
const ROOT_CACHE_PREFIX = "cht360-root-";
const LEGACY_ROOT_CACHE_PREFIX = "cht360-v";
const CACHE_VERSION = "v17-unified-glyph-utf8";
const CACHE_NAME = ROOT_CACHE_PREFIX + CACHE_VERSION;
const OFFLINE_PAGE = "./index.html";

/* Tyto aplikace zůstávají izolované ve vlastních service workerech. */
const SIDE_APP_SCOPES = [
  new URL("./bubinky/", self.registration.scope).pathname,
  new URL("./cht360-jadra-pracovni-deska/", self.registration.scope).pathname,
  new URL("./glyph-cht-360/", self.registration.scope).pathname,
  new URL("./glyph-pokojicku-cht-360/", self.registration.scope).pathname,
  new URL("./mluva-cht-360/", self.registration.scope).pathname,
  new URL("./signal-360/", self.registration.scope).pathname
];

const CORE_FILES = [
  "./",
  "./index.html",
  "./css/pamet.css",
  "./css/glyph-engine.css",
  "./js/app.js",
  "./js/aplikace.js",
  "./js/bubinky-pevne.js",
  "./js/bubinky-petka.js",
  "./js/glyph-engine.js",
  "./js/cht-chybozrout.js",
  "./js/cht-360-network.js",
  "./manifest.json",
  "./icon.svg"
  "./css/prstenec-pokojicku.css",
"./js/prstenec-pokojicku.js",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await Promise.allSettled(
          CORE_FILES.map(async file => {
            const response = await fetch(file, { cache: "no-store" });
            if (!response.ok) {
              throw new Error("Soubor " + file + " vrátil stav " + response.status);
            }
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
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              (key.startsWith(ROOT_CACHE_PREFIX) ||
                key.startsWith(LEGACY_ROOT_CACHE_PREFIX)) &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response?.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") return cache.match(OFFLINE_PAGE);
    throw _;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });

  const network = fetch(request, { cache: "no-store" })
    .then(async response => {
      if (response?.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || network;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* Vedlejší PWA obsluhuje vlastní worker, případně přímo síť. */
  if (SIDE_APP_SCOPES.some(scope => url.pathname.startsWith(scope))) return;

  const freshCode =
    request.mode === "navigate" ||
    /\.(?:html|css|js|json|svg)$/u.test(url.pathname);

  event.respondWith(freshCode ? networkFirst(request) : staleWhileRevalidate(request));
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

