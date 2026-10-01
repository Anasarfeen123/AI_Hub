// Service worker: makes the hub installable and readable offline.
//
//   App files (/assets/*)          cache first — their names change every build
//   Pages you've read, nav, roadmap network first, falling back to the last copy
//   Page navigations               network first, falling back to the app shell
//   Sign-in and everything else    never touched — always straight to the network
//
// Cached page data is members-only, so the app deletes it on sign-out.
const VERSION = "v1";
const SHELL = `aihub-shell-${VERSION}`;
const ASSETS = `aihub-assets-${VERSION}`;
const DATA = "aihub-data";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(["/", "/manifest.webmanifest", "/icon-192.png", "/favicon-32.png", "/theme-init.js"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("aihub-") && ![SHELL, ASSETS, DATA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Read-only API calls worth keeping for offline reading.
const READABLE = /^\/api\/(page|nav|roadmap|ratings|flags)(\?|$)|^\/api\/images\/|^\/auth\/me$/;

async function networkFirst(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.ok) (await caches.open(cacheName)).put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Sign-in redirects must never be served from a cache.
  if (url.pathname.startsWith("/auth/") && url.pathname !== "/auth/me") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/", { ignoreSearch: true })) || Response.error())
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then(async (res) => {
            if (res.ok) (await caches.open(ASSETS)).put(request, res.clone());
            return res;
          })
      )
    );
    return;
  }

  if (READABLE.test(url.pathname + url.search)) {
    event.respondWith(networkFirst(request, DATA));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "clear-data") event.waitUntil(caches.delete(DATA));
});
