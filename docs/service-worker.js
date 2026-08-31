"use strict";

/*
 * ╔══════════════════════════════════════════════════════════╗
 * ║                 CHT 360°‰. OFFLINE                     ║
 * ║                    Service Worker v10                   ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * CÍL:
 * - CHT 360°‰. funguje po prvním online načtení i bez internetu
 * - lokální HTML / JS / CSS / JSON / SVG se drží v cache
 * - při návratu internetu se cache sama obnovuje
 * - stará cache se odstraní až po aktivaci nové
 * - ChyboŽrout může cache kontrolovat a obnovovat
 * - podporuje současný název offline-cashe-assets.json
 */

const CACHE_PREFIX = "cht360-shared-";
const CACHE_NAME = `${CACHE_PREFIX}v10-full-offline`;

const OFFLINE_PAGE = "./index.html";
const OFFLINE_MANIFEST = "./offline-cashe-assets.json";

/*
 * KRITICKÉ SOUBORY
 *
 * Pokud některý doplňkový modul neexistuje, instalace kvůli
 * němu nespadne. index.html je ale povinný.
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

  "./js/cht-360-aplikace-2.js",

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

  OFFLINE_MANIFEST
];


/* ==========================================================
   POMOCNÉ FUNKCE
========================================================== */

function absoluteURL(path) {
  return new URL(path, self.registration.scope).href;
}


function isSameOrigin(url) {
  return url.origin === self.location.origin;
}


function isCacheableResponse(response) {
  return (
    response &&
    (
      response.ok ||
      response.type === "opaque"
    )
  );
}


/* ==========================================================
   OFFLINE MANIFEST
========================================================== */

async function readOfflineManifest() {
  try {
    const response = await fetch(
      absoluteURL(OFFLINE_MANIFEST),
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data.files)) {
      throw new Error(
        "Manifest neobsahuje pole files."
      );
    }

    return data.files
      .filter(
        file =>
          typeof file === "string" &&
          file.trim()
      )
      .map(file => file.trim());

  } catch (error) {

    console.warn(
      "[CHT 360°‰.] Offline manifest není dostupný.",
      error
    );

    return [];
  }
}


/* ==========================================================
   ULOŽENÍ JEDNOHO SOUBORU
========================================================== */

async function cacheOne(cache, path) {

  const url = absoluteURL(path);

  try {

    const response = await fetch(
      url,
      {
        cache: "no-store"
      }
    );

    if (!isCacheableResponse(response)) {

      console.warn(
        "[CHT 360°‰.] Offline soubor přeskočen:",
        path,
        response?.status
      );

      return {
        file: path,
        ok: false
      };
    }

    await cache.put(
      url,
      response.clone()
    );

    return {
      file: path,
      ok: true
    };

  } catch (error) {

    /*
     * Pokud už soubor v cache máme,
     * necháme jej tam.
     */

    const existing =
      await cache.match(url);

    if (existing) {

      return {
        file: path,
        ok: true,
        existing: true
      };
    }

    console.warn(
      "[CHT 360°‰.] Nelze uložit:",
      path,
      error
    );

    return {
      file: path,
      ok: false
    };
  }
}


/* ==========================================================
   PLNÁ OFFLINE PŘÍPRAVA
========================================================== */

async function precacheAll() {

  const cache =
    await caches.open(CACHE_NAME);

  const manifestFiles =
    await readOfflineManifest();

  const files = [
    ...new Set([
      ...CORE_FILES,
      ...manifestFiles
    ])
  ];

  const results = [];

  /*
   * Ukládáme postupně.
   *
   * Na mobilním Safari je to stabilnější než odpálit
   * velké množství fetchů současně.
   */
  for (const file of files) {

    const result =
      await cacheOne(
        cache,
        file
      );

    results.push(result);
  }


  /*
   * index.html MUSÍ být uložen.
   */

  const indexURL =
    absoluteURL(OFFLINE_PAGE);

  const index =
    await cache.match(indexURL);

  if (!index) {

    throw new Error(
      "CHT 360°‰.: index.html se nepodařilo uložit do offline cache."
    );
  }


  const successful =
    results.filter(
      item => item.ok
    );

  const failed =
    results.filter(
      item => !item.ok
    );


  console.info(
    `[CHT 360°‰.] OFFLINE READY ${successful.length}/${results.length}`
  );


  if (failed.length) {

    console.warn(
      "[CHT 360°‰.] Chybějící offline soubory:",
      failed.map(
        item => item.file
      )
    );
  }


  return {
    total: results.length,
    cached: successful.length,
    failed: failed.length,
    failedFiles:
      failed.map(
        item => item.file
      )
  };
}


/* ==========================================================
   INSTALL
========================================================== */

self.addEventListener(
  "install",
  event => {

    console.info(
      "[CHT 360°‰.] Instaluji offline vrstvu v10."
    );

    event.waitUntil(
      precacheAll()
        .then(() => {

          console.info(
            "[CHT 360°‰.] Offline vrstva nainstalována."
          );

          return self.skipWaiting();
        })
    );
  }
);


