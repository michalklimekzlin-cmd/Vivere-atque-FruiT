"use strict";

/*
  CHT 360°‰. — OFFLINE SERVICE WORKER
  -----------------------------------
  - plné spuštění PWA bez internetu
  - zachování lokální Paměti
  - automatické ukládání načtených souborů
  - offline návrat na index.html
  - podpora ChyboŽrouta
  - podpora starého názvu offline-cashe-assets.json
*/

const CACHE_PREFIX = "cht360-shared-";
const CACHE_NAME = `${CACHE_PREFIX}v8-offline`;
const OFFLINE_PAGE = "./index.html";

/*
  V repozitáři máme historicky název:
  offline-cashe-assets.json

  Worker zároveň umí i opravený:
  offline-cache-assets.json
*/
const OFFLINE_MANIFESTS = [
  "./offline-cache-assets.json",
  "./offline-cashe-assets.json"
];

/*
  Úplné minimum potřebné ke startu.
  Další soubory se doplní z offline manifestu
  a při běžném používání aplikace.
*/
const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];


/* =========================================================
   POMOCNÉ FUNKCE
   ========================================================= */

function canCacheResponse(response) {
  if (!response) {
    return false;
  }

  return response.ok || response.type === "opaque";
}


async function putResponse(cache, request, response) {
  if (!canCacheResponse(response)) {
    return;
  }

  try {
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn(
      "[CHT 360°‰.] Soubor se nepodařilo uložit do cache:",
      request,
      error
    );
  }
}


/* =========================================================
   OFFLINE MANIFEST
   ========================================================= */

async function readOfflineManifest() {
  for (const manifestUrl of OFFLINE_MANIFESTS) {
    try {
      const response = await fetch(
        manifestUrl,
        { cache: "no-store" }
      );

      if (!response.ok) {
        continue;
      }

      const manifest = await response.json();

      if (Array.isArray(manifest)) {
        return {
          manifestUrl,
          files: manifest
        };
      }

      if (Array.isArray(manifest.files)) {
        return {
          manifestUrl,
          files: manifest.files
        };
      }
    } catch (error) {
      /*
        Zkusíme druhý název manifestu.
      */
    }
  }

  console.warn(
    "[CHT 360°‰.] Offline seznam nebyl nalezen. " +
    "Použije se základní cache a runtime ukládání."
  );

  return {
    manifestUrl: null,
    files: []
  };
}


/* =========================================================
   PRECACHE
   ========================================================= */

async function cacheSingleFile(cache, file) {
  try {
    const response = await fetch(
      file,
      { cache: "no-store" }
    );

    if (!canCacheResponse(response)) {
      throw new Error(
        "HTTP " + response.status
      );
    }

    await cache.put(
      file,
      response.clone()
    );

    return {
      file,
      ok: true
    };
  } catch (error) {
    console.warn(
      "[CHT 360°‰.] Offline cache přeskočila:",
      file,
      error
    );

    return {
      file,
      ok: false
    };
  }
}


async function precacheAll() {
  const cache = await caches.open(CACHE_NAME);

  const manifest = await readOfflineManifest();

  const files = [
    ...CORE_FILES,
    ...(manifest.manifestUrl
      ? [manifest.manifestUrl]
      : []),
    ...manifest.files
  ];

  const uniqueFiles = [
    ...new Set(
      files
        .filter(Boolean)
        .map(file => String(file).trim())
        .filter(Boolean)
    )
  ];

  const results = await Promise.all(
    uniqueFiles.map(
      file => cacheSingleFile(cache, file)
    )
  );

  const successful =
    results.filter(result => result.ok).length;

  const failed =
    results.length - successful;

  console.log(
    "[CHT 360°‰.] Offline připraveno:",
    successful,
    "souborů."
  );

  if (failed) {
    console.warn(
      "[CHT 360°‰.] Nepodařilo se uložit:",
      failed,
      "souborů."
    );
  }

  return {
    successful,
    failed,
    total: results.length
  };
}


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener(
  "install",
  event => {
    event.waitUntil(
      precacheAll()
        .catch(error => {
          console.warn(
            "[CHT 360°‰.] Instalace offline vrstvy:",
            error
          );
        })
        .then(() => self.skipWaiting())
    );
  }
);


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener(
  "activate",
  event => {
    event.waitUntil(
      caches
        .keys()
        .then(keys => {
          return Promise.all(
            keys
              .filter(
                key =>
                  key.startsWith(CACHE_PREFIX) &&
                  key !== CACHE_NAME
              )
              .map(
                key => caches.delete(key)
              )
          );
        })
        .then(() => self.clients.claim())
    );
  }
);


