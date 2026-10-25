// ============================================================
// SafePath Indore — Production Service Worker v2
// Team The Riser | BGI Hackathon 2026
//
// Strategies:
//   - App shell  → Cache-first (instant loads)
//   - API calls  → Network-first with cache fallback
//   - Static assets → Stale-while-revalidate
//   - Maps/tiles → Cache-first with 7-day expiry
//   - Push notifications → Full FCM integration ready
//   - Background sync → Queued SOS alerts when offline
// ============================================================

const APP_VERSION    = 'v2.0.0';
const CACHE_SHELL    = `safepath-shell-${APP_VERSION}`;
const CACHE_RUNTIME  = `safepath-runtime-${APP_VERSION}`;
const CACHE_MAPS     = `safepath-maps-${APP_VERSION}`;
const CACHE_OFFLINE  = `safepath-offline-${APP_VERSION}`;
const SYNC_SOS_TAG   = 'safepath-sos-sync';
const SYNC_CHECKIN_TAG = 'safepath-checkin-sync';

// ── App shell files to precache on install ────────────────────────────────
const SHELL_URLS = [
  '/',
  '/home',
  '/routes',
  '/journey',
  '/sos',
  '/guardian',
  '/settings',
  '/onboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Offline fallback HTML ─────────────────────────────────────────────────
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>SafePath — Offline</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0f1a;color:#e2e8f0;font-family:'DM Sans',system-ui,sans-serif;
         display:flex;flex-direction:column;align-items:center;justify-content:center;
         height:100vh;text-align:center;padding:24px}
    .logo{font-family:system-ui,sans-serif;font-size:32px;font-weight:800;color:#14b8a6;margin-bottom:8px}
    .sub{font-size:14px;color:#64748b;margin-bottom:32px}
    .card{background:#1a2234;border:1px solid #1e293b;border-radius:16px;padding:24px;max-width:320px;width:100%;margin-bottom:20px}
    .card h2{font-size:18px;font-weight:700;margin-bottom:8px}
    .card p{font-size:13px;color:#94a3b8;line-height:1.6}
    .sos{background:#ef4444;color:#fff;border:none;border-radius:12px;padding:14px 24px;
         font-size:15px;font-weight:700;cursor:pointer;width:100%;margin-bottom:10px}
    .tip{font-size:11px;color:#475569;line-height:1.5}
  </style>
</head>
<body>
  <div class="logo">🛡 SafePath</div>
  <div class="sub">Indore · You are offline</div>
  <div class="card">
    <h2>No internet connection</h2>
    <p>Basic safety features still work. Your last-cached routes and profile are available. SOS alerts will be sent when you reconnect.</p>
  </div>
  <button class="sos" onclick="window.location.href='/sos'">Open SOS Emergency</button>
  <button onclick="window.location.reload()" style="background:transparent;color:#14b8a6;border:1px solid #14b8a6;border-radius:10px;padding:10px 20px;font-size:14px;cursor:pointer;width:100%;margin-bottom:16px">
    Try Again
  </button>
  <div class="tip">📍 Your profile and emergency contacts are stored offline.<br/>SOS button works without internet — alerts queue and send when online.</div>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────
// INSTALL — precache app shell
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`[SW ${APP_VERSION}] Installing…`);
  event.waitUntil(
    Promise.all([
      // Cache app shell
      caches.open(CACHE_SHELL).then(async (cache) => {
        try {
          await cache.addAll(SHELL_URLS);
          console.log(`[SW] Shell cached (${SHELL_URLS.length} URLs)`);
        } catch (err) {
          // Cache what we can — don't fail install over one URL
          for (const url of SHELL_URLS) {
            try { await cache.add(url); } catch { /* skip */ }
          }
        }
      }),
      // Cache offline fallback
      caches.open(CACHE_OFFLINE).then((cache) =>
        cache.put('/__offline', new Response(OFFLINE_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }))
      ),
    ]).then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────────────────────────────────────────────
// ACTIVATE — purge old caches
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log(`[SW ${APP_VERSION}] Activating…`);
  const VALID_CACHES = [CACHE_SHELL, CACHE_RUNTIME, CACHE_MAPS, CACHE_OFFLINE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => !VALID_CACHES.includes(k))
          .map((k) => {
            console.log(`[SW] Deleting old cache: ${k}`);
            return caches.delete(k);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────────────────────────────────
// FETCH — multi-strategy routing
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and same-site POST requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.hostname === 'api.anthropic.com') return;

  // ── 1. Next.js internals & HMR → network only ─────────────────────────
  if (url.pathname.startsWith('/_next/webpack-hmr') ||
      url.pathname.startsWith('/__nextjs')) {
    return;
  }

  // ── 2. Mapbox tiles → cache-first, 7-day TTL ──────────────────────────
  if (url.hostname.includes('mapbox.com') ||
      url.hostname.includes('tiles.mapbox') ||
      url.hostname.includes('api.mapbox')) {
    event.respondWith(cacheFirstWithExpiry(request, CACHE_MAPS, 7 * 86400));
    return;
  }

  // ── 3. Firebase / API calls → network-first with cache fallback ────────
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // ── 4. Static assets (_next/static) → stale-while-revalidate ──────────
  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_RUNTIME));
    return;
  }

  // ── 5. Navigation requests → cache-first, offline fallback ────────────
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // ── 6. Everything else → network with runtime cache ───────────────────
  event.respondWith(networkFirstWithFallback(request));
});

