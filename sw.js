const CACHE='alpha-track-v2.1.0';
const MEDIA_CACHE='alpha-track-gymvisual-v1';
const CORE=['./','./index.html','./manifest.json','./css/alpha-track.css','./js/routine-data.js','./js/tracker-store.js','./js/exercise-animations.js','./js/app.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>![CACHE,MEDIA_CACHE].includes(key)).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 const isGymVisualAsset=url.hostname==='raw.githubusercontent.com' && url.pathname.startsWith('/hasaneyldrm/exercises-dataset/main/');
 if(url.origin!==self.location.origin && !isGymVisualAsset)return;
 const targetCache=isGymVisualAsset?MEDIA_CACHE:CACHE;
 event.respondWith(caches.open(targetCache).then(async cache=>{
   const cached=await cache.match(event.request);
   if(cached)return cached;
   try {
     const response=await fetch(event.request);
     if(response && (response.ok || response.type==='opaque')) cache.put(event.request,response.clone()).catch(()=>{});
     return response;
   } catch(error) {
     if(isGymVisualAsset) throw error;
     const fallback=await caches.match('./index.html');
     if(fallback)return fallback;
     throw error;
   }
 }));
});
