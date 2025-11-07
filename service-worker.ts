// Platform Coach PWA Service Worker
/// <reference lib="webworker" />

// Type definitions for service worker
interface WorkboxManifestEntry {
  url: string;
  revision: string | null;
}

// Extend ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;
declare const __WB_MANIFEST: WorkboxManifestEntry[];

const CACHE_NAME = 'platform-coach-v1';
const RUNTIME_CACHE = 'platform-coach-runtime-v1';

// Workbox manifest placeholder (will be replaced during build)
// @ts-ignore - __WB_MANIFEST is injected by vite-plugin-pwa
const manifest: WorkboxManifestEntry[] = self.__WB_MANIFEST || [];

// App Shell - Critical files to cache for offline functionality
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js',
  'https://aistudiocdn.com/react@^18.2.0',
  'https://aistudiocdn.com/react-dom@^18.2.0/client',
  'https://aistudiocdn.com/jspdf@^3.0.3',
  'https://aistudiocdn.com/jspdf-autotable@^3.8.2',
  ...manifest.map((entry: any) => entry.url) // Add build-time generated files
];

// Install event: Cache app shell
self.addEventListener('install', (event: any) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return (self as any).skipWaiting();
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event: any) => {
  console.log('[ServiceWorker] Activating...');
  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return (self as any).clients.claim();
    })
  );
});

// Helper function to determine if request is for an API
function isApiRequest(url: string): boolean {
  return url.includes('/api/') ||
         url.includes('api.') ||
         (url.includes('http') && !url.includes('cdn') && !url.includes('aistudiocdn'));
}

// Helper function to determine if request is for a static asset
function isStaticAsset(url: string): boolean {
  return url.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|ico)$/i) !== null ||
         url.includes('cdn.') ||
         url.includes('aistudiocdn.com');
}

// Cache-first strategy for static assets
async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    // Only cache valid responses
    if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If both cache and network fail, return offline page or error
    console.error('[ServiceWorker] Cache-first fetch failed:', error);
    throw error;
  }
}

// Network-first strategy for API calls
async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Fall back to cache if network fails
    const cached = await cache.match(request);
    if (cached) {
      console.log('[ServiceWorker] Network failed, serving from cache:', request.url);
      return cached;
    }
    console.error('[ServiceWorker] Network-first fetch failed:', error);
    throw error;
  }
}

// Fetch event: Apply appropriate caching strategy
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.startsWith('http')) {
    return;
  }

  // Apply appropriate caching strategy
  if (isApiRequest(url)) {
    // Network-first for API calls
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url) || url.endsWith('/') || url.includes('index.html')) {
    // Cache-first for static assets and app shell
    event.respondWith(cacheFirst(request));
  } else {
    // Default: try network first, fall back to cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
  }
});