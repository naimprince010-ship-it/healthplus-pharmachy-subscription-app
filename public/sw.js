const CACHE_NAME = 'halalzi-v3';
const STATIC_CACHE_NAME = 'halalzi-static-v3';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const CACHE_STRATEGIES = {
  networkFirst: ['/_next/', '/api/'],
  cacheFirst: ['/icons/', '/images/', '/_next/static/'],
  staleWhileRevalidate: ['/fonts/'],
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

function shouldUseNetworkFirst(url) {
  return CACHE_STRATEGIES.networkFirst.some((path) => url.includes(path));
}

function shouldUseCacheFirst(url) {
  return CACHE_STRATEGIES.cacheFirst.some((path) => url.includes(path));
}

function isNavigationRequest(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request).then((networkResponse) => {
    if (!networkResponse || !networkResponse.ok) {
      return networkResponse;
    }

    // Clone immediately before any other operation to avoid "body already used" error
    const responseToCache = networkResponse.clone();
    cache.put(request, responseToCache).catch((err) => {
      console.error('SW cache put failed:', err);
    });

    return networkResponse;
  }).catch((err) => {
    console.error('SW network fetch failed:', err);
    return cachedResponse || new Response('Offline', { status: 503 });
  });

  return cachedResponse || networkPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  if (request.method !== 'GET') {
    return;
  }

  if (url.includes('/api/') && !url.includes('/api/search')) {
    return;
  }

  // Force network-first for navigation/HTML requests (fixes iOS PWA update issues)
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (shouldUseNetworkFirst(url)) {
    event.respondWith(networkFirst(request));
  } else if (shouldUseCacheFirst(url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
