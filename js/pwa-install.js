// ./js/pwa-install.js
/**
 * PWA Install Handler for Ready for Us.
 * 
 * Captures the beforeinstallprompt event and provides methods to 
 * check installability and trigger the native install prompt.
 * 
 * Usage: 
 *   - PWAInstall.canInstall() - returns true if app can be installed
 *   - PWAInstall.triggerInstall() - triggers native install prompt
 *   - PWAInstall.onStateChange(callback) - register state change listener
 * 
 * Key behaviors:
 *   - Automatically captures beforeinstallprompt on page load
 *   - Stores deferred prompt for later use
 *   - Tracks installation state (pending, installed, dismissed)
 *   - Notifies listeners when install state changes
 */

const PWAInstall = {
    /** @type {BeforeInstallPromptEvent|null} */
    deferredPrompt: null,

    /** @type {string} - 'idle' | 'available' | 'installed' | 'dismissed' */
    state: 'idle',

    /** @type {Function[]} */
    listeners: [],

    /**
     * Initialize PWA install handler.
     * Called automatically on script load.
     */
    init() {
        // Capture the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Store the event for later use
            this.deferredPrompt = e;
            this.setState('available');

            console.log('[PWA] Install prompt captured and available');
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.setState('installed');
            console.log('[PWA] App installed successfully');
        });

        // Check if already installed (standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            this.setState('installed');
            console.log('[PWA] App already installed (running in standalone mode)');
            return;
        }

        // iOS Detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        // Check if valid context (https/localhost) to avoid false positives
        if (isIOS) {
            this.setState('ios-available');
            console.log('[PWA] iOS detected, install manual instructions available');
        }
    },

    /**
     * Update state and notify listeners.
     * @param {string} newState 
     */
    setState(newState) {
        const oldState = this.state;
        this.state = newState;

        if (oldState !== newState) {
            this.listeners.forEach(callback => {
                try {
                    callback(newState, oldState);
                } catch (error) {
                    console.error('[PWA] Listener error:', error);
                }
            });
        }
    },

    /**
     * Check if the app can be installed.
     * @returns {boolean}
     */
    canInstall() {
        return this.state === 'available' && this.deferredPrompt !== null;
    },

    /**
     * Check if the app is already installed.
     * @returns {boolean}
     */
    isInstalled() {
        return this.state === 'installed';
    },

    /**
     * Trigger the native install prompt.
     * @returns {Promise<{outcome: string}>}
     */
    async triggerInstall() {
        if (!this.deferredPrompt) {
            console.warn('[PWA] No install prompt available');
            return { outcome: 'unavailable' };
        }

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log('[PWA] Install prompt outcome:', outcome);

        // Clear the deferred prompt
        this.deferredPrompt = null;

        if (outcome === 'accepted') {
            this.setState('installed');
        } else {
            this.setState('dismissed');
        }

        return { outcome };
    },

    /**
     * Register a callback for state changes.
     * @param {Function} callback - Called with (newState, oldState)
     */
    onStateChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    },

    /**
     * Remove a state change callback.
     * @param {Function} callback 
     */
    offStateChange(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
};

// Auto-initialize
PWAInstall.init();
