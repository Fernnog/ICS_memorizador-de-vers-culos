// service-worker.js - V1.1.6 (Atualizado para nova arquitetura)

const CACHE_NAME = 'neurobible-v1.1.6'; // Mudamos o nome para forçar atualização
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './images/logo.png',
    './images/favicon.ico',
    // Novos caminhos da arquitetura modular
    './js/main.js',
    './js/core.js',
    './js/storage.js',
    './js/ui-dashboard.js',
    './js/flashcard.js',
    './js/srs-engine.js',
    './js/utils.js',
    './js/changelog.js',
    './js/firebase.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching modular assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});
