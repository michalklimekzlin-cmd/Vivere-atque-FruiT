// === Vivere atque FruiT — Service Worker ===
// Umožňuje fungování offline + načítání pod-aplikací (VAFT-*)

const CACHE_NAME = "vaft-cache-v1";

// 🗂️ Seznam souborů, které se uloží do zařízení (cache)
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./src/engine.js",
  "./src/app.js",
  "./src/teams.js",
  "./src/vaft.core.js",
  "./src/vaft.loader.js",
  "./src/vaft.heartbeat.js",
  "./src/vaft.kernel.js",
  "./src/vaft.bridge.js",

  // 💮 Lilie (samostatná appka)
  "./VAFT-Lilies/index.html",
  "./VAFT-Lilies/manifest.json",

  // 📦 připraveno i pro další mini-apky:
  // "./VAFT-Lady/index.html",
  // "./VAFT-Lady/manifest.json",
  // "./VAFT-GhostGirl/index.html",
  // "./VAFT-GhostGirl/manifest.json",
];

// 🪣 Instalace service workeru — uložíme všechny soubory
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[VAFT] Ukládám soubory do cache...");
      return cache.addAll(ASSETS);
    })
  );
});

// ♻️ Aktivace — smažeme staré verze cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  console.log("[VAFT] Service worker aktivní ✅");
});

// 📡 Intercept všech fetch požadavků
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Pokud je v cache → použij ji, jinak stáhni ze sítě
      return (
        response ||
        fetch(event.request).catch(() => {
          console.warn("[VAFT] Offline režim — soubor nenalezen:", event.request.url);
          return new Response("⚠️ Offline — soubor není v cache.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        })
      );
    })
  );
});
