const PRECACHE = 'precache-v3.7.1';
const RUNTIME = 'runtime-v3.7.1';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
  '/about.html',
  '/weatherIcons/sunny.png',
  '/weatherIcons/partlyCloudy.png',
  '/weatherIcons/cloudy.png',
  '/weatherIcons/rainy.png',
  '/weatherIcons/thunderStorm.png'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// The fetch handler serves cached assets if available, otherwise fetches them from the server
self.addEventListener('fetch', function(event) {
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
		return;
	}
	if (event.request.url.startsWith(self.location.origin)) {
		event.respondWith(
			caches.open('RUNTIME').then(function(cache) {
				return cache.match(event.request).then(function(response) {
					var fetchPromise = fetch(event.request).then(function(networkResponse) {
						cache.put(event.request, networkResponse.clone());
						return networkResponse;
					})
					return response || fetchPromise;
				})
			})
		);
	}
});