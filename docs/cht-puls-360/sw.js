"use strict";
const CACHE="cht-puls-360-v3-kompost-tlacitka";
const FILES=[
  "./",
  "./index.html",
  "./style.css",
  "./style.css?v=kompost3",
  "./memory.js",
  "./memory.js?v=kompost3",
  "./app.js",
  "./app.js?v=kompost3",
  "./manifest.webmanifest",
  "./manifest.webmanifest?v=kompost3",
  "./sw.js"
];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("cht-puls-360-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(saved=>saved||caches.match("./index.html"))))});
