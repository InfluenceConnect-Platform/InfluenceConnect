// Influence Connect — minimal service worker.
//
// Its only real job is to make Chrome treat this as a fully installable app
// (a real WebAPK with a themed status bar) instead of falling back to a
// plain "Add to Home Screen" shortcut — Chrome's installability check wants
// an active SW with a fetch handler. Everything dynamic (every API call)
// lives on a separate origin (NEXT_PUBLIC_API_URL) and never touches this
// file at all — it only ever sees same-origin GETs for the Next.js app.
//
// Deliberately NOT a full offline-first cache: Next.js ships content-hashed
// JS/CSS per build, and opportunistically caching those risks serving a
// stale chunk against a newer HTML shell right after a deploy. So this:
//   - never caches API calls (different origin anyway, skipped below)
//   - never caches JS/CSS/data requests — always network, same as if this
//     worker didn't exist
//   - precaches exactly one thing: a tiny offline fallback page, shown only
//     when a page navigation fails with no network at all
//
// Bump CACHE_NAME below to force existing installs to drop the offline
// shell on their next visit; everything else self-updates via the normal
// SW update check (browsers diff this file's bytes on every navigation).
const CACHE_NAME = 'ic-shell-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever touch same-origin GETs. The backend API (different origin),
  // POST/PUT/DELETE/PATCH, and websocket upgrades all pass straight through
  // untouched — exactly as if this worker weren't installed.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Full-page navigations: always try the network first; only fall back to
  // the precached offline page when there's no connection at all.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Everything else (JS/CSS/images/fonts): plain passthrough, no caching,
  // no fallback — a genuine network request either way.
  event.respondWith(fetch(request));
});
