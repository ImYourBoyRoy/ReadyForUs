// ./js/html-loader.js
/**
 * HTML Component Loader
 * 
 * Dynamically loads HTML partials into the main page to support modular development.
 * This loader fetches components, views, and modals from the ./html/ directory and
 * injects them into designated containers in the DOM.
 * 
 * Usage:
 *   HTMLLoader.load().then(() => App.init());
 * 
 * Key Features:
 * - Sequential loading to ensure proper DOM order
 * - Error handling with fallback messages
 * - Ready callbacks for initialization
 */

const HTMLLoader = {
    // Base path for HTML partials
    basePath: 'html/',

    // Initialization guard
    _initialized: false,

    // Component definitions: [filename, containerSelector]
    components: {
        'loader': ['components/loader.html', '#loader-container'],
        'navigation': ['components/navigation.html', '#nav-container'],
        'footer': ['components/footer.html', '#footer-container'],
        'toasts': ['components/toasts.html', '#toast-wrapper']
    },

    views: {
        'dashboard': ['views/dashboard.html', '#main-content'],
        'welcome': ['views/welcome.html', '#main-content'],
        'questionnaire': ['views/questionnaire.html', '#main-content'],
        'review': ['views/review.html', '#main-content'],
        'complete': ['views/complete.html', '#main-content'],
        'comparison': ['views/comparison.html', '#main-content'],
        'about': ['views/about.html', '#main-content']
    },

    modals: {
        'import': ['modals/import.html', '#modals-container'],
        'save': ['modals/save.html', '#modals-container']
    },

    /**
     * Fetch and inject a single HTML partial
     * @param {string} path - Path to HTML file relative to basePath
     * @param {string} containerSelector - CSS selector for container element
     * @param {boolean} append - If true, append to container; if false, replace content
     * @returns {Promise<void>}
     */
    async loadPartial(path, containerSelector, append = true) {
        try {
            const response = await fetch(this.basePath + path);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.status}`);
            }

            const html = await response.text();
            const container = document.querySelector(containerSelector);

            if (!container) {
                console.error(`Container not found: ${containerSelector}`);
                return;
            }

            if (append) {
                container.insertAdjacentHTML('beforeend', html);
            } else {
                container.innerHTML = html;
            }

            console.log(`✓ Loaded: ${path}`);
        } catch (error) {
            console.error(`✗ Error loading ${path}:`, error);
        }
    },

    /**
     * Load all components in a category
     * @param {Object} categoryMap - Map of component name to [path, container]
     * @returns {Promise<void>}
     */
    async loadCategory(categoryMap) {
        for (const [name, [path, container]] of Object.entries(categoryMap)) {
            await this.loadPartial(path, container);
        }
    },

    /**
     * Load all HTML components, views, and modals
     * Loads in order: components (loader first), then views, then modals
     * @returns {Promise<void>}
     */
    async load() {
        console.log('🔄 Loading HTML components...');
        const startTime = performance.now();

        // Note: Loader is inline in index.html for immediate display
        // No need to load components/loader.html

        // Load navigation
        await this.loadPartial('components/navigation.html', '#nav-container');

        // Load all views into main-content
        // They will be hidden by CSS/JS until needed
        const viewOrder = ['dashboard', 'welcome', 'questionnaire', 'review', 'complete', 'comparison', 'about'];
        for (const viewName of viewOrder) {
            const [path, container] = this.views[viewName];
            await this.loadPartial(path, container);
        }

        // Load footer
        await this.loadPartial('components/footer.html', '#footer-container');

        // Load modals
        await this.loadCategory(this.modals);

        // Load toasts last
        await this.loadPartial('components/toasts.html', '#toast-wrapper');

        const loadTime = (performance.now() - startTime).toFixed(0);
        console.log(`✅ All HTML components loaded in ${loadTime}ms`);
    },

    /**
     * Initialize the loader and execute callback when ready
     * @param {Function} callback - Function to call when all components are loaded
     */
    init(callback) {
        // Guard against multiple initializations
        if (this._initialized) {
            console.warn('HTMLLoader.init() called multiple times - ignoring');
            // Still call the callback if provided (App.init handles its own guard)
            if (typeof callback === 'function') {
                callback();
            }
            return;
        }
        this._initialized = true;

        this.load()
            .then(() => {
                if (typeof callback === 'function') {
                    callback();
                }
            })
            .catch(error => {
                console.error('Failed to load HTML components:', error);
                // Show error in loader
                const loader = document.getElementById('loader-text');
                if (loader) {
                    loader.textContent = 'Failed to load app. Please refresh.';
                }
            });
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.HTMLLoader = HTMLLoader;
}
