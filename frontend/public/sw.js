// Metropolitan Capital & Trust Bank — Service Worker
// Strategy: cache-first for static assets, network-first for API/navigation

const SW_VERSION  = '1.1.0';
const CACHE_NAME  = 'mct-bank-v2';
const OFFLINE_URL = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ── Install: precache shell ───────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API calls → network-first, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ status: 'error', message: 'You are offline' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    );
    return;
  }

  // Navigation requests → network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh shell
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets (JS/CSS/images/fonts) → cache-first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});

// ── Message handler — version queries and skip-waiting from debug panel ───────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION, cacheName: CACHE_NAME });
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Push notifications (stub — ready for backend integration) ─────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: 'MCT Bank', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'MCT Bank', {
      body:  data.body  || data.message || '',
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      data:  data.url ? { url: data.url } : undefined,
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
