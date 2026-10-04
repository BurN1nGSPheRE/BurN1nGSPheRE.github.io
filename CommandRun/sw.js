// BurN1nGSPheRE — Service Worker (Full PWA, offline-ready)
//
// หน้าเว็บ (navigate)  : network-first — ออนไลน์ได้ของใหม่เสมอ ออฟไลน์ใช้แคช
//   เดิมเป็น cache-first ทำให้คนที่เคยเข้าเห็นหน้าเก่าหนึ่งรอบทุกครั้งที่อัปของใหม่
//   ต้องรีเฟรชซ้ำถึงจะเห็น ซึ่งงงมากสำหรับคนใช้
// ไฟล์อื่น (รูป/สคริปต์): stale-while-revalidate — ขึ้นไวจากแคช แล้วอัปเดตเบื้องหลัง

const CACHE_NAME = 'burn1ngsphere-cache-v25';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './data.json',
  './reference.html',
  './manifest.json',
  './logo-yarmtuk.png',
  './logo-burning.png',
  './logo-burning-sm.png',
  './logo-burning-md.png',
  './favicon-32.png',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  '/assets/core.css',
  '/assets/engine.js'
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

  // หน้าเว็บ: ลองเน็ตก่อน ได้แล้วเก็บเข้าแคชไว้ใช้ตอนออฟไลน์
  // เน็ตล่มค่อยหยิบจากแคช ไม่มีแคชค่อยตกไปที่ index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
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
