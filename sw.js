/* Jack's Potion Lab - Service Worker v1.0 */
const CACHE = 'potion-lab-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/css/shared/design-system.css',
  '/css/game.css',
  '/js/otb-config.js',
  '/js/ecosystem.js',
  '/js/main.js',
  '/js/engine.js',
  '/js/audio.js',
  '/js/progress.js',
  '/data/potions.js',
  '/assets/bg-splash.png',
  '/assets/bg-room1.png',
  '/assets/bg-room2.png',
  '/assets/bg-room3.png',
  '/assets/bg-room4.png',
  '/assets/bg-room5.png',
  '/assets/bg-room6.png',
  '/assets/bg-room7.png',
  '/assets/bg-room8.png',
  '/assets/bg-room9.png',
  '/assets/bg-room10.png',
  '/assets/bg-room11.png',
  '/assets/bg-room12.png',
  '/assets/bg-room13.png',
  '/assets/bg-room14.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    })).catch(() => caches.match('/index.html'))
  );
});
