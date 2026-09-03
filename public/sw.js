const CACHE_NAME = "gym-tracker-v1";
const APP_SHELL = ["/", "/dashboard"];

// Required for Chrome/Android's "installable" criteria (a fetch handler
// must exist) and gives a minimal offline app-shell boot, same idea as
// Roady's service worker but without the push-notification listeners —
// this app doesn't have web push yet.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network-first for page navigations, so a shipped fix always shows up for
// anyone with the app already installed — only falls back to the cached
// shell when the network is unreachable. Everything else (API/data calls)
// is left alone entirely; those must never be served stale from a cache.
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () => caches.match("/dashboard").then((cached) => cached ?? caches.match("/")),
      ),
    );
  }
});
