
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("delulu-cache").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./logo-512x512.png",
        "./delulu-favicon-512x512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
