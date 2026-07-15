"use strict";

/*
  Při větší změně stačí zvýšit poslední číslo.
  Staré cache se při aktivaci automaticky odstraní.
*/
const CACHE_VERSION = "v8";
const CACHE_NAME = `cht360-${CACHE_VERSION}`;

const OFFLINE_PAGE = "./index.html";

const CORE_FILES = [
  "./",
  "./index.html",
  "./css/pamet.css",
  "./js/app.js",
  "./js/aplikace.js",
  "./js/cht-chybozrout.js",
  "./manifest.json"
];

/*
  Instalace:
  každý soubor ukládáme zvlášť.
  Jeden chybějící soubor tak nezastaví celý service worker.
*/
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(
        CORE_FILES.map(async file => {
          const response = await fetch(file, {
            cache: "no-store"
          });

          if (!response.ok) {
            throw new Error(
              `Soubor ${file} vrátil stav ${response.status}`
            );
          }

          await cache.put(file, response);
        })
      );
    }).then(() => self.skipWaiting())
  );
});

/*
  Aktivace:
  odstranění všech předchozích verzí cache.
*/
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/*
  HTML, CSS a JavaScript:
  vždy se nejdřív zkouší nejnovější verze ze sítě.

  Když síť nefunguje:
  použije se poslední uložená verze.
*/
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, {
      cache: "no-store"
    });

    if (response && response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request, {
      ignoreSearch: true
    });

    if (cached) {
      return cached;
    }

    if (request.mode === "navigate") {
      return (
        await cache.match(OFFLINE_PAGE)
      );
    }

    throw error;
  }
}

/*
  Ostatní soubory:
  cache se ukáže okamžitě,
  ale na pozadí se zkusí obnovit.
*/
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);

  const cached = await cache.match(request, {
    ignoreSearch: true
  });

  const networkPromise = fetch(request, {
    cache: "no-store"
  })
    .then(async response => {
      if (response && response.ok) {
        await cache.put(
          request,
          response.clone()
        );
      }

      return response;
    })
    .catch(() => null);

  return cached || networkPromise;
}

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /*
    Cizí weby necháme prohlížeči.
  */
  if (url.origin !== self.location.origin) {
    return;
  }

  const isFreshCode =
    request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json");

  event.respondWith(
    isFreshCode
      ? networkFirst(request)
      : staleWhileRevalidate(request)
  );
});

/*
  Umožní stránce nového workera okamžitě aktivovat.
*/
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

