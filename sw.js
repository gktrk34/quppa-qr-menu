/* QUPPA QR Menu - Service Worker
   Stage 3: Offline/PWA cache strategy
   Version: 2.6.3
*/

const APP_VERSION = "2.6.3";
const STATIC_CACHE = `quppa-static-${APP_VERSION}`;
const IMAGE_CACHE = `quppa-images-${APP_VERSION}`;
const RUNTIME_CACHE = `quppa-runtime-${APP_VERSION}`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=2.6.3",
  "./app.js?v=2.6.3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("quppa-") && ![STATIC_CACHE, IMAGE_CACHE, RUNTIME_CACHE].includes(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (request.destination === "style" || request.destination === "script" || request.destination === "font") {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put("./index.html", response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match("./index.html") || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);

    if (response && (response.ok || response.type === "opaque")) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    if (request.destination === "image") {
      return offlineImageFallback();
    }

    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(response => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

function offlineImageFallback() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#a86e37"/>
          <stop offset="1" stop-color="#2f725f"/>
        </linearGradient>
      </defs>
      <rect width="900" height="900" fill="url(#g)"/>
      <circle cx="450" cy="390" r="150" fill="rgba(255,255,255,.16)"/>
      <text x="450" y="610" text-anchor="middle" font-family="Arial,sans-serif" font-size="70" font-weight="900" fill="#fffaf4">QUPPA</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store"
    }
  });
}
