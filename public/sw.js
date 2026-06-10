// Service worker mínimo para habilitar la instalación (PWA).
// Solo cachea assets estáticos (inmutables); los datos, la API y el login pasan directo.
const CACHE = "quiniela-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first solo para estáticos (assets de Next, banderas, íconos, manifest).
  const esEstatico =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/img/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname === "/manifest.webmanifest";
  if (!esEstatico) return;

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    })(),
  );
});
