"use strict";
const CACHE = "vafit-sklad-pwa-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "../docs/icon.svg"];
self.addEventListener("install",event => {event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith("vafit-sklad-pwa-")&&key!==CACHE)await caches.delete(key);}await self.clients.claim();})());});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const u=new URL(event.request.url);if(u.origin!==self.location.origin)return;
if(event.request.mode==="navigate"){
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(async()=>await caches.match(event.request)||await caches.match("./index.html")||Response.error()));
  return;
}
event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok&&u.pathname.startsWith(new URL("./",self.registration.scope).pathname)){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;})));});
