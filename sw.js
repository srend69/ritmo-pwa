/* Ritmo — service worker com cache versionado e funcionamento offline */
const VERSION = "1.0.0";
const CACHE_NAME = `ritmo-v${VERSION}-1`;
const INDEX_URL = new URL("./index.html", self.registration.scope).href;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./assets/js/core.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-192.png",
  "./assets/icons/maskable-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
  "./assets/icons/icon-1024.png",
  "./screenshots/hoje-390x844.png",
  "./screenshots/progresso-390x844.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const results = await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" }))
        )
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(
            `Ritmo: não foi possível pré-cachear ${PRECACHE_URLS[index]}.`,
            result.reason
          );
        }
      });
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("ritmo-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isSameOrigin(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
      cache.put(INDEX_URL, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    const cachedPage = await cache.match(request);
    if (cachedPage) return cachedPage;
    const fallback = await cache.match(INDEX_URL);
    if (fallback) return fallback;
    return new Response(
      "<!doctype html><meta charset=\"utf-8\"><title>Ritmo offline</title><p>O Ritmo ainda não está disponível offline. Conecte-se à internet e abra o app novamente.</p>",
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!isSameOrigin(request)) return;

  const url = new URL(request.url);
  if (url.pathname.endsWith("/sw.js")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  event.respondWith(
    cacheFirst(request).catch(() =>
      new Response("Recurso indisponível offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    )
  );
});
