const CACHE='aetheros-v2.0.7-equal-columns';
const MEDIA_CACHE='aetheros-gymvisual-v1';
const CORE=['./','./index.html','./manifest.json','./css/aetheros.css','./icons/aetheros-192.png','./icons/aetheros-512.png','./js/routine-data.js','./js/tracker-store.js','./js/exercise-animations.js','./js/app.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key!==MEDIA_CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 const isExerciseAsset=(url.hostname==='raw.githubusercontent.com'&&url.pathname.startsWith('/hasaneyldrm/exercises-dataset/main/'))||(['gymvisual.com','www.gymvisual.com'].includes(url.hostname)&&url.pathname.endsWith('.gif'));
 if(url.origin!==self.location.origin&&!isExerciseAsset)return;
 const targetCache=isExerciseAsset?MEDIA_CACHE:CACHE;
 event.respondWith(caches.open(targetCache).then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;try{const response=await fetch(event.request);if(response&&(response.ok||response.type==='opaque'))cache.put(event.request,response.clone()).catch(()=>{});return response}catch(error){if(isExerciseAsset)throw error;const fallback=await caches.match('./index.html');if(fallback)return fallback;throw error}}));
});
