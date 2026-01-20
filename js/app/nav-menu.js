// ./js/app/nav-menu.js
/**
 * Navigation hamburger menu module for Ready for Us.
 * 
 * Handles the slide-out navigation menu with dynamic phase links and theme selection.
 * Populates menu items from phase manifests (via DataLoader) and manages open/close behavior.
 * 
 * Usage: Automatically initializes when loaded. Call App.initNavMenu() if needed manually.
 */

const AppNavMenu = {
    /**
     * Initialize the navigation hamburger menu.
     */
    initNavMenu() {
        this.setupMenuBehavior();
        this.populateMenu();
    },

    /**
     * Set up menu open/close behavior.
     */
    setupMenuBehavior() {
        const hamburger = document.getElementById('nav-menu-toggle');
        const menu = document.getElementById('nav-menu');
        const overlay = document.getElementById('nav-menu-overlay');
        const closeBtn = document.getElementById('nav-menu-close');

        if (!hamburger || !menu || !overlay) return;

        // Toggle on hamburger click
        hamburger.addEventListener('click', () => {
            this.toggleMenu();
        });

        // Close on overlay click
        overlay.addEventListener('click', () => {
            this.closeMenu();
        });

        // Close on close button click
        closeBtn?.addEventListener('click', () => {
            this.closeMenu();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMenu();
            }
        });

        // Handle menu item clicks (delegated)
        const menuItems = document.getElementById('nav-menu-items');
        if (menuItems) {
            menuItems.addEventListener('click', (e) => {
                const link = e.target.closest('.nav-menu-link');
                if (link) {
                    const action = link.dataset.action;
                    const phaseId = link.dataset.phaseId;
                    const theme = link.dataset.theme;

                    if (theme) {
                        // Theme selection - don't close menu
                        ThemeManager.setTheme(theme);
                        this.updateThemeButtons();
                        return;
                    }

                    this.closeMenu();

                    if (action === 'home') {
                        this.showView('dashboard');
                        this.renderDashboard();
                    } else if (action === 'import') {
                        this.showImportModal();
                    } else if (action === 'about') {
                        window.location.hash = '#/about';
                    } else if (action === 'howto') {
                        window.location.hash = '#/howto';
                    } else if (action === 'ai-prompts') {
                        window.location.hash = '#/ai-prompts';
                    } else if (phaseId) {
                        this.selectPhase(phaseId);
                    }
                }
            });
        }
    },

    /**
     * Toggle the menu open/closed.
     */
    toggleMenu() {
        const hamburger = document.getElementById('nav-menu-toggle');
        const menu = document.getElementById('nav-menu');
        const overlay = document.getElementById('nav-menu-overlay');

        const isOpen = menu.classList.toggle('open');
        hamburger?.classList.toggle('open', isOpen);
        overlay?.classList.toggle('open', isOpen);
        hamburger?.setAttribute('aria-expanded', isOpen.toString());
        menu?.setAttribute('aria-hidden', (!isOpen).toString());

        // Prevent body scroll when menu is open
        document.body.style.overflow = isOpen ? 'hidden' : '';

        // Update theme buttons and progress indicators when opening
        if (isOpen) {
            this.updateThemeButtons();
            this.refreshMenuIndicators();
        }
    },

    /**
     * Close the menu.
     */
    closeMenu() {
        const hamburger = document.getElementById('nav-menu-toggle');
        const menu = document.getElementById('nav-menu');
        const overlay = document.getElementById('nav-menu-overlay');

        // If focus is inside the menu, move it back to the toggle button
        // This prevents "aria-hidden element contains focus" warnings
        if (menu && menu.contains(document.activeElement)) {
            hamburger?.focus();
        }

        hamburger?.classList.remove('open');
        menu?.classList.remove('open');
        overlay?.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
        menu?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    },

    /**
     * Populate the menu with items.
     */
    populateMenu() {
        const menuItems = document.getElementById('nav-menu-items');
        if (!menuItems) return;

        const phases = DataLoader.getPhases();

        // Elegant icons mapping
        const icons = {
            home: '◈',      // Diamond
            import: '↓',     // Down arrow
            about: '○',      // Circle
            theme: {
                light: '◐',  // Half circle
                dark: '●',   // Filled circle
                warm: '◑',   // Quarter circle
                nature: '◒'  // Three quarter
            }
        };

        let html = `
            <!-- Home -->
            <li class="nav-menu-item">
                <button class="nav-menu-link" data-action="home">
                    <span class="nav-menu-icon">${icons.home}</span>
                    <span class="nav-menu-label">Home</span>
                </button>
            </li>
            
            <!-- Import -->
            <li class="nav-menu-item">
                <button class="nav-menu-link" data-action="import">
                    <span class="nav-menu-icon">${icons.import}</span>
                    <span class="nav-menu-label">Import Results</span>
                </button>
            </li>
            
            <!-- Divider -->
            <li class="nav-menu-divider" role="separator"></li>
            
            <!-- Section Label -->
            <li class="nav-menu-section">Questionnaires</li>
        `;

        // Add phase links with elegant icons and progress indicators
        phases.forEach(phase => {
            // Use refined icons for phases
            const phaseIcon = this.getPhaseIcon(phase);
            const progressStatus = this.getPhaseProgress(phase.id);

            // Determine indicator content
            let indicatorContent = '';
            if (progressStatus === 'in-progress') {
                indicatorContent = 'Continue →';
            } else if (progressStatus === 'completed') {
                indicatorContent = '✓';
            }

            html += `
                <li class="nav-menu-item">
                    <button class="nav-menu-link" data-phase-id="${phase.id}">
                        <span class="nav-menu-icon">${phaseIcon}</span>
                        <span class="nav-menu-label">${phase.short_title}</span>
                        <span class="nav-menu-indicator nav-menu-indicator--${progressStatus}">${indicatorContent}</span>
                    </button>
                </li>
            `;
        });

        // Divider and About
        html += `
            <!-- Divider -->
            <li class="nav-menu-divider" role="separator"></li>
            
            <!-- About -->
            <li class="nav-menu-item">
                <button class="nav-menu-link" data-action="about">
                    <span class="nav-menu-icon">${icons.about}</span>
                    <span class="nav-menu-label">About Me</span>
                </button>
            </li>
            
            <!-- How to Use -->
            <li class="nav-menu-item">
                <button class="nav-menu-link" data-action="howto">
                    <span class="nav-menu-icon">?</span>
                    <span class="nav-menu-label">How to Use</span>
                </button>
            </li>
            
            <!-- AI Prompts -->
            <li class="nav-menu-item">
                <button class="nav-menu-link" data-action="ai-prompts">
                    <span class="nav-menu-icon">⚙</span>
                    <span class="nav-menu-label">AI Prompts</span>
                </button>
            </li>
            
            <!-- Divider -->
            <li class="nav-menu-divider" role="separator"></li>
            
            <!-- Theme Section -->
            <li class="nav-menu-section">Appearance</li>
            <li class="nav-menu-item">
                <div class="nav-menu-themes" id="nav-menu-themes">
                    <button class="theme-btn" data-theme="light" title="Light mode">
                        <span class="theme-btn-icon">☀</span>
                        <span class="theme-btn-label">Light</span>
                    </button>
                    <button class="theme-btn" data-theme="dark" title="Dark mode">
                        <span class="theme-btn-icon">☽</span>
                        <span class="theme-btn-label">Dark</span>
                    </button>
                    <button class="theme-btn" data-theme="warm" title="Warm mode">
                        <span class="theme-btn-icon">◐</span>
                        <span class="theme-btn-label">Warm</span>
                    </button>
                    <button class="theme-btn" data-theme="nature" title="Nature mode">
                        <span class="theme-btn-icon">❧</span>
                        <span class="theme-btn-label">Nature</span>
                    </button>
                </div>
            </li>
        `;

        menuItems.innerHTML = html;

        // Set up theme button listeners
        this.setupThemeButtons();
    },

    /**
     * Get elegant icon for a phase.
     * @param {Object} phase - Phase object
     * @returns {string} Icon character
     */
    getPhaseIcon(phase) {
        // Guard against null, undefined, or the literal string "null" from stale cache
        const menuIcon = phase.menu_icon;
        const icon = phase.icon;
        if (menuIcon && menuIcon !== 'null') return menuIcon;
        if (icon && icon !== 'null') return icon;
        return '•';
    },

    /**
     * Get progress status for a phase.
     * @param {string} phaseId - Phase ID to check
     * @returns {string} Status: 'completed', 'in-progress', or 'not-started'
     */
    getPhaseProgress(phaseId) {
        // Temporarily switch to the phase's storage context
        const originalPhase = StorageManager.currentPhaseId;
        StorageManager.currentPhaseId = phaseId;

        const hasProgress = StorageManager.hasResumableProgress();
        const completedModes = StorageManager.loadCompletedModes();

        // Restore original phase
        StorageManager.currentPhaseId = originalPhase;

        // Determine status
        if (completedModes.includes('full')) return 'completed';
        if (hasProgress) return 'in-progress';
        return 'not-started';
    },

    /**
     * Set up theme button listeners.
     */
    setupThemeButtons() {
        const themeContainer = document.getElementById('nav-menu-themes');
        if (!themeContainer) return;

        themeContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-btn');
            if (btn) {
                const theme = btn.dataset.theme;
                if (theme) {
                    ThemeManager.setTheme(theme);
                    this.updateThemeButtons();
                }
            }
        });

        this.updateThemeButtons();
    },

    /**
     * Update theme buttons to show active state.
     */
    updateThemeButtons() {
        const themeContainer = document.getElementById('nav-menu-themes');
        if (!themeContainer) return;

        const currentTheme = ThemeManager.getTheme();
        themeContainer.querySelectorAll('.theme-btn').forEach(btn => {
            const isActive = btn.dataset.theme === currentTheme;
            btn.classList.toggle('active', isActive);
        });
    },

    /**
     * Select a phase from the menu - goes to welcome page for that phase.
     * @param {string} phaseId - Phase ID to select
     */
    async selectPhase(phaseId) {
        // Check if it's already the current phase
        const currentPhaseId = DataLoader.getCurrentPhaseId();

        if (currentPhaseId !== phaseId) {
            // Switch to the new phase
            DataLoader.setCurrentPhase(phaseId);
            StorageManager.setPhase(phaseId);

            // Load phase data
            await DataLoader.load();

            // Update UI
            this.updatePhaseDisplay();
            this.updateModeOptions();
        }

        // Check if there's resumable progress
        if (StorageManager.hasResumableProgress()) {
            // Resume questionnaire directly (better UX when clicking "Continue →")
            await this.resumeProgress();
        } else {
            // No progress - go to welcome page
            this.showView('welcome');
        }
    },

    /**
     * Refresh the menu (e.g., after adding new phases).
     */
    refreshMenu() {
        this.populateMenu();
    },

    /**
     * Refresh only the progress indicators without re-rendering the entire menu.
     * Call this when progress state changes (save, clear, import, etc.)
     */
    refreshMenuIndicators() {
        const menuItems = document.getElementById('nav-menu-items');
        if (!menuItems) return;

        const phases = DataLoader.getPhases();

        phases.forEach(phase => {
            // Find the menu link for this phase
            const link = menuItems.querySelector(`[data-phase-id="${phase.id}"]`);
            if (!link) return;

            // Find the indicator span
            const indicator = link.querySelector('.nav-menu-indicator');
            if (!indicator) return;

            // Get current progress status
            const progressStatus = this.getPhaseProgress(phase.id);

            // Update indicator content
            let indicatorContent = '';
            if (progressStatus === 'in-progress') {
                indicatorContent = 'Continue →';
            } else if (progressStatus === 'completed') {
                indicatorContent = '✓';
            }

            // Update classes
            indicator.className = `nav-menu-indicator nav-menu-indicator--${progressStatus}`;
            indicator.textContent = indicatorContent;
        });
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppNavMenu);
}
