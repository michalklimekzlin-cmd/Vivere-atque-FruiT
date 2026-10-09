/*
  Batolete – service-worker.js
  Offline-first PWA service worker
*/

"use strict";

const CACHE = "batolete-hub-v1";

const PRECACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./hub-menu.css",
  "./app.js",
  "./hub-loader.js",
  "./manifest.json",
  /* mini-app wrappers */
  "./mini-apps/1o1r.html",
  "./mini-apps/revia.html",
  "./mini-apps/revia-master.html",
  "./mini-apps/3d-ramecek.html",
  "./mini-apps/glyph-planet.html",
  "./mini-apps/glyph-planet-3d.html",
  "./mini-apps/glyph-editor.html",
  "./mini-apps/hlavoun.html",
  "./mini-apps/oblak.html",
  "./mini-apps/vaft-girls.html",
  "./mini-apps/vaft-bearhead.html",
  "./mini-apps/vaft-comet.html",
  "./mini-apps/chybozrout.html"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => {
        if (e.request.destination === "document") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
