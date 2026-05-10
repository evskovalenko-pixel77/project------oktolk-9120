// OkTolk Service Worker v2 - no cache
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) { return caches.delete(name); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request));
});