// ─────────────────────────────────────────────────────────────────────────
// STRATEGY IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────

/** Cache-first: serve from cache, fall back to network. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/** Cache-first with expiry TTL (seconds). Stores Date header for comparison. */
async function cacheFirstWithExpiry(request, cacheName, ttlSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const dateHeader = cached.headers.get('sw-cache-date');
    if (dateHeader) {
      const age = (Date.now() - new Date(dateHeader).getTime()) / 1000;
      if (age < ttlSeconds) return cached;
    } else {
      return cached; // no date header → treat as fresh
    }
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      const cloned = new Response(await response.clone().arrayBuffer(), { status: response.status, statusText: response.statusText, headers });
      cache.put(request, cloned);
    }
    return response;
  } catch {
    return cached || new Response('Offline', { status: 503 });
  }
}

/** Network-first: try network, fall back to cache, then offline page. */
async function networkFirstWithFallback(request) {
  const cache = await caches.open(CACHE_RUNTIME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', queued: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Stale-while-revalidate: return cache immediately, update in background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached || fetchPromise;
}

/** Navigation handler: shell first, offline fallback. */
async function navigationHandler(request) {
  try {
    // Try network
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_SHELL);
      cache.put(request, response.clone());
      return response;
    }
  } catch { /* offline */ }

  // Try shell cache
  const shellCache = await caches.open(CACHE_SHELL);
  const cached = await shellCache.match(request) || await shellCache.match('/');
  if (cached) return cached;

  // Last resort: offline page
  const offlineCache = await caches.open(CACHE_OFFLINE);
  return await offlineCache.match('/__offline') || new Response('Offline', { status: 503 });
}

