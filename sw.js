/* BRASA · service worker: rede primeiro, cache como reserva (funciona offline com a última versão vista).
   Chamadas à API (script.google.com) e a outros sites passam direto, sem cache. */
var V = 'brasa-v4';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'assets/css/brasa.css', 'assets/css/app.css',
  'assets/js/config.js', 'assets/js/core.js', 'assets/js/checkout.js', 'assets/js/app.js', 'assets/js/app-pages.js', 'assets/js/app-watch.js', 'assets/js/app-banners.js', 'assets/img/icon-192.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok) { var copy = r.clone(); caches.open(V).then(function (c) { c.put(e.request, copy); }); }
    return r;
  }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('index.html'); }); }));
});
