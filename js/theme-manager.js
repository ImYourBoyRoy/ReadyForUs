// ./js/theme-manager.js
/**
 * Theme manager module for the Slow Build Check-In questionnaire.
 * 
 * Handles theme switching, system dark mode detection, and theme persistence.
 * Supports light, dark, warm, and nature themes.
 * 
 * Usage: Import and call ThemeManager.init() on page load.
 */

const ThemeManager = {
    themes: ['light', 'dark', 'warm', 'nature'],
    currentTheme: 'light',

    // Theme display names and icons
    themeInfo: {
        light: { name: 'Light', icon: '☀️', description: 'Soft lavender' },
        dark: { name: 'Dark', icon: '🌙', description: 'Night mode' },
        warm: { name: 'Warm', icon: '🌅', description: 'Terracotta tones' },
        nature: { name: 'Nature', icon: '🌿', description: 'Sage green' }
    },

    /**
     * Initialize theme manager, loading saved preference or defaulting to light.
     */
    init() {
        // Try to load saved theme
        const savedTheme = StorageManager.loadTheme();

        if (savedTheme && this.themes.includes(savedTheme)) {
            this.setTheme(savedTheme, false); // Don't animate on initial load
        } else {
            // Default to the soft light theme (feminine-first default)
            this.setTheme('light', false);
        }

        // Listen for system preference changes (only affects users who haven't chosen a theme)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!StorageManager.loadTheme()) {
                // Only auto-switch if user hasn't explicitly chosen a theme
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Set up theme toggle button
        this.setupToggle();
    },

    /**
     * Set the active theme.
     * @param {string} theme - Theme name.
     * @param {boolean} animate - Whether to animate the transition (default: true).
     */
    setTheme(theme, animate = true) {
        if (!this.themes.includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }

        // Trigger transition animation
        if (animate && this.currentTheme !== theme) {
            document.body.classList.add('theme-transitioning');

            // Remove class after animation completes
            setTimeout(() => {
                document.body.classList.remove('theme-transitioning');
            }, 400);
        }

        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        StorageManager.saveTheme(theme);

        // Update toggle button if it exists
        this.updateToggleButton();

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },

    /**
     * Get the current theme.
     * @returns {string} Current theme name.
     */
    getTheme() {
        return this.currentTheme;
    },

    /**
     * Cycle to the next theme.
     */
    nextTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex]);
    },

    /**
     * Set up the theme toggle button.
     */
    setupToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => this.nextTheme());
        this.updateToggleButton();
    },

    /**
     * Update the toggle button to reflect current theme.
     */
    updateToggleButton() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        const info = this.themeInfo[this.currentTheme];
        toggle.innerHTML = `
      <span class="theme-icon">${info.icon}</span>
      <span class="sr-only">${info.name} theme - click to change</span>
    `;
        toggle.setAttribute('aria-label', `Current theme: ${info.name}. Click to change.`);
        toggle.setAttribute('title', `${info.name}: ${info.description}`);
    },

    /**
     * Create the theme toggle button HTML.
     * @returns {string} HTML string for theme toggle.
     */
    createToggleHTML() {
        return `
      <button id="theme-toggle" class="btn btn-icon theme-toggle" type="button" aria-label="Change theme">
        <span class="theme-icon">☀️</span>
        <span class="sr-only">Change theme</span>
      </button>
    `;
    },

    /**
     * Get all available themes with their info.
     * @returns {Array<Object>} Array of theme info objects.
     */
    getAllThemes() {
        return this.themes.map(id => ({
            id,
            ...this.themeInfo[id],
            active: id === this.currentTheme
        }));
    }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
