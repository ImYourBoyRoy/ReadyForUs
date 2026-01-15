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

const CACHE_NAME = 'readyforus-v2.3.2';

// Assets to cache on install (paths relative to site root)
const STATIC_ASSETS = [
    '../',
    '../index.html?v=2.3.2',
    '../manifest.json?v=2.3.2',
    // CSS
    '../css/variables.css?v=2.3.2',
    '../css/base.css?v=2.3.2',
    '../css/components.css?v=2.3.2',
    '../css/animations.css?v=2.3.2',
    '../css/responsive.css?v=2.3.2',
    '../css/app.css?v=2.3.2',
    '../css/dashboard.css?v=2.3.2',
    '../css/toast.css?v=2.3.2',
    '../css/comparison.css?v=2.3.2',
    '../css/about.css?v=2.3.2',
    '../css/themes/light.css?v=2.3.2',
    '../css/themes/dark.css?v=2.3.2',
    '../css/themes/warm.css?v=2.3.2',
    '../css/themes/nature.css?v=2.3.2',
    // JS - Core modules
    './html-loader.js?v=2.3.2',
    './storage-manager.js?v=2.3.2',
    './data-loader.js?v=2.3.2',
    './theme-manager.js?v=2.3.2',
    './question-renderer.js?v=2.3.2',
    './questionnaire-engine.js?v=2.3.2',
    './export-manager.js?v=2.3.2',
    './import-manager.js?v=2.3.2',
    './url-router.js?v=2.3.2',
    './pwa-install.js?v=2.3.2',
    // JS - App modules
    './app/core.js?v=2.3.2',
    './app/utilities.js?v=2.3.2',
    './app/accessibility.js?v=2.3.2',
    './app/toast.js?v=2.3.2',
    './app/bookmarks.js?v=2.3.2',
    './app/views.js?v=2.3.2',
    './app/questionnaire.js?v=2.3.2',
    './app/navigation.js?v=2.3.2',
    './app/export.js?v=2.3.2',
    './app/phase.js?v=2.3.2',
    './app/progress.js?v=2.3.2',
    './app/ranked-select.js?v=2.3.2',
    './app/dashboard.js?v=2.3.2',
    './app/nav-menu.js?v=2.3.2',
    './app/import-modal.js?v=2.3.2',
    './app/init.js?v=2.3.2',
    './debug-overlay.js?v=2.3.2',
    // HTML partials
    '../html/components/navigation.html?v=2.3.2',
    '../html/components/footer.html?v=2.3.2',
    '../html/components/toasts.html?v=2.3.2',
    '../html/views/dashboard.html?v=2.3.2',
    '../html/views/welcome.html?v=2.3.2',
    '../html/views/questionnaire.html?v=2.3.2',
    '../html/views/review.html?v=2.3.2',
    '../html/views/complete.html?v=2.3.2',
    '../html/views/comparison.html?v=2.3.2',
    '../html/views/about.html?v=2.3.2',
    '../html/modals/import.html?v=2.3.2',
    '../html/modals/save.html?v=2.3.2',
    // Data files
    '../data/config.json?v=2.3.2',
    '../data/phases.json?v=2.3.2',
    '../data/phase_0/manifest.json?v=2.3.2',
    '../data/phase_0/questions.json?v=2.3.2',
    '../data/phase_0/prompts.json?v=2.3.2',
    '../data/phase_1.5/manifest.json?v=2.3.2',
    '../data/phase_1.5/questions.json?v=2.3.2',
    '../data/phase_1.5/prompts.json?v=2.3.2',
    // Icons
    '../assets/icons/icon-192.png?v=2.3.2',
    '../assets/icons/icon-512.png?v=2.3.2',
    '../assets/icons/apple-touch-icon.png?v=2.3.2',
    '../assets/icons/favicon.ico?v=2.3.2'
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
