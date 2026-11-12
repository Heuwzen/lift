// Lift offline cache. A gym has weak signal, so the app itself opens from the cache at once and refreshes in the
// background (a new version shows on the next open). data.json is not cached here: app.js keeps the last sealed
// copy in the phone's storage, shows it at once and fetches a newer one behind it.
const CACHE = 'lift-895172fbed';
const ASSETS = ['./', './index.html', './style.css', './logic.js', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('lift-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
const mine = req => caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.endsWith('/data.json')) return;
  if (req.mode === 'navigate') {
    const net = fetch(req).then(r => keep('./index.html', r));
    e.waitUntil(net.catch(() => {}));
    e.respondWith(mine('./index.html').then(hit => hit || net));
  } else if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    const net = fetch(req).then(r => keep(req, r));
    e.waitUntil(net.catch(() => {}));
    e.respondWith(mine(req).then(hit => hit || net));
  }
});
