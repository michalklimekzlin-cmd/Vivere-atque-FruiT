"use strict";

/*
 * CHT 360°‰.
 * Offline vrstva v8
 *
 * Oprava:
 * - podporuje současný název offline-cashe-assets.json
 * - drží hlavní CHT soubory offline
 * - doplňuje nové moduly Země, bubínků a CHT
 * - starou cache odstraní až po aktivaci nové
 */

const CACHE_PREFIX = "cht360-shared-";
const CACHE_NAME = `${CACHE_PREFIX}v8-offline-cht360`;

const OFFLINE_PAGE = "./index.html";

/*
 * Tyto soubory musí být dostupné i tehdy,
 * když se nepodaří načíst celý offline manifest.
 */
const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",

  "./css/pamet.css",
  "./css/prstenec-pokojicku.css",
  "./css/revia-dock.css",

  "./batole-core.css",
  "./batole-core.js",

  "./js/aplikace.js",

  "./js/cht-chybozrout.js",
  "./js/cht-chybozrout-domov.js",

  "./js/revia-dock.js",

  "./js/prstenec-pokojicku.js",

  "./js/bubinky-pevne.js",
  "./js/bubinky-petka.js",

  "./js/cht-360-relay.js",
  "./js/cht-360-network.js",

  "./js/cht-360-zamky-spojnice.js",
  "./js/cht-360-oblouk-osmi-zamku.js",

  "./js/cht-360-bubinky-kolotoc.js",
  "./js/cht-360-zeme-glyphy.js",

  "./js/cht-360-config.js",
  "./js/cht-360-navigation.js",
  "./js/cht-360-logger.js",
  "./js/cht-360-performance.js",

  "./js/cht-ui-components.js",

  /*
   * POZOR:
   * V repozitáři se soubor opravdu jmenuje
   * offline-cashe-assets.json
   */
  "./offline-cashe-assets.json"
];


/* ─────────────────────────────────────
   OFFLINE SEZNAM
───────────────────────────────────── */

async function offlineFileList() {
  try {
    const response = await fetch(
      "./offline-cashe-assets.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(
        `offline manifest HTTP ${response.status}`
      );
    }

    const manifest = await response.json();

    if (!Array.isArray(manifest.files)) {
      throw new Error(
        "offline manifest nemá pole files"
      );
    }

    return manifest.files;
  } catch (error) {
    console.warn(
      "[CHT 360°‰.] Offline seznam se nepodařilo načíst.",
      error
    );

    /*
     * CHT přesto nezůstane bez offline vrstvy.
     * CORE_FILES se uloží samostatně.
     */
    return [];
  }
}


/* ─────────────────────────────────────
   BEZPEČNÉ ULOŽENÍ JEDNOHO SOUBORU
───────────────────────────────────── */

async function cacheOne(cache, file) {
  try {
    const response = await fetch(
      file,
      { cache: "no-store" }
    );

    if (!response || !response.ok) {
      console.warn(
        "[CHT 360°‰.] Přeskakuji offline soubor:",
        file,
        response?.status || "bez odpovědi"
      );

      return {
        file,
        ok: false
      };
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
      "[CHT 360°‰.] Soubor se nepodařilo uložit:",
      file,
      error
    );

    return {
      file,
      ok: false
    };
  }
}


/* ─────────────────────────────────────
   PŘÍPRAVA CELÉHO OFFLINE CHT
───────────────────────────────────── */

async function precacheAll() {
  const cache =
    await caches.open(CACHE_NAME);

  const manifestFiles =
    await offlineFileList();

  const files = [
    ...new Set([
      ...CORE_FILES,
      ...manifestFiles
    ])
  ];

  const results =
    await Promise.all(
      files.map(
        file => cacheOne(cache, file)
      )
    );

  const successful =
    results.filter(item => item.ok);

  const failed =
    results.filter(item => !item.ok);

  console.info(
    `[CHT 360°‰.] Offline připraveno: ${successful.length}/${results.length}`
  );

  if (failed.length) {
    console.warn(
      "[CHT 360°‰.] Některé nepovinné soubory nebyly nalezeny:",
      failed.map(item => item.file)
    );
  }

  return {
    total: results.length,
    cached: successful.length,
    failed: failed.length
  };
}


/* ─────────────────────────────────────
   INSTALL
───────────────────────────────────── */

self.addEventListener(
  "install",
  event => {
    event.waitUntil(
      precacheAll()
        .then(() => self.skipWaiting())
    );
  }
);


/* ─────────────────────────────────────
   ACTIVATE
───────────────────────────────────── */

