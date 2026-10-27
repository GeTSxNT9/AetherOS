/* AetherOS · service worker (modo sin conexión).
 * Al publicar cambios en la app, sube el número de CACHE_VERSION para que los móviles
 * descarguen los archivos nuevos. */
const CACHE_VERSION = '2.6.1';
const CACHE = `aetheros-v${CACHE_VERSION}`;
const MEDIA_CACHE = 'aetheros-gymvisual-v1'; // GIF de ejercicios; debe coincidir con exercise-animations.js
const CORE = [
  './', './index.html', './manifest.json', './css/aetheros.css',
  './icons/aetheros-192.png', './icons/aetheros-512.png',
  './js/routine-data.js', './js/tracker-store.js', './js/exercise-animations.js', './js/app.js'
];

const isExerciseAsset = url =>
  (url.hostname === 'raw.githubusercontent.com' && url.pathname.startsWith('/hasaneyldrm/exercises-dataset/main/')) ||
  (['gymvisual.com', 'www.gymvisual.com'].includes(url.hostname) && url.pathname.endsWith('.gif'));

self.addEventListener('install', event => {
  // cache: 'reload' evita que se guarde una copia antigua que el navegador tuviera en su caché HTTP.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE.map(path => new Request(path, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE && key !== MEDIA_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Estrategia: primero la copia guardada; si no existe, red (y se guarda para la próxima vez).
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const exerciseAsset = isExerciseAsset(url);
  if (url.origin !== self.location.origin && !exerciseAsset) return;

  event.respondWith(caches.open(exerciseAsset ? MEDIA_CACHE : CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response && (response.ok || response.type === 'opaque')) cache.put(event.request, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      if (exerciseAsset) throw error;
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
      throw error;
    }
  }));
});