/* ==========================================================
   ACTIVATE
========================================================== */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(
      (async () => {

        const keys =
          await caches.keys();


        /*
         * Teprve nyní odstraníme staré CHT cache.
         */

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


        if (
          self.registration.navigationPreload
        ) {

          try {

            await self.registration
              .navigationPreload
              .disable();

          } catch (_) {}
        }


        await self.clients.claim();


        console.info(
          "[CHT 360°‰.] Offline vrstva v10 aktivní."
        );

      })()
    );
  }
);


/* ==========================================================
   CACHE FIRST
   HLAVNÍ OFFLINE STRATEGIE CHT
========================================================== */

async function cacheFirst(request) {

  const cache =
    await caches.open(CACHE_NAME);


  /*
   * 1. Nejprve cache.
   */

  const cached =
    await cache.match(
      request,
      {
        ignoreSearch: true
      }
    );


  if (cached) {

    /*
     * Máme soubor offline.
     *
     * Pokud internet existuje,
     * zkusíme jej nenápadně obnovit.
     */

    fetch(
      request,
      {
        cache: "no-store"
      }
    )
      .then(
        async response => {

          if (
            isCacheableResponse(response)
          ) {

            await cache.put(
              request,
              response.clone()
            );
          }
        }
      )
      .catch(() => {});


    return cached;
  }


  /*
   * 2. Cache soubor nemá.
   * Zkusíme internet.
   */

  try {

    const response =
      await fetch(
        request,
        {
          cache: "no-store"
        }
      );


    if (
      isCacheableResponse(response)
    ) {

      await cache.put(
        request,
        response.clone()
      );
    }


    return response;

  } catch (error) {


    /*
     * Navigace bez internetu:
     * vracíme CHT index.
     */

    if (
      request.mode === "navigate"
    ) {

      const fallback =
        await cache.match(
          absoluteURL(
            OFFLINE_PAGE
          )
        );


      if (fallback) {
        return fallback;
      }
    }


    throw error;
  }
}


/* ==========================================================
   FETCH
========================================================== */

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
      new URL(
        request.url
      );


    /*
     * Externí služby necháváme být.
     *
     * Offline CHT stojí pouze na vlastních
     * lokálních souborech.
     */

    if (
      !isSameOrigin(url)
    ) {
      return;
    }


    event.respondWith(
      cacheFirst(request)
    );
  }
);


/* ==========================================================
   SMAZÁNÍ CHT CACHE
========================================================== */

async function clearOwnCaches() {

  const keys =
    await caches.keys();


  await Promise.all(
    keys
      .filter(
        key =>
          key.startsWith(
            CACHE_PREFIX
          )
      )
      .map(
        key =>
          caches.delete(key)
      )
  );
}


/* ==========================================================
   RUČNÍ OBNOVA URL
========================================================== */

async function refreshUrls(
  urls = []
) {

  const cache =
    await caches.open(
      CACHE_NAME
    );


  const results = [];


  for (
    const path of urls
  ) {

    try {

      const url =
        absoluteURL(path);


      const response =
        await fetch(
          url,
          {
            cache: "no-store"
          }
        );


      if (
        !isCacheableResponse(response)
      ) {

        throw new Error(
          `HTTP ${response.status}`
        );
      }


      await cache.put(
        url,
        response.clone()
      );


      results.push({
        url: path,
        ok: true
      });


    } catch (error) {


      results.push({
        url: path,
        ok: false,
        error:
          String(error)
      });
    }
  }


  return results;
}


/* ==========================================================
   ZPRÁVY CHT / CHYBOŽROUT
========================================================== */

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
            .postMessage(
              payload
            );
        }
      };


    /* ------------------------------------------------------
       NOVÝ WORKER OKAMŽITĚ AKTIVOVAT
    ------------------------------------------------------ */

    if (
      data.type ===
      "SKIP_WAITING"
    ) {

      self.skipWaiting();

      return;
    }


    /* ------------------------------------------------------
       SMAZAT CHT CACHE
    ------------------------------------------------------ */

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


    /* ------------------------------------------------------
       OBNOVIT KONKRÉTNÍ SOUBORY
    ------------------------------------------------------ */

    if (
      data.type ===
      "CHYBOZROUT_REFRESH_URLS"
    ) {

      event.waitUntil(
        refreshUrls(
          Array.isArray(
            data.urls
          )
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


    /* ------------------------------------------------------
       STAV CACHE
    ------------------------------------------------------ */

    if (
      data.type ===
      "CHYBOZROUT_STATUS"
    ) {

      event.waitUntil(
        caches
          .open(
            CACHE_NAME
          )
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
                  keys.length,
                offline:
                  true
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


    /* ------------------------------------------------------
       PŘIPRAVIT CELÉ CHT OFFLINE
    ------------------------------------------------------ */

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
                cacheName:
                  CACHE_NAME,
                ...result
              })
          )
          .catch(
            error =>
              reply({
                ok: false,
                action:
                  "offline-failed",
                error:
                  String(error)
              })
          )
      );
    }
  }
);


/* ==========================================================
   CHT 360°‰.
   OFFLINE VRSTVA PŘIPRAVENA
========================================================== */