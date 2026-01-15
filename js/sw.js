// ./js/sw.js
/**
 * Service Worker for Ready for Us PWA
 * 
 * Provides aggressive caching for all static assets to enable:
 * - Instant subsequent page loads (cache-first strategy)
 * - Offline functionality
 * - Reduced mobile network latency impact
 * 
 * Cache Strategy: Cache-first with network fallback
 * - Static assets served from cache immediately
 * - Network requests made in background to update cache
 */

const CACHE_NAME = 'readyforus-v2.1.0';

// Assets to cache on install (paths relative to site root)
const STATIC_ASSETS = [
    '../',
    '../index.html',
    '../manifest.json',
    // CSS
    '../css/variables.css',
    '../css/base.css',
    '../css/components.css',
    '../css/animations.css',
    '../css/responsive.css',
    '../css/app.css',
    '../css/dashboard.css',
    '../css/toast.css',
    '../css/comparison.css',
    '../css/themes/light.css',
    '../css/themes/dark.css',
    '../css/themes/warm.css',
    '../css/themes/nature.css',
    // JS - Core modules
    './html-loader.js',
    './storage-manager.js',
    './data-loader.js',
    './theme-manager.js',
    './question-renderer.js',
    './questionnaire-engine.js',
    './export-manager.js',
    './import-manager.js',
    './url-router.js',
    './pwa-install.js',
    './sw.js',
    // JS - App modules
    './app/core.js',
    './app/utilities.js',
    './app/accessibility.js',
    './app/toast.js',
    './app/bookmarks.js',
    './app/views.js',
    './app/questionnaire.js',
    './app/navigation.js',
    './app/export.js',
    './app/phase.js',
    './app/progress.js',
    './app/ranked-select.js',
    './app/dashboard.js',
    './app/import-modal.js',
    './app/init.js',
    './debug-overlay.js',
    // HTML partials
    '../html/components/navigation.html',
    '../html/components/footer.html',
    '../html/components/toasts.html',
    '../html/views/dashboard.html',
    '../html/views/welcome.html',
    '../html/views/questionnaire.html',
    '../html/views/review.html',
    '../html/views/complete.html',
    '../html/views/comparison.html',
    '../html/views/about.html',
    '../html/modals/import.html',
    '../html/modals/save.html',
    // Data files
    '../data/config.json',
    '../data/phases.json',
    '../data/phase_0/manifest.json',
    '../data/phase_0/questions.json',
    '../data/phase_0/prompts.json',
    '../data/phase_1.5/manifest.json',
    '../data/phase_1.5/questions.json',
    '../data/phase_1.5/prompts.json',
    // Icons
    '../assets/icons/icon-192.png',
    '../assets/icons/icon-512.png',
    '../assets/icons/apple-touch-icon.png',
    '../assets/icons/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Install complete');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[SW] Install failed:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activate complete');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version immediately
                    // Update cache in background (stale-while-revalidate)
                    fetchAndCache(event.request);
                    return cachedResponse;
                }

                // Not in cache - fetch from network
                return fetchAndCache(event.request);
            })
            .catch(() => {
                // Offline fallback - return cached index for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('../index.html');
                }
                return new Response('Offline', { status: 503 });
            })
    );
});

// Helper: Fetch and update cache
function fetchAndCache(request) {
    return fetch(request)
        .then((response) => {
            // Don't cache non-ok responses or opaque responses
            if (!response || response.status !== 200) {
                return response;
            }

            // Clone response before caching (response can only be consumed once)
            const responseClone = response.clone();

            caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(request, responseClone);
                });

            return response;
        });
}
