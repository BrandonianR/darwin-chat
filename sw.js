/* Darwin chat PWA service worker — offline shell only; chat always needs the bridge. */
const CACHE = 'darwin-chat-shell-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.pathname.startsWith('/api/') || u.pathname.includes('/functions/') || u.origin !== self.location.origin) return; // never cache brain
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      const copy = r.clone();
      if (r.ok && (u.pathname.endsWith('.html') || u.pathname.endsWith('.js') || u.pathname.endsWith('.svg') || u.pathname.endsWith('.png') || u.pathname.endsWith('.webmanifest') || u.pathname === '/' || u.pathname.endsWith('/'))) {
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match('./index.html')))
  );
});