/* =========================================================
   NAVIGACE — NETWORK FIRST
   ========================================================= */

async function navigationNetworkFirst(request) {
  const cache =
    await caches.open(CACHE_NAME);

  try {
    const response =
      await fetch(
        request,
        { cache: "no-store" }
      );

    if (response.ok) {
      await putResponse(
        cache,
        request,
        response
      );

      return response;
    }

    const cached =
      await cache.match(
        request,
        { ignoreSearch: true }
      );

    if (cached) {
      return cached;
    }

    const offline =
      await cache.match(OFFLINE_PAGE);

    if (offline) {
      return offline;
    }

    return response;
  } catch (error) {
    const cached =
      await cache.match(
        request,
        { ignoreSearch: true }
      );

    if (cached) {
      return cached;
    }

    const offline =
      await cache.match(OFFLINE_PAGE);

    if (offline) {
      return offline;
    }

    throw error;
  }
}


/* =========================================================
   LOKÁLNÍ SOUBORY — STALE WHILE REVALIDATE
   ========================================================= */

async function localStaleWhileRevalidate(request) {
  const cache =
    await caches.open(CACHE_NAME);

  const cached =
    await cache.match(
      request,
      { ignoreSearch: true }
    );

  const networkPromise =
    fetch(
      request,
      { cache: "no-store" }
    )
      .then(async response => {
        if (canCacheResponse(response)) {
          await putResponse(
            cache,
            request,
            response
          );
        }

        return response;
      })
      .catch(() => null);

  if (cached) {
    return cached;
  }

  const network =
    await networkPromise;

  if (network) {
    return network;
  }

  throw new Error(
    "CHT 360°‰. · soubor není dostupný offline."
  );
}


/* =========================================================
   EXTERNÍ SOUBORY
   ========================================================= */

async function externalRuntimeCache(request) {
  const cache =
    await caches.open(CACHE_NAME);

  const cached =
    await cache.match(
      request,
      { ignoreSearch: true }
    );

  if (cached) {
    /*
      Na pozadí zkusíme novější kopii.
    */
    fetch(request)
      .then(async response => {
        if (canCacheResponse(response)) {
          await putResponse(
            cache,
            request,
            response
          );
        }
      })
      .catch(() => {});

    return cached;
  }

  try {
    const response =
      await fetch(request);

    if (canCacheResponse(response)) {
      await putResponse(
        cache,
        request,
        response
      );
    }

    return response;
  } catch (error) {
    throw error;
  }
}


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener(
  "fetch",
  event => {
    const request = event.request;

    if (request.method !== "GET") {
      return;
    }

    /*
      Range requesty necháme prohlížeči.
    */
    if (request.headers.has("range")) {
      return;
    }

    const url =
      new URL(request.url);

    /*
      Otevření stránky / PWA.
    */
    if (request.mode === "navigate") {
      event.respondWith(
        navigationNetworkFirst(request)
      );

      return;
    }

    /*
      Vlastní soubory CHT.
    */
    if (url.origin === self.location.origin) {
      event.respondWith(
        localStaleWhileRevalidate(request)
      );

      return;
    }

    /*
      Externí zdroje, které už byly alespoň
      jednou načtené online.
    */
    if (
      url.protocol === "https:" ||
      url.protocol === "http:"
    ) {
      event.respondWith(
        externalRuntimeCache(request)
      );
    }
  }
);


