"use strict";
const CACHE="vaf-grid95-memory-v1";
const FILES=["./","./index.html","./app.js","./seed.json","./manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin||!u.pathname.includes("/grid95-pamet/"))return;
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
  if(r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));}
  return r;
 }).catch(()=>caches.match("./index.html"))));
});