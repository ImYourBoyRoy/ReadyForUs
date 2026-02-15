// ./js/sw.js
/**
 * Service Worker for Ready for Us PWA
 *
 * Strategy:
 * - Install quickly with a core app shell cache.
 * - Warm additional assets (including all phase data) in the background.
 * - Network-first for navigations, cache-first stale-while-revalidate for static/data requests.
 */

const APP_VERSION = '2.5.5';
const CACHE_NAME = `readyforus-v${APP_VERSION}`;

// Keep install lightweight so first-run UX is not delayed.
const CORE_ASSETS = [
    '../',
    `../index.html?v=${APP_VERSION}`,
    `../manifest.json?v=${APP_VERSION}`,

    // CSS
    `../css/variables.css?v=${APP_VERSION}`,
    `../css/base.css?v=${APP_VERSION}`,
    `../css/components.css?v=${APP_VERSION}`,
    `../css/animations.css?v=${APP_VERSION}`,
    `../css/responsive.css?v=${APP_VERSION}`,
    `../css/app.css?v=${APP_VERSION}`,
    `../css/dashboard.css?v=${APP_VERSION}`,
    `../css/toast.css?v=${APP_VERSION}`,
    `../css/comparison.css?v=${APP_VERSION}`,
    `../css/about.css?v=${APP_VERSION}`,
    `../css/complete.css?v=${APP_VERSION}`,
    `../css/ai-analysis.css?v=${APP_VERSION}`,
    `../css/ai-analysis-transparency.css?v=${APP_VERSION}`,
    `../css/themes/light.css?v=${APP_VERSION}`,
    `../css/themes/dark.css?v=${APP_VERSION}`,
    `../css/themes/warm.css?v=${APP_VERSION}`,
    `../css/themes/nature.css?v=${APP_VERSION}`,

    // JS - Core modules
    `./html-loader.js?v=${APP_VERSION}`,
    `./storage-manager.js?v=${APP_VERSION}`,
    `./data-loader.js?v=${APP_VERSION}`,
    `./theme-manager.js?v=${APP_VERSION}`,
    `./question-renderer.js?v=${APP_VERSION}`,
    `./questionnaire-engine.js?v=${APP_VERSION}`,
    `./export-manager.js?v=${APP_VERSION}`,
    `./import-manager.js?v=${APP_VERSION}`,
    `./url-router.js?v=${APP_VERSION}`,
    `./pwa-install.js?v=${APP_VERSION}`,

    // JS - App modules
    `./app/core.js?v=${APP_VERSION}`,
    `./app/utilities.js?v=${APP_VERSION}`,
    `./app/accessibility.js?v=${APP_VERSION}`,
    `./app/toast.js?v=${APP_VERSION}`,
    `./app/bookmarks.js?v=${APP_VERSION}`,
    `./app/views.js?v=${APP_VERSION}`,
    `./app/questionnaire.js?v=${APP_VERSION}`,
    `./app/navigation.js?v=${APP_VERSION}`,
    `./app/export.js?v=${APP_VERSION}`,
    `./app/phase.js?v=${APP_VERSION}`,
    `./app/progress.js?v=${APP_VERSION}`,
    `./app/ranked-select.js?v=${APP_VERSION}`,
    `./app/dashboard.js?v=${APP_VERSION}`,
    `./app/nav-menu.js?v=${APP_VERSION}`,
    `./app/import-modal.js?v=${APP_VERSION}`,
    `./app/ai-prompts.js?v=${APP_VERSION}`,
    `./app/results-navigator.js?v=${APP_VERSION}`,
    `./app/ai-analysis-transparency.js?v=${APP_VERSION}`,
    `./app/ai-analysis.js?v=${APP_VERSION}`,
    `./app/init.js?v=${APP_VERSION}`,
    `./debug-overlay.js?v=${APP_VERSION}`,

    // HTML partials
    `../html/components/navigation.html?v=${APP_VERSION}`,
    `../html/components/footer.html?v=${APP_VERSION}`,
    `../html/components/toasts.html?v=${APP_VERSION}`,
    `../html/views/dashboard.html?v=${APP_VERSION}`,
    `../html/views/welcome.html?v=${APP_VERSION}`,
    `../html/views/questionnaire.html?v=${APP_VERSION}`,
    `../html/views/review.html?v=${APP_VERSION}`,
    `../html/views/complete.html?v=${APP_VERSION}`,
    `../html/views/comparison.html?v=${APP_VERSION}`,
    `../html/views/about.html?v=${APP_VERSION}`,
    `../html/views/howto.html?v=${APP_VERSION}`,
    `../html/views/ai-prompts.html?v=${APP_VERSION}`,
    `../html/views/ai-analysis.html?v=${APP_VERSION}`,
    `../html/modals/import.html?v=${APP_VERSION}`,
    `../html/modals/save.html?v=${APP_VERSION}`,

    // Data bootstrap
    `../data/config.json?v=${APP_VERSION}`,
    `../data/phase-registry.json?v=${APP_VERSION}`,

    // Icons used by the shell
    `../assets/icons/icon-192.png?v=${APP_VERSION}`,
    `../assets/icons/icon-512.png?v=${APP_VERSION}`,
    `../assets/icons/apple-touch-icon.png?v=${APP_VERSION}`,
    `../assets/icons/favicon.ico?v=${APP_VERSION}`
];