self.addEventListener(
  "activate",
  event => {
    event.waitUntil(
      (async () => {
        const keys =
          await caches.keys();

        await Promise.all(
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

        await self.clients.claim();
      })()
    );
  }
);


/* ─────────────────────────────────────
   NETWORK FIRST
   HTML / JS / CSS / JSON
───────────────────────────────────── */

function isFreshAsset(url, request) {
  return (
    request.mode === "navigate" ||
    /\.(?:html|css|js|json|webmanifest)$/i
      .test(url.pathname)
  );
}


async function networkFirst(request) {
  const cache =
    await caches.open(CACHE_NAME);

  try {
    const response =
      await fetch(
        request,
        { cache: "no-store" }
      );

    if (
      response &&
      response.ok
    ) {
      await cache.put(
        request,
        response.clone()
      );
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

    if (
      request.mode === "navigate"
    ) {
      const fallback =
        await cache.match(
          OFFLINE_PAGE
        );

      if (fallback) {
        return fallback;
      }
    }

    throw error;
  }
}


/* ─────────────────────────────────────
   CACHE FIRST + OBNOVA
───────────────────────────────────── */

async function staleWhileRevalidate(
  request
) {
  const cache =
    await caches.open(CACHE_NAME);

  const cached =
    await cache.match(
      request,
      { ignoreSearch: true }
    );

  const fresh =
    fetch(
      request,
      { cache: "no-store" }
    )
      .then(
        async response => {
          if (
            response &&
            response.ok
          ) {
            await cache.put(
              request,
              response.clone()
            );
          }

          return response;
        }
      )
      .catch(() => null);

  if (cached) {
    return cached;
  }

  if (fresh) {
    return fresh;
  }

  return Response.error();
}


/* ─────────────────────────────────────
   FETCH
───────────────────────────────────── */

self.addEventListener(
  "fetch",
  event => {
    const request =
      event.request;

    if (
      request.method !== "GET"
    ) {
      return;
    }

    const url =
      new URL(request.url);

    /*
     * Cizí domény necháváme síti.
     * Offline CHT pracuje se svými soubory.
     */
    if (
      url.origin !== self.location.origin
    ) {
      return;
    }

    event.respondWith(
      isFreshAsset(url, request)
        ? networkFirst(request)
        : staleWhileRevalidate(request)
    );
  }
);


/* ─────────────────────────────────────
   CHYBOŽROUT — CACHE
───────────────────────────────────── */

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


async function refreshUrls(
  urls = []
) {
  const cache =
    await caches.open(CACHE_NAME);

  const results =
    await Promise.allSettled(
      urls.map(
        async url => {
          const response =
            await fetch(
              url,
              { cache: "no-store" }
            );

          if (!response.ok) {
            throw new Error(
              `${url}: ${response.status}`
            );
          }

          await cache.put(
            url,
            response.clone()
          );

          return url;
        }
      )
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


/* ─────────────────────────────────────
   ZPRÁVY CHT / CHYBOŽROUT
───────────────────────────────────── */

self.addEventListener(
  "message",
  event => {
    const data =
      event.data || {};

    const reply =
      payload =>
        event.ports?.[0]
          ?.postMessage(payload);


    if (
      data.type ===
      "SKIP_WAITING"
    ) {
      self.skipWaiting();
      return;
    }


    if (
      data.type ===
      "CHYBOZROUT_CLEAR_CACHE"
    ) {
      event.waitUntil(
        clearOwnCaches()
          .then(
            () =>
              reply({
                ok: true,
                action:
                  "cache-cleared"
              })
          )
          .catch(
            error =>
              reply({
                ok: false,
                error:
                  String(error)
              })
          )
      );

      return;
    }


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
          .then(
            results =>
              reply({
                ok: true,
                results
              })
          )
          .catch(
            error =>
              reply({
                ok: false,
                error:
                  String(error)
              })
          )
      );

      return;
    }


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
          .then(
            keys =>
              reply({
                ok: true,
                cacheName:
                  CACHE_NAME,
                entries:
                  keys.length
              })
          )
          .catch(
            error =>
              reply({
                ok: false,
                error:
                  String(error)
              })
          )
      );

      return;
    }


    if (
      data.type ===
      "CHT360_PREPARE_OFFLINE"
    ) {
      event.waitUntil(
        precacheAll()
          .then(
            result =>
              reply({
                ok: true,
                action:
                  "offline-complete",
                ...result
              })
          )
          .catch(
            error =>
              reply({
                ok: false,
                error:
                  String(error)
              })
          )
      );
    }
  }
);
