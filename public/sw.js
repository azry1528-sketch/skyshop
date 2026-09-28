/* SkyRide Store — service worker (PWA)
 * - Coquille de l'app disponible hors ligne
 * - Assets hashés (/assets/*) : cache d'abord
 * - Pages : réseau d'abord, repli sur la coquille en cache si hors ligne
 * - Requêtes cross-origin (Supabase, images externes…) et non-GET : jamais interceptées
 */
const VERSION = "skyride-v1";
const SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin")) return; // l'admin reste toujours en direct

  // Navigation (pages) : réseau d'abord, coquille en secours
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || Response.error()))
    );
    return;
  }

  // Assets statiques : cache d'abord, puis réseau (et mise en cache)
  if (url.pathname.startsWith("/assets/") || /\.(png|jpg|jpeg|webp|svg|woff2?|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
