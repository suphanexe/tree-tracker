/**
 * Smart Tree Tracker - Service Worker
 * Provides offline support and app installability (PWA)
 * 
 * Strategy: Cache-first for static assets, network-first for dynamic content
 * The app uses localStorage so once the UI is cached, it works fully offline.
 */

const CACHE_NAME = 'smart-tree-tracker-v1';

// Static assets to cache on install (app shell)
const STATIC_ASSETS = [
  './',
  './index.html',
  './admin.html',
  './style.css',
  './app.js',
  './admin.js',
  './db.js',
  './firebase-config.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// CDN scripts to cache (cached individually so one failure doesn't block install)
const CDN_ASSETS = [
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// ===== Install: Cache app shell =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] App shell cached, now caching CDN assets...');
        // Cache CDN assets individually so one failure doesn't block install
        return caches.open(CACHE_NAME).then((cache) => {
          return Promise.allSettled(
            CDN_ASSETS.map((url) =>
              cache.add(url).catch((err) => {
                console.warn('[SW] Failed to cache CDN asset:', url, err.message);
              })
            )
          );
        });
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Cache install error:', error);
        // Still activate - some caching is better than none
      })
  );
});

// ===== Activate: Clean old caches =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removing old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activated - ready to handle fetches');
      return self.clients.claim();
    })
  );
});

// ===== Fetch: Cache-first for static, network-first for rest =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from our origin and the QR scanner CDN
  const isOurOrigin = url.origin === self.location.origin;
  const isQrCdn = url.href.startsWith('https://unpkg.com/html5-qrcode');

  if (!isOurOrigin && !isQrCdn) {
    return; // Let the browser handle other requests normally
  }

  // For static assets (CSS, JS, images, fonts) - Cache-first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For HTML pages - Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // For everything else - Network-first
  event.respondWith(networkFirstWithCacheFallback(request));
});

// ===== Helper: Check if request is for a static asset =====
function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = [
    '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.webp', '.ico', '.woff', '.woff2', '.ttf', '.json'
  ];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// ===== Strategy: Cache-first =====
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // For CDN scripts, return a fallback if offline
    if (request.url.includes('unpkg.com')) {
      console.warn('[SW] CDN unavailable offline, QR scanner disabled');
    }
    throw error;
  }
}

// ===== Strategy: Network-first with cache fallback =====
async function networkFirstWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // For navigation requests, return the cached index.html
    if (request.mode === 'navigate') {
      const fallbackPage = await caches.match('./index.html');
      if (fallbackPage) {
        return fallbackPage;
      }
    }
    throw error;
  }
}

// ===== (Future) Background Sync placeholder =====
// self.addEventListener('sync', (event) => { ... });

// ===== (Future) Push Notification placeholder =====
// self.addEventListener('push', (event) => { ... });
// self.addEventListener('notificationclick', (event) => { ... });

console.log('[SW] Smart Tree Tracker Service Worker loaded');
