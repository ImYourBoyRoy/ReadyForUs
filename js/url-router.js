// ./js/url-router.js
/**
 * URL Router for the Slow Build Check-In questionnaire.
 * 
 * Manages hash-based URL routing to persist navigation state.
 * Allows users to refresh the page without losing their position.
 * 
 * URL Format: #/{phase}/{viewOrQuestionId}
 * Examples:
 *   (no hash)               - Dashboard (default)
 *   #/phase_0/welcome       - Welcome screen
 *   #/phase_0/q05           - Question q05
 *   #/phase_0/review        - Review screen
 *   #/phase_0/complete      - Complete screen
 * 
 * Usage: Call URLRouter.init() after App is initialized.
 */

const URLRouter = {
    // Current state
    currentPhase: null,
    currentView: null,
    currentQuestionId: null,

    // Navigation history
    previousRoute: null,

    // Known view names (non-question routes)
    viewNames: ['welcome', 'review', 'complete', 'comparison', 'dashboard', 'about'],

    // Standalone views that don't require a phase (global views)
    standaloneViews: ['about'],

    /**
     * Initialize the router.
     * Sets up hashchange listener and processes initial URL.
     */
    init() {
        // Listen for hash changes (back/forward navigation)
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Process initial URL hash on load
        this.handleHashChange(true);
    },

    /**
     * Parse the current URL hash.
     * @returns {Object} Parsed route { phase, view, questionId }
     */
    parseHash() {
        const hash = window.location.hash.slice(1); // Remove leading #
        if (!hash || hash === '/') {
            return { phase: null, view: 'dashboard', questionId: null };
        }

        // Expected format: /phase_id/viewOrQuestionId OR /standalone_view
        const parts = hash.split('/').filter(p => p);
        const first = parts[0] || null;
        const second = parts[1] || null;

        // Redirect #/dashboard to root (clean URL)
        if (first === 'dashboard') {
            // Clear hash and return dashboard
            window.history.replaceState(null, '', window.location.pathname);
            return { phase: null, view: 'dashboard', questionId: null };
        }

        // Check if first part is a standalone view (e.g., #/about)
        if (first && this.standaloneViews.includes(first)) {
            return { phase: null, view: first, questionId: null };
        }

        // Otherwise, treat first as phase
        const phase = first;
        const viewOrQuestion = second || 'dashboard';

        // Determine if second part is a view name or question ID
        if (this.viewNames.includes(viewOrQuestion)) {
            return { phase, view: viewOrQuestion, questionId: null };
        } else if (viewOrQuestion.startsWith('q')) {
            // It's a question ID
            return { phase, view: 'questionnaire', questionId: viewOrQuestion };
        } else {
            return { phase, view: 'dashboard', questionId: null };
        }
    },

    /**
     * Build a URL hash from state.
     * @param {string} phase - Phase ID
     * @param {string} view - View name
     * @param {string|null} questionId - Optional question ID
     * @returns {string} Hash string without #
     */
    buildHash(phase, view, questionId = null) {
        // Special case for standalone views
        if (this.standaloneViews.includes(view)) {
            return `/${view}`;
        }

        if (!phase) return '';

        // Dashboard = no hash (just clear it)
        if (view === 'dashboard') {
            return '';
        }

        // Questionnaire uses question ID directly
        if (view === 'questionnaire' && questionId) {
            return `/${phase}/${questionId}`;
        }

        // Other views use view name
        return `/${phase}/${view}`;
    },

    /**
     * Update the URL hash without triggering navigation.
     * @param {string} view - View name
     * @param {string|null} questionId - Optional question ID
     */
    updateHash(view, questionId = null) {
        // Track history before updating, unless it's a self-update or minor change
        // We only want to track "major" view changes to return to
        if (this.currentView && this.currentView !== view && view === 'about') {
            this.previousRoute = {
                phase: this.currentPhase,
                view: this.currentView,
                questionId: this.currentQuestionId
            };
        }

        const phase = DataLoader.getCurrentPhaseId();
        // Standalone views don't need phase, but others do
        if (!phase && !this.standaloneViews.includes(view)) return;

        const newHash = this.buildHash(phase, view, questionId);
        const currentHash = window.location.hash.slice(1);

        // Only update if different (prevents duplicate history entries)
        if (currentHash !== newHash) {
            // Use replaceState for question changes within questionnaire
            // Use pushState for view changes (allows back button)
            const isQuestionChange = this.currentView === 'questionnaire' && view === 'questionnaire';

            if (newHash === '') {
                // Dashboard - clear hash
                window.history.pushState(null, '', window.location.pathname);
            } else if (isQuestionChange) {
                window.history.replaceState(null, '', '#' + newHash);
            } else {
                window.history.pushState(null, '', '#' + newHash);
            }
        }

        this.currentPhase = phase;
        this.currentView = view;
        this.currentQuestionId = questionId;
    },

    /**
     * Handle hash change events.
     * @param {boolean} isInitial - Whether this is the initial page load
     */
    async handleHashChange(isInitial = false) {
        const route = this.parseHash();

        // Handle standalone views (like About) that don't need a phase
        if (!route.phase && this.standaloneViews.includes(route.view)) {
            App.showView(route.view);
            return;
        }

        // If no phase or dashboard view, show dashboard
        if (!route.phase || route.view === 'dashboard') {
            if (!isInitial) {
                App.showView('dashboard');
                App.renderDashboard();
            }
            return;
        }

        // Check if we need to switch phases
        const currentPhase = DataLoader.getCurrentPhaseId();
        if (route.phase !== currentPhase) {
            // Load the requested phase
            DataLoader.setCurrentPhase(route.phase);
            StorageManager.setPhase(route.phase);
            await DataLoader.load();
            App.updateModeOptions();
        }

        // Navigate to the requested view
        switch (route.view) {
            case 'welcome':
                App.showView('welcome');
                break;

            case 'questionnaire':
                // Start or resume questionnaire
                if (route.questionId) {
                    // Initialize engine and jump to specific question
                    const savedMode = StorageManager.loadMode() || 'lite';
                    await QuestionnaireEngine.init(savedMode);
                    QuestionnaireEngine.jumpTo(route.questionId);
                    App.showView('questionnaire');
                    App.renderCurrentQuestion();
                } else {
                    // Show from current position
                    App.showView('questionnaire');
                    App.renderCurrentQuestion();
                }
                break;

            case 'review':
                // Ensure engine is initialized
                if (typeof QuestionnaireEngine !== 'undefined' && QuestionnaireEngine.questions.length === 0) {
                    const savedMode = StorageManager.loadMode() || 'lite';
                    await QuestionnaireEngine.init(savedMode);
                }
                App.showView('review');
                break;

            case 'complete':
                // Ensure engine is initialized
                if (typeof QuestionnaireEngine !== 'undefined' && QuestionnaireEngine.questions.length === 0) {
                    const savedMode = StorageManager.loadMode() || 'lite';
                    await QuestionnaireEngine.init(savedMode);
                }
                App.showView('complete');
                break;

            case 'comparison':
                App.showView('comparison');
                break;

            case 'about':
                App.showView('about');
                break;

            default:
                App.showView('dashboard');
                App.renderDashboard();
        }
    },

    /**
     * Clear the URL hash (return to dashboard).
     */
    clearHash() {
        window.history.pushState(null, '', window.location.pathname);
        this.currentPhase = null;
        this.currentView = 'dashboard';
        this.currentQuestionId = null;
    }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = URLRouter;
}
