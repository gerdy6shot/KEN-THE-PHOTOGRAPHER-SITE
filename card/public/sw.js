// ==========================================================================
// KENNY HARRIS DIGITAL BUSINESS CARD — SERVICE WORKER
// Strict Scope: /card/ (No interference with root photography site)
// ==========================================================================

const CACHE_NAME = 'kenny-card-shell-v2';

// Essential card shell assets cached upon install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './apple-touch-icon.png',
  './icon-192x192.png',
  './icon-512x512.png',
  './icon-maskable-512x512.png',
  './assets/ktp-camera-emblem.png',
  './assets/kenny-portrait.webp',
  './assets/kenny-presentation.webp',
  './assets/ktp-gold-emblem.png',
  './assets/ken-the-photographer-logo.png',
];

// Install: Precache shell assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual cache puts so a single missing optional asset does not abort the install
      return Promise.all(
        PRECACHE_ASSETS.map((asset) => {
          return fetch(asset, { cache: 'no-cache' })
            .then((res) => {
              if (res.ok) {
                return cache.put(asset, res);
              }
            })
            .catch(() => {
              // Non-critical asset failure does not break install
            });
        })
      );
    })
  );
});

// Activate: Clean up previous versioned caches and take control of all card clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('kenny-card-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strictly scoped to /card/
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1. Only intercept GET requests
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // 2. Only intercept same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. STRICT SCOPING: Only handle requests targeting the digital business card
  // Never intercept main website routes (/, /admin.html, /archive-data.js, /app.js, /site-config.js)
  const isCardPath = url.pathname.startsWith('/card/') || url.pathname === '/card';
  const isCardDomain = url.hostname === 'card.kenthephotographer.com';

  if (!isCardPath && !isCardDomain) {
    return;
  }

  // 4. HTML Navigation requests (opening or refreshing the card)
  // Strategy: Network-first, fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.ok) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, resClone);
              // Also update index.html in cache
              cache.put('./index.html', networkRes.clone());
            });
          }
          return networkRes;
        })
        .catch(async () => {
          // Offline fallback
          const cached = (await caches.match(req)) || (await caches.match('./index.html')) || (await caches.match('./'));
          if (cached) return cached;
          return new Response('Kenny Harris Digital Card is offline.', {
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // 5. Version-hashed static assets (/assets/*)
  // Strategy: Cache-first, fallback to network and cache
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((networkRes) => {
          if (networkRes.ok) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 6. Other static card files (manifest, icons, images)
  // Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes.ok) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Message listener for client coordination
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
