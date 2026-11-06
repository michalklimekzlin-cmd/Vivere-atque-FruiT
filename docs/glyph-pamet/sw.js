const PREFIX='cht360-glyph-memory-',CACHE=PREFIX+'v2.0.0-250994b160';
const FILES=['./','./index.html','./styles.css','./app.js','./model.js','./storage.js','./grok/parse.js','./grok/text.js','./grok/worlds.js','./vendor/jszip.min.js','./manifest.webmanifest','./icon.svg','./icon-180.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith(PREFIX)&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
  e.respondWith(caches.open(CACHE).then(async cache=>{
    const hit=await cache.match(e.request,{ignoreSearch:true});if(hit)return hit;
    try{const response=await fetch(e.request);if(response.ok)await cache.put(e.request,response.clone());return response;}
    catch(err){if(e.request.mode==='navigate')return await cache.match('./index.html');throw err;}
  }));
});
