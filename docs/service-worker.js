"use strict";

/*
  CHT 360°‰. — OFFLINE SERVICE WORKER v11
  ========================================

  Cíl:
  - CHT startuje z cache i bez internetu.
  - index.html je povinně uložen.
  - lokální soubory jsou cache-first.
  - při Wi-Fi se cache tiše aktualizuje.
  - Paměť/localStorage se nemaže.
  - podporuje offline-cashe-assets.json.
  - podporuje ChyboŽrouta.
*/

const CACHE_PREFIX = "cht360-shared-";
const CACHE_NAME = `${CACHE_PREFIX}v11-iphone-offline`;

const OFFLINE_PAGE = "./index.html";
const OFFLINE_MANIFEST = "./offline-cashe-assets.json";


/* =========================================================
   ZÁKLADNÍ SOUBORY
   ========================================================= */

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./offline-cashe-assets.json",

  "./css/pamet.css",
  "./css/prstenec-pokojicku.css",
  "./css/revia-dock.css",

  "./batole-core.css",
  "./batole-core.js",

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

  "./js/cht-360-aplikace-2.js",

  "./js/cht-360-config.js",
  "./js/cht-360-navigation.js",
  "./js/cht-360-logger.js",
  "./js/cht-360-performance.js",
  "./js/cht-ui-components.js"
];


/* =========================================================
   URL
   ========================================================= */

function absoluteURL(path) {
  return new URL(
    path,
    self.registration.scope
  ).href;
}


/* =========================================================
   RESPONSE
   ========================================================= */

function isCacheable(response) {
  return Boolean(
    response &&
    (
      response.ok ||
      response.type === "opaque"
    )
  );
}


/* =========================================================
   OFFLINE MANIFEST
   ========================================================= */

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
        "HTTP " + response.status
      );
    }

    const manifest = await response.json();

    if (!Array.isArray(manifest.files)) {
      return [];
    }

    return manifest.files
      .map(file => String(file || "").trim())
      .filter(Boolean);

  } catch (error) {

    console.warn(
      "[CHT 360°‰.] Offline manifest se nepodařilo načíst.",
      error
    );

    return [];
  }
}


/* =========================================================
   ULOŽENÍ JEDNOHO SOUBORU
   ========================================================= */

async function cacheOne(cache, path) {

  const url = absoluteURL(path);

  try {

    const response = await fetch(
      url,
      {
        cache: "no-store"
      }
    );

    if (!isCacheable(response)) {
      throw new Error(
        "HTTP " + response.status
      );
    }

    await cache.put(
      url,
      response.clone()
    );

    return {
      path,
      ok: true
    };

  } catch (error) {

    /*
      Pokud už máme starší použitelnou kopii,
      ponecháme ji.
    */

    const existing = await cache.match(
      url,
      {
        ignoreSearch: true
      }
    );

    if (existing) {
      return {
        path,
        ok: true,
        existing: true
      };
    }

    console.warn(
      "[CHT 360°‰.] Nelze uložit offline:",
      path
    );

    return {
      path,
      ok: false
    };
  }
}


/* =========================================================
   PLNÁ OFFLINE CACHE
   ========================================================= */

async function precacheAll() {

  const cache = await caches.open(
    CACHE_NAME
  );

  const manifestFiles =
    await readOfflineManifest();

  const files = [
    ...new Set([
      ...CORE_FILES,
      ...manifestFiles
    ])
  ];


  /*
    Sekvenčně místo Promise.all.

    Na mobilním Safari je to stabilnější,
    zejména při větším počtu souborů.
  */

  const results = [];

  for (const file of files) {

    const result =
      await cacheOne(
        cache,
        file
      );

    results.push(result);
  }


  /*
    index.html MUSÍ existovat.
  */

  const indexURL =
    absoluteURL(OFFLINE_PAGE);

  const index =
    await cache.match(
      indexURL,
      {
        ignoreSearch: true
      }
    );

  if (!index) {
    throw new Error(
      "CHT 360°‰.: index.html není v offline cache."
    );
  }


  const successful =
    results.filter(
      result => result.ok
    ).length;

  const failed =
    results.filter(
      result => !result.ok
    ).length;


  console.log(
    "[CHT 360°‰.] OFFLINE READY:",
    successful,
    "/",
    results.length
  );


  return {
    total: results.length,
    successful,
    failed
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
        .then(() => {
          return self.skipWaiting();
        })
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
      (async () => {

        const cacheNames =
          await caches.keys();

        await Promise.all(
          cacheNames
            .filter(name => {
              return (
                name.startsWith(
                  CACHE_PREFIX
                ) &&
                name !== CACHE_NAME
              );
            })
            .map(name => {
              return caches.delete(name);
            })
        );


        /*
          Navigation preload vypneme.

          Chceme, aby offline navigaci
          řídil přímo náš worker.
        */

        if (
          self.registration
            .navigationPreload
        ) {
          try {
            await self.registration
              .navigationPreload
              .disable();
          } catch {
            /* není kritické */
          }
        }


        await self.clients.claim();

      })()
    );

  }
);