/* =========================================================
   SMAZÁNÍ CACHE CHT
   ========================================================= */

async function clearOwnCaches() {
  const keys =
    await caches.keys();

  await Promise.all(
    keys
      .filter(
        key =>
          key.startsWith(CACHE_PREFIX)
      )
      .map(
        key => caches.delete(key)
      )
  );
}


/* =========================================================
   RUČNÍ OBNOVENÍ SOUBORŮ
   ========================================================= */

async function refreshUrls(urls = []) {
  const cache =
    await caches.open(CACHE_NAME);

  const results =
    await Promise.allSettled(
      urls.map(async url => {
        const response =
          await fetch(
            url,
            { cache: "no-store" }
          );

        if (!canCacheResponse(response)) {
          throw new Error(
            `${url}: ${response.status}`
          );
        }

        await cache.put(
          url,
          response.clone()
        );

        return url;
      })
    );

  return results.map(
    (result, index) => ({
      url: urls[index],
      ok:
        result.status ===
        "fulfilled"
    })
  );
}


/* =========================================================
   ZPRÁVY Z CHT / CHYBOŽROUTA
   ========================================================= */

self.addEventListener(
  "message",
  event => {
    const data =
      event.data || {};

    const reply =
      payload => {
        if (
          event.ports &&
          event.ports[0]
        ) {
          event.ports[0]
            .postMessage(payload);
        }
      };


    /* -----------------------------------------
       Nový worker okamžitě převezme řízení.
       ----------------------------------------- */

    if (
      data.type ===
      "SKIP_WAITING"
    ) {
      self.skipWaiting();
      return;
    }


    /* -----------------------------------------
       ChyboŽrout — vymazání cache.
       ----------------------------------------- */

    if (
      data.type ===
      "CHYBOZROUT_CLEAR_CACHE"
    ) {
      event.waitUntil(
        clearOwnCaches()
          .then(() => {
            reply({
              ok: true,
              action:
                "cache-cleared"
            });
          })
          .catch(error => {
            reply({
              ok: false,
              error:
                String(error)
            });
          })
      );

      return;
    }


    /* -----------------------------------------
       ChyboŽrout — obnovení URL.
       ----------------------------------------- */

    if (
      data.type ===
      "CHYBOZROUT_REFRESH_URLS"
    ) {
      event.waitUntil(
        refreshUrls(
          Array.isArray(data.urls)
            ? data.urls
            : []
        )
          .then(results => {
            reply({
              ok: true,
              results
            });
          })
          .catch(error => {
            reply({
              ok: false,
              error:
                String(error)
            });
          })
      );

      return;
    }


    /* -----------------------------------------
       Stav offline cache.
       ----------------------------------------- */

    if (
      data.type ===
      "CHYBOZROUT_STATUS"
    ) {
      event.waitUntil(
        caches
          .open(CACHE_NAME)
          .then(
            cache =>
              cache.keys()
          )
          .then(keys => {
            reply({
              ok: true,
              cacheName:
                CACHE_NAME,
              entries:
                keys.length
            });
          })
          .catch(error => {
            reply({
              ok: false,
              error:
                String(error)
            });
          })
      );

      return;
    }


    /* -----------------------------------------
       Připravit CHT kompletně pro OFFLINE.
       ----------------------------------------- */

    if (
      data.type ===
      "CHT360_PREPARE_OFFLINE"
    ) {
      event.waitUntil(
        precacheAll()
          .then(result => {
            reply({
              ok: true,
              action:
                "offline-complete",
              ...result
            });
          })
          .catch(error => {
            reply({
              ok: false,
              error:
                String(error)
            });
          })
      );
    }
  }
);