// ─────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS (Firebase Cloud Messaging)
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { title: 'SafePath Alert', body: event.data?.text() }; }

  const {
    title = 'SafePath',
    body  = 'You have a safety alert.',
    icon  = '/icons/icon-192.png',
    badge = '/icons/icon-72.png',
    url   = '/home',
    type  = 'general',   // 'sos' | 'checkin' | 'deviation' | 'general'
    urgency = 'normal',  // 'low' | 'normal' | 'high'
  } = data;

  const vibrate = type === 'sos'
    ? [200, 100, 200, 100, 200, 100, 600]
    : type === 'deviation'
    ? [300, 150, 300]
    : [200, 100, 200];

  const actions = type === 'sos'
    ? [{ action: 'call', title: '📞 Call Police' }, { action: 'view', title: '📍 View Location' }]
    : type === 'checkin'
    ? [{ action: 'safe', title: '✅ I\'m Safe' }, { action: 'sos', title: '🚨 Activate SOS' }]
    : [{ action: 'view', title: 'View' }, { action: 'dismiss', title: 'Dismiss' }];

  const options = {
    body,
    icon,
    badge,
    vibrate,
    actions,
    tag: `safepath-${type}-${Date.now()}`,
    requireInteraction: urgency === 'high',
    silent: false,
    timestamp: Date.now(),
    data: { url, type },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─────────────────────────────────────────────────────────────────────────
// NOTIFICATION CLICK
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url, type } = event.notification.data || {};
  const action = event.action;

  let navigateTo = url || '/home';
  if (action === 'call')    navigateTo = 'tel:100';
  if (action === 'view')    navigateTo = url || '/guardian';
  if (action === 'safe')    navigateTo = '/journey';
  if (action === 'sos')     navigateTo = '/sos';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: navigateTo });
          return;
        }
      }
      // Open new window
      if (navigateTo.startsWith('tel:')) return; // can't open tel: in SW
      if (clients.openWindow) return clients.openWindow(navigateTo);
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────
// BACKGROUND SYNC — queue SOS alerts & check-ins for offline dispatch
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  console.log(`[SW] Background sync: ${event.tag}`);

  if (event.tag === SYNC_SOS_TAG) {
    event.waitUntil(flushQueuedSOS());
  }

  if (event.tag === SYNC_CHECKIN_TAG) {
    event.waitUntil(flushQueuedCheckIns());
  }
});

async function flushQueuedSOS() {
  // Retrieve queued SOS alerts from IndexedDB / cache
  // TODO: integrate with Zustand-persisted store or IndexedDB
  const cache = await caches.open(CACHE_RUNTIME);
  const queued = await cache.match('/__sos-queue');
  if (!queued) return;

  try {
    const alerts = await queued.json();
    for (const alert of alerts) {
      await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    }
    await cache.delete('/__sos-queue');
    console.log(`[SW] Flushed ${alerts.length} queued SOS alerts`);

    // Notify user
    await self.registration.showNotification('SafePath — SOS Sent', {
      body: 'Your emergency alerts were delivered now that you\'re back online.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [200, 100, 200],
    });
  } catch (err) {
    console.error('[SW] Failed to flush SOS queue:', err);
  }
}

async function flushQueuedCheckIns() {
  // TODO: same pattern for check-in confirmations
  console.log('[SW] Flushing queued check-ins…');
}

// ─────────────────────────────────────────────────────────────────────────
// PERIODIC BACKGROUND SYNC — refresh safety data
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'safepath-safety-data') {
    event.waitUntil(refreshSafetyData());
  }
});

async function refreshSafetyData() {
  // TODO: fetch updated risk zone data from Firestore
  console.log('[SW] Periodic sync: refreshing safety data');
}

// ─────────────────────────────────────────────────────────────────────────
// MESSAGE — handle commands from the app
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_ROUTE':
      // Manually cache a specific URL (e.g., route map tiles)
      caches.open(CACHE_MAPS).then(cache => cache.add(payload.url)).catch(() => {});
      break;

    case 'QUEUE_SOS':
      // Queue an SOS alert for background sync when offline
      queueSOSAlert(payload);
      break;

    case 'GET_VERSION':
      event.source?.postMessage({ type: 'VERSION', version: APP_VERSION });
      break;

    case 'CLEAR_CACHES':
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => {
        event.source?.postMessage({ type: 'CACHES_CLEARED' });
      });
      break;

    default:
      break;
  }
});

async function queueSOSAlert(alert) {
  try {
    const cache = await caches.open(CACHE_RUNTIME);
    const existing = await cache.match('/__sos-queue');
    const queue = existing ? await existing.json() : [];
    queue.push({ ...alert, queuedAt: new Date().toISOString() });
    await cache.put('/__sos-queue', new Response(JSON.stringify(queue), {
      headers: { 'Content-Type': 'application/json' },
    }));
    // Register for background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register(SYNC_SOS_TAG);
    }
    console.log(`[SW] SOS alert queued (${queue.length} total)`);
  } catch (err) {
    console.error('[SW] Failed to queue SOS alert:', err);
  }
}

console.log(`[SW] SafePath Service Worker ${APP_VERSION} loaded`);
