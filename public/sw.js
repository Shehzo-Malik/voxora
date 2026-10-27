// Voxora service worker: network first (so updates show up), cache as offline fallback.
const CACHE = "voxora-v1";
const SHELL = ["./", "index.html", "css/style.css", "js/config.js", "js/core.js", "js/theme.js", "js/auth.js", "js/chat.js", "js/ai.js", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return; // never touch API / other sites
  e.respondWith(fetch(r).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res; }).catch(() => caches.match(r).then(m => m || caches.match("index.html"))));
});
