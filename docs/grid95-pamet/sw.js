"use strict";
const CACHE="vaf-grid95-memory-v3-obsidian-fresh-entry";
const FILES=["./","./index.html","./app.js","./seed.json","./obsidian-v2.html","./app-obsidian-v2.js","./seed-obsidian-v2.json","./manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("vaf-grid95-memory-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin||!u.pathname.includes("/grid95-pamet/"))return;
 if (u.pathname.endsWith("/grid95-pamet/seed.json")) {
   e.respondWith(fetch(e.request).then(r=>{
     if(r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));}
     return r;
   }).catch(()=>caches.match(e.request)));
   return;
 }
 if(e.request.mode==="navigate" || /\/(?:app|app-obsidian-v2)\.js$/.test(u.pathname)) {
   e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{
     if(r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));}return r;
   }).catch(()=>caches.match(e.request).then(c=>c || caches.match("./obsidian-v2.html"))));
   return;
 }
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
  if(r.ok){const copy=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,copy));}
  return r;
 }).catch(()=>caches.match("./index.html"))));
});