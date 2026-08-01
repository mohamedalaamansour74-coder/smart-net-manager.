const CACHE_NAME = 'smartnet-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './payments.html',
    './lines.html',
    './chat.html',
    './archives.html',
    './reserved-bundles.html',
    './search.html',
    './admin.html',
    './assets/style.css',
    './assets/script.js',
    './assets/charts.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
