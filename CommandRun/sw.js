// BurN1nGSPheRE — Service Worker (Full PWA, offline-ready)
// Strategy: stale-while-revalidate. Serves from cache instantly (works fully
// offline), fetches an update in the background for the next load.

const CACHE_NAME = 'burn1ngsphere-cache-v21';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './reference.html',
  './manifest.json',
  './logo-yarmtuk.png',
  './logo-burning.png',
  './logo-burning-sm.png',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // don't fail the whole install if one optional asset 404s
      Promise.allSettled(ASSETS_TO_CACHE.map((u) => cache.add(u)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // For page navigations: try cache first, fall back to index.html when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).catch(() => caches.match('./index.html'))
      )
    );
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