/* =========================================================
   CACHE LOOKUP
   ========================================================= */

async function findCached(request) {

  const cache =
    await caches.open(
      CACHE_NAME
    );


  /*
    Nejprve přesný request.
  */

  let response =
    await cache.match(
      request,
      {
        ignoreSearch: true
      }
    );

  if (response) {
    return response;
  }


  /*
    Potom absolutní URL.
  */

  try {

    response =
      await cache.match(
        new URL(
          request.url
        ).href,
        {
          ignoreSearch: true
        }
      );

    if (response) {
      return response;
    }

  } catch {
    /* pokračujeme */
  }


  return null;
}


/* =========================================================
   INDEX Z CACHE
   ========================================================= */

async function cachedIndex() {

  const cache =
    await caches.open(
      CACHE_NAME
    );

  const indexURL =
    absoluteURL(
      OFFLINE_PAGE
    );


  return cache.match(
    indexURL,
    {
      ignoreSearch: true
    }
  );

}


/* =========================================================
   TICHÁ AKTUALIZACE
   ========================================================= */

async function updateFromNetwork(request) {

  try {

    const response =
      await fetch(
        request,
        {
          cache: "no-store"
        }
      );

    if (!isCacheable(response)) {
      return null;
    }

    const cache =
      await caches.open(
        CACHE_NAME
      );

    await cache.put(
      request,
      response.clone()
    );

    return response;

  } catch {

    return null;

  }
}


/* =========================================================
   NAVIGACE
   ========================================================= */

async function handleNavigation(
  event
) {

  const request =
    event.request;


  /*
    1. Zkusíme přesnou stránku z cache.
  */

  const cached =
    await findCached(
      request
    );

  if (cached) {

    /*
      Jsme-li online, na pozadí ji
      aktualizujeme.

      waitUntil zabrání ukončení workeru
      před dokončením aktualizace.
    */

    event.waitUntil(
      updateFromNetwork(
        request
      )
    );

    return cached;
  }


  /*
    2. Když přesná cesta není v cache,
       zkusíme síť.
  */

  const network =
    await updateFromNetwork(
      request
    );

  if (network) {
    return network;
  }


  /*
    3. Bez internetu vrátíme hlavní
       index CHT.
  */

  const fallback =
    await cachedIndex();

  if (fallback) {
    return fallback;
  }


  /*
    Sem bychom se při správné instalaci
    vůbec neměli dostat.
  */

  return new Response(
    `<!doctype html>
     <html lang="cs">
       <head>
         <meta charset="utf-8">
         <meta name="viewport"
               content="width=device-width,initial-scale=1">
         <title>CHT 360°‰.</title>
       </head>
       <body style="
         margin:0;
         min-height:100vh;
         display:grid;
         place-items:center;
         background:#090705;
         color:#ffe2ad;
         font-family:system-ui;
         text-align:center;
       ">
         <main>
           <h1>CHT 360°‰.</h1>
           <p>Offline start nebyl dokončen.</p>
         </main>
       </body>
     </html>`,
    {
      status: 503,
      headers: {
        "Content-Type":
          "text/html; charset=utf-8"
      }
    }
  );
}


/* =========================================================
   LOKÁLNÍ SOUBORY
   ========================================================= */

