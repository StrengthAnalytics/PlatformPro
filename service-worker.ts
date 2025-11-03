// Define a cache name for our app
const CACHE_NAME = 'powerlifting-planner-v1';

// List of files to cache
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx', // This will be whatever the bundled JS file is named
  'https://aistudiocdn.com/react@^18.2.0',
  'https://aistudiocdn.com/react-dom@^18.2.0/client',
  'https://aistudiocdn.com/jspdf@^3.0.3'
];

// Install event: open a cache and add the files to it
// FIX: The `install` event is an `InstallEvent`. Cast event to `any` to access the `waitUntil` method.
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Fetch event: serve cached content when offline
// FIX: The `fetch` event is a `FetchEvent`. Cast event to `any` to access `respondWith` and `request`.
self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response from cache
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Activate event: remove old caches
// FIX: The `activate` event is an `ExtendableEvent`. Cast event to `any` to access the `waitUntil` method.
self.addEventListener('activate', (event: any) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});