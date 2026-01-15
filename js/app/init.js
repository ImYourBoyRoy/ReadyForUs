// ./js/app/init.js
/**
 * Initialization module for the Ready for Us.
 * 
 * Contains the main init() function, event listener setup, and bootstrap logic.
 * This module MUST be loaded last, after all other js/app/ modules have extended App.
 * 
 * Usage: Load this script last in index.html to initialize the application.
 */

const AppInit = {
    /**
     * Initialize the application.
     */
    async init() {
        // Guard against double initialization
        if (this._initialized) {
            console.warn('App.init() called multiple times - ignoring');
            return;
        }
        this._initialized = true;

        try {
            // Loading handled by skeleton states in Dashboard

            // Load site-wide configuration first
            await DataLoader.loadConfig();

            // Load phases manifest
            await DataLoader.loadPhases();

            // Determine which phase to use (URL param > last used > default)
            const urlParams = new URLSearchParams(window.location.search);
            const urlPhase = urlParams.get('phase');
            const lastPhase = StorageManager.getLastPhase();
            const defaultPhase = DataLoader.getDefaultPhaseId();
            const phaseId = urlPhase || lastPhase || defaultPhase;

            // Set up phase for both DataLoader and StorageManager
            DataLoader.setCurrentPhase(phaseId);
            StorageManager.setPhase(phaseId);

            // Load phase data (questions and prompts)
            await DataLoader.load();

            // Update page title/branding from phase
            this.updatePhaseDisplay();

            // Initialize theme
            ThemeManager.init();

            // Cache view references
            this.cacheViews();

            // Set up event listeners
            this.setupEventListeners();

            // Initialize navigation dropdown menu
            this.initNavMenu();

            // Update mode options with dynamic counts
            this.updateModeOptions();

            // Check for resumable progress
            if (StorageManager.hasResumableProgress()) {
                this.showResumePrompt();
            }

            // Hide loading
            this.showLoading(false);

            // Initialize mode toggle to saved mode
            const savedMode = StorageManager.loadMode();
            this.updateModeToggle(savedMode);

            // Check for URL hash and restore state, or show dashboard as default
            if (typeof URLRouter !== 'undefined' && window.location.hash && window.location.hash !== '#' && window.location.hash !== '#/') {
                // URL has a hash - let router handle navigation
                URLRouter.init();
            } else {
                // No hash - show dashboard as default landing
                this.showView('dashboard');
                this.renderDashboard();
                // Initialize router for future navigation
                if (typeof URLRouter !== 'undefined') {
                    URLRouter.init();
                }
            }

        } catch (error) {
            console.error('Failed to initialize app:', error);
            const msg = error.message || 'Unknown error';
            this.showError(`Failed to load: ${msg}`);
            if (typeof this.showResetOption === 'function') {
                this.showResetOption();
            }
        }
    },

    /**
     * Set up all event listeners.
     */
    setupEventListeners() {
        // Mode selection
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectMode(e.currentTarget));
        });

        // Start button
        document.getElementById('btn-start')?.addEventListener('click', () => this.startQuestionnaire());

        // Navigation buttons (smart button handles both next and skip)
        document.getElementById('btn-prev')?.addEventListener('click', () => this.previousQuestion());
        document.getElementById('btn-next')?.addEventListener('click', () => this.nextQuestion());

        // Review button
        document.getElementById('btn-review')?.addEventListener('click', () => this.showView('review'));
        document.getElementById('btn-back-to-questions')?.addEventListener('click', () => this.showView('questionnaire'));

        // Skipped questions button
        document.getElementById('btn-go-to-skipped')?.addEventListener('click', () => this.goToSkipped());

        // Export buttons
        document.getElementById('btn-export-text')?.addEventListener('click', () => this.exportText());
        document.getElementById('btn-export-json')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('btn-copy')?.addEventListener('click', () => this.copyToClipboard());
        document.getElementById('btn-copy-ai-prompt')?.addEventListener('click', () => this.copyAIPrompt());
        document.getElementById('btn-copy-results')?.addEventListener('click', () => this.copyResultsForCouple());
        document.getElementById('btn-copy-couple-prompt')?.addEventListener('click', () => this.copyCouplePrompt());

        // View Raw buttons (mobile fallback)
        document.getElementById('btn-view-ai-prompt')?.addEventListener('click', () => {
            ExportManager.showIndividualPromptRaw({ participantName: this.getParticipantName() });
        });
        document.getElementById('btn-view-results')?.addEventListener('click', () => {
            ExportManager.showResultsRaw({ participantName: this.getParticipantName() });
        });
        document.getElementById('btn-view-couple-prompt')?.addEventListener('click', () => {
            ExportManager.showCouplePromptRaw();
        });

        // Restart buttons (both nav and complete view)
        document.getElementById('btn-restart')?.addEventListener('click', () => this.restart());
        document.getElementById('btn-nav-restart')?.addEventListener('click', () => this.restart());

        // Review Answers button (on complete view)
        document.getElementById('btn-review-answers')?.addEventListener('click', () => this.showView('review'));

        // Save Progress button (on questionnaire view) - shows modal first
        document.getElementById('btn-save-progress')?.addEventListener('click', () => this.showSaveModal());

        // Save modal controls
        document.getElementById('save-modal-close')?.addEventListener('click', () => this.hideSaveModal());
        document.getElementById('save-cancel')?.addEventListener('click', () => this.hideSaveModal());
        document.getElementById('save-confirm')?.addEventListener('click', () => this.confirmSaveProgress());

        // Resume buttons
        document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeProgress());
        document.getElementById('btn-start-fresh')?.addEventListener('click', () => this.startFresh());

        // Import modal openers
        document.getElementById('btn-import-nav')?.addEventListener('click', () => this.showImportModal());
        document.getElementById('btn-import-welcome')?.addEventListener('click', () => this.showImportModal());

        // Import modal controls
        document.getElementById('import-modal-close')?.addEventListener('click', () => this.hideImportModal());
        document.getElementById('import-cancel')?.addEventListener('click', () => this.hideImportModal());
        document.getElementById('import-generate')?.addEventListener('click', () => this.generateImportedPrompt());
        document.getElementById('import-continue-btn')?.addEventListener('click', () => this.continueFromImport());
        document.getElementById('import-copy')?.addEventListener('click', () => this.copyImportedPrompt());
        document.getElementById('import-back')?.addEventListener('click', () => this.resetImportModal());

        // Import mode switcher
        document.querySelectorAll('.import-mode-option').forEach(option => {
            option.addEventListener('click', () => this.switchImportMode(option.dataset.importMode));
        });

        // Import file inputs
        this.setupImportFileHandlers();

        // Upgrade to Full mode button
        document.getElementById('btn-upgrade-full')?.addEventListener('click', () => this.upgradeToFullMode());

        // Participant name input
        document.getElementById('participant-name')?.addEventListener('input', (e) => {
            this.participantName = e.target.value;
        });

        // Question input delegation
        document.getElementById('question-container')?.addEventListener('change', (e) => this.handleInputChange(e));
        document.getElementById('question-container')?.addEventListener('input', (e) => this.handleInputChange(e));

        // Review card clicks
        document.getElementById('review-grid')?.addEventListener('click', (e) => {
            const card = e.target.closest('.review-card');
            if (card) {
                const questionId = card.dataset.questionId;
                if (questionId) {
                    QuestionnaireEngine.jumpTo(questionId);
                    this.showView('questionnaire');
                    this.renderCurrentQuestion();
                }
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Mode toggle buttons in nav
        document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                if (mode) {
                    this.switchMode(mode);
                    this.updateModeToggle(mode);
                }
            });
        });

        // Dashboard button
        document.getElementById('btn-dashboard')?.addEventListener('click', () => {
            this.showView('dashboard');
            this.renderDashboard();
        });

        // About page - Back to Dashboard
        // About page - Back to Dashboard (Delegated)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btn-about-dashboard') {
                this.returnToPrevious();
            }
        });

        // About page - Copy email
        document.getElementById('btn-copy-email')?.addEventListener('click', (e) => {
            const email = e.currentTarget.dataset.email || 'roy@readyforus.app';
            navigator.clipboard.writeText(email).then(() => {
                this.showToast('Email copied to clipboard!', 'success');
                e.currentTarget.textContent = '✓ Copied!';
                setTimeout(() => {
                    e.currentTarget.textContent = '📋 Copy';
                }, 2000);
            }).catch(() => {
                this.showToast('Failed to copy email', 'error');
            });
        });
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppInit);
}

// Initialize on DOM ready - wait for HTML components to load first
document.addEventListener("DOMContentLoaded", () => {
    // HTMLLoader injects all HTML partials from ./html/ folder
    // before initializing the app to ensure DOM elements exist
    if (typeof HTMLLoader !== "undefined") {
        HTMLLoader.init(() => App.init());
    } else {
        // Fallback for static HTML (all elements already in page)
        App.init();
    }
});
