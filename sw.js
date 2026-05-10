const CACHE_NAME = 'pomoshnik-v3-realtime-voice';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/utils.js',
  '/js/db.js',
  '/js/api.js',
  '/js/screens/home.js',
  '/js/screens/news.js',
  '/js/screens/sites.js',
  '/js/screens/profile.js',
  '/js/screens/answer.js',
  '/js/screens/auth.js',
  '/js/multimedia.js',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        console.log('Some assets could not be cached');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});