async function handleLocalAsset(
  event
) {

  const request =
    event.request;


  /*
    CACHE FIRST.
  */

  const cached =
    await findCached(
      request
    );

  if (cached) {

    event.waitUntil(
      updateFromNetwork(
        request
      )
    );

    return cached;
  }


  /*
    Soubor ještě nemáme.
    Zkusíme síť a rovnou jej uložíme.
  */

  const network =
    await updateFromNetwork(
      request
    );

  if (network) {
    return network;
  }


  return new Response(
    "",
    {
      status: 504,
      statusText:
        "CHT offline asset unavailable"
    }
  );
}


/* =========================================================
   FETCH
   ========================================================= */

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


    /*
      Range requesty necháváme systému.
  */

    if (
      request.headers.has(
        "range"
      )
    ) {
      return;
    }


    const url =
      new URL(
        request.url
      );


    /*
      Cizí API / weby neinterceptujeme.

      CHT offline část je postavená
      z vlastních lokálních souborů.
    */

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }


    /*
      HTML navigace.
    */

    if (
      request.mode ===
      "navigate"
    ) {

      event.respondWith(
        handleNavigation(
          event
        )
      );

      return;
    }


    /*
      CSS / JS / JSON / SVG / ostatní
      lokální soubory.
    */

    event.respondWith(
      handleLocalAsset(
        event
      )
    );

  }
);


/* =========================================================
   SMAZÁNÍ CACHE
   ========================================================= */

async function clearOwnCaches() {

  const names =
    await caches.keys();

  await Promise.all(
    names
      .filter(name => {
        return name.startsWith(
          CACHE_PREFIX
        );
      })
      .map(name => {
        return caches.delete(
          name
        );
      })
  );

}


/* =========================================================
   REFRESH URL
   ========================================================= */

async function refreshUrls(
  urls
) {

  const cache =
    await caches.open(
      CACHE_NAME
    );

  const results = [];

  for (
    const rawURL
    of urls
  ) {

    try {

      const url =
        new URL(
          rawURL,
          self.registration.scope
        ).href;

      const response =
        await fetch(
          url,
          {
            cache: "no-store"
          }
        );

      if (
        !isCacheable(
          response
        )
      ) {
        throw new Error(
          "HTTP " +
          response.status
        );
      }

      await cache.put(
        url,
        response.clone()
      );

      results.push({
        url,
        ok: true
      });

    } catch (error) {

      results.push({
        url: rawURL,
        ok: false,
        error:
          String(error)
      });

    }

  }


  return results;
}


/* =========================================================
   MESSAGE / CHYBOŽROUT
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
            .postMessage(
              payload
            );

        }

      };


    /* -----------------------------------------
       Aktivovat nový worker.
       ----------------------------------------- */

    if (
      data.type ===
      "SKIP_WAITING"
    ) {

      event.waitUntil(
        self.skipWaiting()
      );

      return;
    }


    /* -----------------------------------------
       Stav cache.
       ----------------------------------------- */

    if (
      data.type ===
      "CHYBOZROUT_STATUS"
    ) {

      event.waitUntil(
        (async () => {

          try {

            const cache =
              await caches.open(
                CACHE_NAME
              );

            const keys =
              await cache.keys();

            const index =
              await cachedIndex();

            reply({
              ok: true,
              offline: true,
              cacheName:
                CACHE_NAME,
              entries:
                keys.length,
              indexCached:
                Boolean(index)
            });

          } catch (error) {

            reply({
              ok: false,
              error:
                String(error)
            });

          }

        })()
      );

      return;
    }


    /* -----------------------------------------
       Připravit plný OFFLINE.
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
              offline: true,
              cacheName:
                CACHE_NAME,
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

      return;
    }


    /* -----------------------------------------
       ChyboŽrout — refresh.
       ----------------------------------------- */

    if (
      data.type ===
      "CHYBOZROUT_REFRESH_URLS"
    ) {

      const urls =
        Array.isArray(
          data.urls
        )
          ? data.urls
          : [];

      event.waitUntil(
        refreshUrls(
          urls
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
       ChyboŽrout — smazání cache.
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

    }

  }
);