const BACKGROUND_STATIC_ASSETS = [
    `../assets/icons/favicon-16x16.png?v=${APP_VERSION}`,
    `../assets/icons/favicon-32x32.png?v=${APP_VERSION}`,
    `../assets/images/og-preview.jpg?v=${APP_VERSION}`,
    `../assets/images/og-preview.png?v=${APP_VERSION}`
];

async function cacheAssets(cache, assets) {
    const uniqueAssets = [...new Set(assets)];
    const settled = await Promise.allSettled(
        uniqueAssets.map(async (asset) => {
            try {
                await cache.add(asset);
            } catch (error) {
                console.warn('[SW] Failed to precache asset:', asset, error);
            }
        })
    );

    return settled.filter((result) => result.status === 'fulfilled').length;
}

async function getPhaseAssets() {
    let phaseFolders = ['phase_closure', 'phase_0', 'phase_1', 'phase_1.5', 'phase_2', 'phase_2.5'];

    try {
        const res = await fetch(`../data/phase-registry.json?v=${APP_VERSION}`, { cache: 'no-store' });
        if (res.ok) {
            const registry = await res.json();
            if (Array.isArray(registry.phases) && registry.phases.length > 0) {
                phaseFolders = registry.phases;
            }
        }
    } catch (error) {
        console.warn('[SW] Could not load phase registry for background precache:', error);
    }

    return phaseFolders.flatMap((folder) => ([
        `../data/${folder}/manifest.json?v=${APP_VERSION}`,
        `../data/${folder}/questions.json?v=${APP_VERSION}`,
        `../data/${folder}/prompts.json?v=${APP_VERSION}`
    ]));
}

async function warmBackgroundCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const phaseAssets = await getPhaseAssets();
        await cacheAssets(cache, [...BACKGROUND_STATIC_ASSETS, ...phaseAssets]);
        console.log('[SW] Background precache complete');
    } catch (error) {
        console.warn('[SW] Background precache failed:', error);
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        console.log('[SW] Installing:', CACHE_NAME);
        const cache = await caches.open(CACHE_NAME);
        await cacheAssets(cache, CORE_ASSETS);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((key) => key !== CACHE_NAME)
                .map((key) => caches.delete(key))
        );

        await self.clients.claim();
        console.log('[SW] Activated:', CACHE_NAME);
    })());

    // Do not block activation UX on full warmup.
    warmBackgroundCache();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    let requestUrl;
    try {
        requestUrl = new URL(request.url);
    } catch {
        return;
    }

    if (!requestUrl.protocol.startsWith('http')) return;

    // Leave cross-origin requests to the browser network stack.
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(request);
                if (networkResponse && networkResponse.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            } catch {
                return (
                    await caches.match(request) ||
                    await caches.match(`../index.html?v=${APP_VERSION}`) ||
                    await caches.match('../') ||
                    new Response('Offline', { status: 503 })
                );
            }
        })());
        return;
    }

    event.respondWith((async () => {
        const cached = await caches.match(request);

        if (cached) {
            event.waitUntil(fetchAndCache(request));
            return cached;
        }

        return fetchAndCache(request);
    })());
});

async function fetchAndCache(request) {
    try {
        const response = await fetch(request);

        if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        return caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 }));
    }
}
