var CACHE_NAME = 'sard-chocolate-v1';
var ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/checkout.html',
  '/confirmation.html',
  '/builder.html',
  '/style.css',
  '/data.js',
  '/script.js',
  '/firebase-config.js',
  '/logo.png',
  '/hero-bg.png',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Skip non-GET and API/Firestore requests
  if (event.request.method !== 'GET') return;
  var url = event.request.url;
  if (url.indexOf('firestore.googleapis.com') !== -1) return;
  if (url.indexOf('googleapis.com') !== -1) return;
  if (url.indexOf('/functions/') !== -1) return;
  if (url.indexOf('js.stripe.com') !== -1) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        // Return cached, but update in background
        fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, response);
            });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
