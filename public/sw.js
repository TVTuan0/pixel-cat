// Keeps a copy of the game so it opens offline.
// Pages: try the network first (to get updates), fall back to the copy.
// Everything else (scripts, styles, images, fonts): use the copy first, fetch and keep it if missing.
const CACHE = 'pixel-cat-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('./')));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function keep(request, response) {
  if (response.ok || response.type === 'opaque') {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isOwn = url.origin === self.location.origin;
  const isFont = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!isOwn && !isFont) return; // analytics and anything else go straight to the network
  if (isOwn && url.pathname.startsWith('/api/')) return; // contest data must always be fresh

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => keep('./', response))
        .catch(() => caches.match('./')),
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((response) => keep(request, response))),
  );
});
