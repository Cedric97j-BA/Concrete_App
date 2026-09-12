const CACHE_NAME = 'hub-inspection-v1.1.0.8';

// These files are required for the application to start and work offline.
const APP_ASSETS = [
    './',
    './index.html',
    './index_beton.html',
    './index_compaction.html',
    './index_echsolgra.html',
    './index_planche.html',
    './styles.css',
    './app.js',
    './app_beton.js',
    './app_compaction.js',
    './app_echsolgra.js',
    './app_planche.js',
    './pdf_templates.js',
    './logo.png',
    './logo_beton.png',
    './logo_compaction.png',
    './logo_echsolgra.png',
    './logo_planche.png',
    './fonts/tahoma.ttf'
];

const EXTERNAL_ASSETS = [
    'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    'https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_ASSETS))
            .then((cache) => Promise.all(
                EXTERNAL_ASSETS.map((asset) => fetch(asset, { mode: 'no-cors' })
                    .then((response) => cache.put(asset, response)))
            ))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys
                .filter((key) => key !== CACHE_NAME)
                .map((key) => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Keep newly requested resources available offline as well.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok || response.type === 'opaque') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
