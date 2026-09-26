// Network first; cache only this application's static files, never arbitrary requests.
const CACHE = 'skarbrade-workshop-v4';
const FILES = ['./', './index.html', './styles.css', './src/app.mjs', './src/model.mjs', './src/preview.mjs', './manifest.webmanifest', './favicon.svg', './docs/MODELL.md'];
const URLS = new Set(FILES.map(file => new URL(file, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith('skarbrade-')) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !URLS.has(event.request.url)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy))); }
    return response;
  }).catch(async () => (await caches.match(event.request)) || new Response('Ingen anslutning. Öppna sidan online en gång först.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
});
