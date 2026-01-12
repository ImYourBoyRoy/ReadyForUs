// ./js/app.js
/**
 * Main application entry point for the Slow Build Check-In questionnaire.
 * 
 * Initializes all modules, sets up event listeners, and manages view transitions.
 * Coordinates the welcome, questionnaire, review, and export flows.
 * 
 * Usage: Include this script last to auto-initialize on DOMContentLoaded.
 */

const App = {
    // Views
    views: {
        dashboard: null,
        welcome: null,
        questionnaire: null,
        review: null,
        complete: null,
        comparison: null
    },
    currentView: 'dashboard',
    participantName: '',

    // Bookmarks (question IDs)
    bookmarkedQuestions: [],

    // Import review tracking
    importNeedsReview: [],

    /**
     * Initialize the application.
     */
    async init() {
        try {
            // Show loading state
            this.showLoading(true);

            // Load phases manifest first
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
            this.showError('Failed to load questionnaire. Please refresh the page.');
        }
    },

    /**
     * Cache DOM references for views.
     */
    cacheViews() {
        this.views.dashboard = document.getElementById('view-dashboard');
        this.views.welcome = document.getElementById('view-welcome');
        this.views.questionnaire = document.getElementById('view-questionnaire');
        this.views.review = document.getElementById('view-review');
        this.views.complete = document.getElementById('view-complete');
        this.views.comparison = document.getElementById('view-comparison');

        // Load bookmarks from storage
        this.bookmarkedQuestions = StorageManager.getBookmarks() || [];
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
    },

    /**
     * Update mode options with dynamic question counts.
     */
    updateModeOptions() {
        const fullCount = DataLoader.getQuestionCount('full');
        const liteCount = DataLoader.getQuestionCount('lite');
        const manifest = DataLoader.getManifest();

        const fullCountEl = document.getElementById('full-count');
        const liteCountEl = document.getElementById('lite-count');
        const liteTimeEl = document.getElementById('lite-time');

        if (fullCountEl) fullCountEl.textContent = fullCount;
        if (liteCountEl) liteCountEl.textContent = liteCount;
        if (liteTimeEl && manifest.timebox_minutes) {
            liteTimeEl.textContent = `~${manifest.timebox_minutes} minutes`;
        }
    },

    /**
     * Update page display elements from current phase/artifact metadata.
     */
    updatePhaseDisplay() {
        const phase = DataLoader.getCurrentPhase();
        const artifact = DataLoader.getArtifact();

        // Update page title
        if (artifact.title) {
            document.title = `${artifact.title} | ${phase?.short_title || 'Questionnaire'}`;
        }

        // Update nav branding
        const navTitle = document.querySelector('.nav-title');
        if (navTitle && artifact.title) {
            navTitle.textContent = artifact.title;
        }

        // Update nav icon
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo && phase?.icon) {
            navLogo.textContent = phase.icon;
        }

        // Update welcome header
        const welcomeTitle = document.getElementById('welcome-title');
        if (welcomeTitle && artifact.title) {
            welcomeTitle.textContent = artifact.title;
        }

        const welcomeIcon = document.querySelector('.welcome-icon');
        if (welcomeIcon && phase?.icon) {
            welcomeIcon.textContent = phase.icon;
        }

        const welcomeSubtitle = document.querySelector('.welcome-subtitle');
        if (welcomeSubtitle && artifact.subtitle) {
            welcomeSubtitle.textContent = artifact.subtitle;
        }
    },

    /**
     * Populate the phase switcher dropdown with available phases.
     */
    populatePhaseSwitcher() {
        const phaseSwitcher = document.getElementById('phase-switcher');
        if (!phaseSwitcher) return;

        const phases = DataLoader.getPhases();
        const currentPhase = DataLoader.getCurrentPhase();

        // Format phase ID for display (e.g., "phase_0" -> "Phase 0", "phase_1.5" -> "Phase 1.5")
        const formatPhaseNumber = (id) => {
            const match = id.match(/phase_([\d.]+)/);
            return match ? `Phase ${match[1]}` : '';
        };

        phaseSwitcher.innerHTML = phases.map(phase => {
            const phaseNum = formatPhaseNumber(phase.id);
            const label = phaseNum ? `${phase.icon} ${phaseNum}: ${phase.short_title}` : `${phase.icon} ${phase.short_title}`;
            return `<option value="${phase.id}" ${phase.id === currentPhase?.id ? 'selected' : ''}>${label}</option>`;
        }).join('');

        // Add change event listener
        phaseSwitcher.addEventListener('change', (e) => this.changePhase(e.target.value));
    },

    /**
     * Switch to a different phase.
     * Progress is stored per-phase, so switching phases preserves each phase's progress separately.
     * @param {string} phaseId - The phase ID to switch to.
     */
    async changePhase(phaseId) {
        const currentPhase = DataLoader.getCurrentPhase();
        if (currentPhase?.id === phaseId) return;

        // Confirm if user has progress in current phase
        const hasProgress = QuestionnaireEngine.getStats?.().answered > 0;
        if (hasProgress) {
            const confirmed = confirm(
                `Switch to a different phase?\n\n` +
                `Your progress in "${currentPhase?.short_title || 'current phase'}" is saved automatically.\n` +
                `You can return anytime without losing your work.`
            );
            if (!confirmed) {
                // Reset the dropdown to current phase
                const phaseSwitcher = document.getElementById('phase-switcher');
                if (phaseSwitcher) phaseSwitcher.value = currentPhase.id;
                return;
            }
        }

        // Show loading
        this.showLoading(true);

        try {
            // Switch to new phase
            DataLoader.setCurrentPhase(phaseId);
            StorageManager.setPhase(phaseId);

            // Load new phase data
            await DataLoader.load();

            // Update display
            this.updatePhaseDisplay();
            this.updateModeOptions();

            // Reset the questionnaire engine for new phase  
            const savedMode = StorageManager.loadMode();
            QuestionnaireEngine.init(savedMode);

            // Check for resumable progress in this phase
            if (StorageManager.hasResumableProgress()) {
                this.showResumePrompt();
            } else {
                document.getElementById('resume-prompt').style.display = 'none';
            }

            // Go to welcome screen
            this.showView('welcome');

        } catch (error) {
            console.error('Failed to change phase:', error);
            this.showError('Failed to load phase data. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Handle mode selection.
     * @param {HTMLElement} option - Selected option element.
     */
    selectMode(option) {
        document.querySelectorAll('.mode-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        const mode = option.dataset.mode;
        StorageManager.saveMode(mode);
    },

    /**
     * Start the questionnaire.
     */
    async startQuestionnaire() {
        const nameInput = document.getElementById('participant-name');
        this.participantName = nameInput?.value.trim() || 'Participant';

        // Save participant name to storage
        StorageManager.saveParticipantName(this.participantName);

        const selectedMode = document.querySelector('.mode-option.selected');
        const mode = selectedMode?.dataset.mode || 'lite';

        await QuestionnaireEngine.init(mode);
        this.showView('questionnaire');
        this.renderCurrentQuestion();
        this.updateProgress();
    },

    /**
     * Render the current question.
     */
    renderCurrentQuestion() {
        const container = document.getElementById('question-container');
        if (!container) return;

        const question = QuestionnaireEngine.getCurrentQuestion();
        if (!question) {
            this.showView('complete');
            return;
        }

        const response = QuestionnaireEngine.getResponse(question.id);
        const sectionTitle = QuestionnaireEngine.getCurrentSectionTitle();

        // Animate out
        container.innerHTML = '';

        // Render new question
        const html = QuestionRenderer.render(question, response, {
            questionNumber: QuestionnaireEngine.getCurrentNumber(),
            totalQuestions: QuestionnaireEngine.getTotalQuestions(),
            sectionTitle,
            showExamples: true
        });

        container.innerHTML = html;

        // Update navigation buttons
        this.updateNavigationButtons();

        // Update URL hash with current question ID
        if (typeof URLRouter !== 'undefined') {
            URLRouter.updateHash('questionnaire', question.id);
        }
    },

    /**
     * Update navigation button states.
     * Smart button: shows "Next" when answered, "Skip" when blank, "Finish" when last.
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        const nextText = nextBtn?.querySelector('.btn-next-text');
        const nextIcon = nextBtn?.querySelector('.btn-next-icon');

        const isFirst = QuestionnaireEngine.currentIndex === 0;
        const isLast = QuestionnaireEngine.currentIndex === QuestionnaireEngine.getTotalQuestions() - 1;
        const isAnswered = QuestionnaireEngine.isCurrentAnswered();

        // Previous button
        if (prevBtn) {
            prevBtn.disabled = isFirst;
            prevBtn.style.visibility = isFirst ? 'hidden' : 'visible';
        }

        // Smart next/skip button
        if (nextBtn && nextText) {
            if (isLast) {
                // Last question
                nextText.textContent = 'Finish';
                nextIcon.textContent = '✓';
                nextBtn.dataset.state = 'finish';
                nextBtn.classList.remove('btn-skip-state');
                nextBtn.classList.add('btn-primary');
            } else if (isAnswered) {
                // Answered - show Next
                nextText.textContent = 'Next';
                nextIcon.textContent = '→';
                nextBtn.dataset.state = 'next';
                nextBtn.classList.remove('btn-skip-state');
                nextBtn.classList.add('btn-primary');
            } else {
                // Not answered - show Skip
                nextText.textContent = 'Skip';
                nextIcon.textContent = '→';
                nextBtn.dataset.state = 'skip';
                nextBtn.classList.add('btn-skip-state');
                nextBtn.classList.remove('btn-primary');
            }
        }
    },

    /**
     * Update progress display.
     */
    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressFillSkipped = document.getElementById('progress-fill-skipped');
        const progressText = document.getElementById('progress-text');
        const skippedBadge = document.getElementById('skipped-badge');

        const stats = QuestionnaireEngine.getStats();
        const answeredPercent = (stats.answered / stats.total) * 100;
        const skippedPercent = (stats.skipped / stats.total) * 100;

        if (progressFill) {
            progressFill.style.width = `${answeredPercent}%`;
        }

        // Skipped fill shows after the answered portion
        if (progressFillSkipped) {
            progressFillSkipped.style.width = `${skippedPercent}%`;
            progressFillSkipped.style.left = `${answeredPercent}%`;
        }

        if (progressText) {
            progressText.textContent = `${stats.answered} of ${stats.total} answered`;
        }

        if (skippedBadge) {
            if (stats.skipped > 0) {
                skippedBadge.textContent = `${stats.skipped} skipped`;
                skippedBadge.style.display = 'inline-flex';
            } else {
                skippedBadge.style.display = 'none';
            }
        }
    },

    /**
     * Handle input changes in questions.
     * @param {Event} e - Input event.
     */
    handleInputChange(e) {
        const target = e.target;
        const questionId = target.dataset.questionId;
        const field = target.dataset.field;

        if (!questionId) return;

        const question = DataLoader.getQuestion(questionId);
        if (!question) return;

        let response = QuestionnaireEngine.getResponse(questionId);

        // Handle based on input type
        if (target.type === 'radio') {
            // Determine the target key: use field attribute for compound questions,
            // otherwise use 'selected_value' for standalone single-select
            const fieldKey = field || 'selected_value';
            response[fieldKey] = target.value;

            // Show/hide other input if applicable
            const otherWrapper = target.closest('.question-options')?.querySelector('.other-input-wrapper');
            if (otherWrapper) {
                otherWrapper.classList.toggle('visible', target.value === 'other');
            }
        }
        else if (target.type === 'checkbox') {
            // Determine the target key: use field attribute for compound questions,
            // otherwise use 'selected_values' for standalone multi-select
            const fieldKey = field || 'selected_values';

            // Initialize the array if needed
            if (!response[fieldKey]) {
                response[fieldKey] = [];
            }

            if (target.checked) {
                if (!response[fieldKey].includes(target.value)) {
                    response[fieldKey].push(target.value);
                }
            } else {
                response[fieldKey] = response[fieldKey].filter(v => v !== target.value);
            }

            // Update count display (only for standalone multi-select)
            if (!field) {
                const countEl = document.querySelector('.selection-count .count-text');
                if (countEl) {
                    countEl.textContent = `${response[fieldKey].length} selected`;
                }
            }

            // Show/hide other input
            const otherWrapper = target.closest('.question-options')?.querySelector('.other-input-wrapper');
            if (otherWrapper) {
                otherWrapper.classList.toggle('visible', response[fieldKey].includes('other'));
            }
        }
        else if (target.classList.contains('textarea') || target.type === 'text' || target.type === 'number') {
            if (field) {
                response[field] = target.type === 'number' ? Number(target.value) : target.value;
            } else {
                response.text = target.value;
            }
        }

        QuestionnaireEngine.saveResponse(questionId, response);

        // Update conditional field visibility for compound questions
        if (question.type === 'compound' && (target.type === 'radio' || target.type === 'checkbox')) {
            this.updateConditionalFields(questionId, question, response);
        }

        this.updateNavigationButtons();
        this.updateProgress();
    },

    /**
     * Update visibility of conditional fields within a compound question.
     * @param {string} questionId - Question ID.
     * @param {Object} question - Question definition.
     * @param {Object} response - Current response object.
     */
    updateConditionalFields(questionId, question, response) {
        if (!question.fields) return;

        const container = document.getElementById('question-container');

        question.fields.forEach(field => {
            if (!field.showWhen) return;

            const fieldEl = container.querySelector(`[data-field-key="${field.key}"]`);
            if (!fieldEl) return;

            const isVisible = QuestionRenderer.evaluateShowWhen(field, response);
            fieldEl.classList.toggle('hidden', !isVisible);
        });
    },

    /**
     * Go to next question (or skip if unanswered).
     * Smart behavior: if user hasn't answered, this acts as skip.
     */
    nextQuestion() {
        // Clear warning for current question (user has viewed it)
        this.clearImportWarning(QuestionnaireEngine.getCurrentQuestion()?.id);

        const nextBtn = document.getElementById('btn-next');
        const isSkipState = nextBtn?.dataset.state === 'skip';
        const isLast = QuestionnaireEngine.currentIndex === QuestionnaireEngine.getTotalQuestions() - 1;

        // If button is in skip state (not answered), mark as skipped
        if (isSkipState && !QuestionnaireEngine.isCurrentAnswered()) {
            QuestionnaireEngine.markAsSkipped();
        }

        if (isLast) {
            this.showView('complete');
            this.renderComplete();
        } else if (QuestionnaireEngine.next()) {
            this.renderCurrentQuestion();
            this.updateProgress();
        }
    },

    /**
     * Go to previous question.
     */
    previousQuestion() {
        // Clear warning for current question (user has viewed it)
        this.clearImportWarning(QuestionnaireEngine.getCurrentQuestion()?.id);

        if (QuestionnaireEngine.previous()) {
            this.renderCurrentQuestion();
            this.updateProgress();
        }
    },

    /**
     * Skip current question.
     */
    skipQuestion() {
        if (QuestionnaireEngine.skip()) {
            this.renderCurrentQuestion();
            this.updateProgress();
        } else {
            // Was last question
            this.showView('complete');
            this.renderComplete();
        }
    },

    /**
     * Go to first skipped question.
     */
    goToSkipped() {
        if (QuestionnaireEngine.goToFirstSkipped()) {
            this.showView('questionnaire');
            this.renderCurrentQuestion();
        }
    },

    /**
     * Show a specific view.
     * @param {string} viewName - View name.
     */
    showView(viewName) {
        // Hide all views - use inert instead of aria-hidden to prevent focus issues
        Object.values(this.views).forEach(view => {
            if (view) {
                view.classList.remove('active');
                view.inert = true;
            }
        });

        // Show target view
        const targetView = this.views[viewName];
        if (targetView) {
            targetView.classList.add('active');
            targetView.inert = false;

            // Move focus to the view for accessibility
            targetView.focus({ preventScroll: true });
        }

        this.currentView = viewName;

        // Show/hide nav elements based on view
        const navRestart = document.getElementById('btn-nav-restart');
        const modeToggle = document.querySelector('.mode-toggle');
        const dashboardBtn = document.getElementById('btn-dashboard');

        // Dashboard/welcome hide most nav controls
        const showNavControls = !['dashboard', 'welcome'].includes(viewName);
        const showDashboardBtn = viewName !== 'dashboard';

        if (navRestart) {
            // Use .visible class since CSS uses opacity for this button
            navRestart.classList.toggle('visible', showNavControls);
        }
        if (modeToggle) {
            modeToggle.style.display = showNavControls ? 'flex' : 'none';
        }
        if (dashboardBtn) {
            dashboardBtn.style.display = showDashboardBtn ? 'inline-flex' : 'none';
        }

        // Special handling for review view
        if (viewName === 'review') {
            this.renderReview();
        }

        // Scroll to top
        window.scrollTo(0, 0);

        // Reset page title and nav branding for dashboard
        if (viewName === 'dashboard') {
            document.title = 'Slow Build Check-In | Relationship Tools';
            const navTitle = document.querySelector('.nav-title');
            const navLogo = document.querySelector('.nav-logo');
            if (navTitle) navTitle.textContent = 'Slow Build Check-In';
            if (navLogo) navLogo.textContent = '💜';
        }

        // Update URL hash for navigation state
        if (typeof URLRouter !== 'undefined') {
            const questionId = viewName === 'questionnaire' ? QuestionnaireEngine.getCurrentQuestion()?.id : null;
            URLRouter.updateHash(viewName, questionId);
        }
    },

    /**
     * Render review grid.
     */
    renderReview() {
        const grid = document.getElementById('review-grid');
        if (!grid) return;

        const questions = QuestionnaireEngine.questions;

        grid.innerHTML = questions.map(question => {
            const status = QuestionnaireEngine.getQuestionStatus(question.id);
            const response = QuestionnaireEngine.getResponse(question.id);
            const needsReview = this.importNeedsReview?.includes(question.id) || false;
            return QuestionRenderer.renderReviewCard(question, response, status, { needsReview });
        }).join('');

        // Update stats
        const stats = QuestionnaireEngine.getStats();
        const statsEl = document.getElementById('review-stats');
        if (statsEl) {
            statsEl.innerHTML = `
        <span class="stat answered">${stats.answered} answered</span>
        ${stats.skipped > 0 ? `<span class="stat skipped">${stats.skipped} skipped</span>` : ''}
        ${stats.unanswered > 0 ? `<span class="stat unanswered">${stats.unanswered} remaining</span>` : ''}
      `;
        }
    },

    /**
     * Render complete view.
     */
    renderComplete() {
        const stats = QuestionnaireEngine.getStats();
        const statsEl = document.getElementById('complete-stats');

        if (statsEl) {
            statsEl.innerHTML = `
        <div class="complete-stat">
          <span class="stat-number">${stats.answered}</span>
          <span class="stat-label">Questions Answered</span>
        </div>
        ${stats.skipped > 0 ? `
          <div class="complete-stat skipped">
            <span class="stat-number">${stats.skipped}</span>
            <span class="stat-label">Skipped</span>
          </div>
        ` : ''}
      `;
        }

        // Show upgrade section for Lite completions
        const upgradeSection = document.getElementById('upgrade-section');
        if (upgradeSection) {
            const canUpgrade = QuestionnaireEngine.canUpgradeToFull();
            const additionalCount = QuestionnaireEngine.getAdditionalFullQuestionCount();

            if (canUpgrade && additionalCount > 0) {
                upgradeSection.style.display = 'block';
                const countEl = document.getElementById('additional-count');
                if (countEl) {
                    countEl.textContent = additionalCount;
                }
            } else {
                upgradeSection.style.display = 'none';
            }
        }
    },

    /**
     * Export responses as text.
     */
    exportText() {
        ExportManager.exportAsText({ participantName: this.participantName });
    },

    /**
     * Export responses as JSON.
     */
    exportJSON() {
        ExportManager.exportAsJSON({ participantName: this.participantName });
    },

    /**
     * Generate a user-friendly filename for save progress.
     * Format: phase-version_answered-of-total_date.json
     */
    generateSaveFilename() {
        const stats = QuestionnaireEngine.getStats();
        const mode = QuestionnaireEngine.mode || 'lite';
        const artifact = DataLoader.getArtifact();
        const phaseName = artifact?.stage?.code || 'checkin';

        // Get current date in simple format (Jan-08)
        const date = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateStr = `${months[date.getMonth()]}-${String(date.getDate()).padStart(2, '0')}`;

        // Build filename: phase1_5-lite_5-of-18_Jan-08.json
        return `${phaseName}-${mode}_${stats.answered}-of-${stats.total}_${dateStr}.json`;
    },

    /**
     * Show the save progress modal with preview info.
     */
    showSaveModal() {
        const modal = document.getElementById('save-modal');
        const filenameEl = document.getElementById('save-filename-preview');
        const statsEl = document.getElementById('save-stats-preview');

        // Generate and show filename
        const filename = this.generateSaveFilename();
        if (filenameEl) {
            filenameEl.textContent = filename;
        }

        // Show stats
        const stats = QuestionnaireEngine.getStats();
        if (statsEl) {
            statsEl.innerHTML = `
                <span>✓ ${stats.answered} answered</span>
                <span>⏭ ${stats.skipped} skipped</span>
                <span>○ ${stats.unanswered} remaining</span>
            `;
        }

        // Show modal
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Hide the save progress modal.
     */
    hideSaveModal() {
        const modal = document.getElementById('save-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Confirm and execute the save operation.
     */
    confirmSaveProgress() {
        const filename = this.generateSaveFilename();

        try {
            // Export using the generated filename (without .json, it gets added automatically)
            ExportManager.exportAsJSON({
                participantName: this.getParticipantName(),
                filename: filename.replace('.json', '')
            });

            // Hide modal
            this.hideSaveModal();

            // Show success toast
            this.showSaveToast();

        } catch (error) {
            console.error('Failed to save progress:', error);
            // Could add error handling UI here
        }
    },

    /**
     * Show a friendly success toast notification.
     */
    showSaveToast() {
        const toast = document.getElementById('save-toast');
        if (toast) {
            toast.classList.add('show');

            // Auto-hide after 4 seconds
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    },

    /**
     * Copy responses to clipboard.
     */
    async copyToClipboard() {
        const success = await ExportManager.copyToClipboard({ participantName: this.participantName });

        const btn = document.getElementById('btn-copy');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = success ? '✓ Copied!' : '✗ Failed';
            btn.classList.add(success ? 'success' : 'error');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('success', 'error');
            }, 2000);
        }
    },

    /**
     * Get current participant name (from input or saved).
     */
    getParticipantName() {
        // Try to get from input first (in case user is on welcome view)
        const nameInput = document.getElementById('participant-name');
        if (nameInput && nameInput.value.trim()) {
            return nameInput.value.trim();
        }
        // Then try in-memory value
        if (this.participantName) {
            return this.participantName;
        }
        // Finally load from storage
        return StorageManager.loadParticipantName();
    },

    /**
     * Copy AI prompt to clipboard.
     */
    async copyAIPrompt() {
        const success = await ExportManager.copyAIPrompt('individual', { participantName: this.getParticipantName() });

        const btn = document.getElementById('btn-copy-ai-prompt');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = success ? '✓ Copied!' : '✗ Failed';
            btn.classList.add(success ? 'success' : 'error');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('success', 'error');
            }, 2000);
        }
    },

    /**
     * Copy results for couple's review.
     */
    async copyResultsForCouple() {
        const success = await ExportManager.copyResultsForCouple({ participantName: this.getParticipantName() });

        const btn = document.getElementById('btn-copy-results');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = success ? '✓ Results Copied!' : '✗ Failed';
            btn.classList.add(success ? 'success' : 'error');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('success', 'error');
            }, 2000);
        }
    },

    /**
     * Copy couple's AI prompt template.
     */
    async copyCouplePrompt() {
        const success = await ExportManager.copyCouplePrompt();

        const btn = document.getElementById('btn-copy-couple-prompt');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = success ? '✓ Prompt Copied!' : '✗ Failed';
            btn.classList.add(success ? 'success' : 'error');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('success', 'error');
            }, 2000);
        }
    },

    /**
     * Restart the questionnaire - clears all local data.
     */
    restart() {
        const confirmed = confirm(
            '⚠️ This will clear ALL answered questions and local cache.\n\n' +
            'Your responses will be permanently deleted.\n\n' +
            'Proceed?'
        );

        if (confirmed) {
            QuestionnaireEngine.reset();
            this.showView('welcome');
        }
    },

    /**
     * Switch between Lite and Full mode, preserving all answers.
     * @param {string} newMode - 'lite' or 'full'
     */
    async switchMode(newMode) {
        const currentMode = QuestionnaireEngine.mode;
        if (newMode === currentMode) return;

        // Use the upgrade method which preserves answers
        const result = await QuestionnaireEngine.initWithUpgrade(newMode);

        if (result.success) {
            // Update UI
            this.renderCurrentQuestion();
            this.updateProgress();
            this.updateModeDisplay();

            console.log(`Switched from ${result.previousMode} to ${result.newMode}. ${result.existingAnswers} answers preserved.`);
        }
    },

    /**
     * Update the mode display in the UI.
     */
    updateModeDisplay() {
        this.updateModeToggle(QuestionnaireEngine.mode);
    },

    /**
     * Update the mode toggle buttons state.
     * @param {string} mode - 'lite' or 'full'
     */
    updateModeToggle(mode) {
        document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
            const isActive = btn.dataset.mode === mode;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
        });
    },

    /**
     * Show resume prompt.
     */
    showResumePrompt() {
        const resumePrompt = document.getElementById('resume-prompt');
        if (resumePrompt) {
            resumePrompt.style.display = 'block';
        }
    },

    /**
     * Resume from saved progress.
     */
    async resumeProgress() {
        const savedMode = StorageManager.loadMode();
        this.participantName = StorageManager.loadParticipantName();

        await QuestionnaireEngine.init(savedMode);

        document.getElementById('resume-prompt').style.display = 'none';
        this.showView('questionnaire');
        this.renderCurrentQuestion();
        this.updateProgress();
    },

    /**
     * Start fresh, clearing saved progress.
     */
    startFresh() {
        StorageManager.clearAll();
        document.getElementById('resume-prompt').style.display = 'none';
    },

    /**
     * Handle file import from JSON or TXT.
     * @param {Event} e - File input change event.
     */
    async handleImport(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            let data;

            // Try JSON first
            if (file.name.endsWith('.json')) {
                data = JSON.parse(text);
            } else {
                // Try to parse as text export format
                data = StorageManager.parseTextImport(text);
                if (!data) {
                    throw new Error('Could not parse text file format');
                }
            }

            // Import the data (merge with existing)
            const result = StorageManager.importAll(data, false);

            if (result.success) {
                // Show success feedback
                alert(`✅ Import successful!\n\n${result.message}\n\nYour progress has been restored.`);

                // Show resume prompt since we now have data
                this.showResumePrompt();
            } else {
                alert(`❌ Import failed: ${result.message}`);
            }
        } catch (err) {
            console.error('Import error:', err);
            alert(`❌ Import failed: ${err.message}\n\nPlease make sure the file is a valid JSON or TXT export.`);
        }

        // Reset file input so same file can be selected again
        e.target.value = '';
    },

    /**
     * Upgrade from Lite mode to Full mode, keeping existing answers.
     */
    async upgradeToFullMode() {
        try {
            // Mark current mode as completed
            StorageManager.markModeCompleted('lite');

            // Perform the upgrade
            const result = await QuestionnaireEngine.initWithUpgrade('full');

            if (result.success) {
                // Show questionnaire with first new question
                this.showView('questionnaire');
                this.renderCurrentQuestion();
                this.updateProgress();

                // Brief notification
                console.log(`Upgraded to Full mode. Starting at question ${result.firstNewQuestionIndex + 1} with ${result.existingAnswers} existing answers.`);
            }
        } catch (err) {
            console.error('Upgrade error:', err);
            alert(`Failed to upgrade to Full mode: ${err.message}`);
        }
    },

    /**
     * Handle keyboard navigation.
     * @param {KeyboardEvent} e - Keyboard event.
     */
    handleKeyboard(e) {
        if (this.currentView !== 'questionnaire') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight':
            case 'Enter':
                if (!e.shiftKey) this.nextQuestion();
                break;
            case 'ArrowLeft':
                this.previousQuestion();
                break;
            case 's':
                if (!e.ctrlKey && !e.metaKey) this.skipQuestion();
                break;
            case 'r':
                if (!e.ctrlKey && !e.metaKey) this.showView('review');
                break;
        }
    },

    /**
     * Show loading state.
     * @param {boolean} show - Whether to show loading.
     */
    showLoading(show) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    },

    /**
     * Show error message.
     * @param {string} message - Error message.
     */
    showError(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    },

    /**
     * Clear import warning for a question (user has reviewed it).
     * @param {string} questionId - Question ID to clear.
     */
    clearImportWarning(questionId) {
        if (!questionId || !this.importNeedsReview) return;

        const idx = this.importNeedsReview.indexOf(questionId);
        if (idx > -1) {
            this.importNeedsReview.splice(idx, 1);
            // Also clear from warnings object
            if (this.importWarnings) {
                delete this.importWarnings[questionId];
            }
        }
    },

    // ==================== Import Modal ====================

    // Parsed file data storage
    importedFiles: {
        a: null,
        b: null,
        continue: null
    },

    // Current import mode: 'continue' or 'ai-prompt'
    importMode: 'continue',

    /**
     * Set up file input handlers for import zones.
     */
    setupImportFileHandlers() {
        // AI Prompt zones (a, b)
        const zones = ['a', 'b'];

        zones.forEach(zone => {
            const zoneEl = document.getElementById(`upload-zone-${zone}`);
            const inputEl = document.getElementById(`import-file-${zone}`);
            const infoEl = document.getElementById(`upload-info-${zone}`);

            if (!zoneEl || !inputEl) return;

            // File selection
            inputEl.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    await this.handleImportFile(zone, e.target.files[0]);
                }
            });

            // Drag and drop
            zoneEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                zoneEl.classList.add('drag-over');
            });

            zoneEl.addEventListener('dragleave', () => {
                zoneEl.classList.remove('drag-over');
            });

            zoneEl.addEventListener('drop', async (e) => {
                e.preventDefault();
                zoneEl.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    await this.handleImportFile(zone, e.dataTransfer.files[0]);
                }
            });

            // Remove button
            infoEl?.querySelector('.upload-remove')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImportFile(zone);
            });
        });

        // Continue zone
        const continueZoneEl = document.getElementById('upload-zone-continue');
        const continueInputEl = document.getElementById('import-file-continue');
        const continueInfoEl = document.getElementById('upload-info-continue');

        if (continueZoneEl && continueInputEl) {
            continueInputEl.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    await this.handleImportFile('continue', e.target.files[0]);
                }
            });

            continueZoneEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                continueZoneEl.classList.add('drag-over');
            });

            continueZoneEl.addEventListener('dragleave', () => {
                continueZoneEl.classList.remove('drag-over');
            });

            continueZoneEl.addEventListener('drop', async (e) => {
                e.preventDefault();
                continueZoneEl.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    await this.handleImportFile('continue', e.dataTransfer.files[0]);
                }
            });

            continueInfoEl?.querySelector('.upload-remove')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImportFile('continue');
            });
        }

        // Close modal on overlay click
        document.getElementById('import-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'import-modal') {
                this.hideImportModal();
            }
        });
    },

    /**
     * Handle an imported file.
     * @param {string} zone - 'a' or 'b'
     * @param {File} file - The file object
     */
    async handleImportFile(zone, file) {
        const zoneEl = document.getElementById(`upload-zone-${zone}`);
        const contentEl = zoneEl?.querySelector('.upload-zone-content');
        const infoEl = document.getElementById(`upload-info-${zone}`);

        try {
            const parsed = await ImportManager.parseFile(file);
            this.importedFiles[zone] = parsed;

            // Update UI
            if (contentEl) contentEl.style.display = 'none';
            if (infoEl) {
                infoEl.style.display = 'flex';
                infoEl.querySelector('.upload-name').textContent = parsed.name;
                infoEl.querySelector('.upload-details').textContent =
                    `${parsed.mode} • ${parsed.questionCount} questions • ${parsed.format.toUpperCase()}`;
            }
            zoneEl?.classList.add('has-file');

            this.updateImportValidation();

        } catch (error) {
            this.showImportValidation(error.message, 'error');
        }
    },

    /**
     * Clear an imported file.
     * @param {string} zone - 'a' or 'b'
     */
    clearImportFile(zone) {
        this.importedFiles[zone] = null;

        const zoneEl = document.getElementById(`upload-zone-${zone}`);
        const contentEl = zoneEl?.querySelector('.upload-zone-content');
        const infoEl = document.getElementById(`upload-info-${zone}`);
        const inputEl = document.getElementById(`import-file-${zone}`);

        if (contentEl) contentEl.style.display = 'flex';
        if (infoEl) infoEl.style.display = 'none';
        if (inputEl) inputEl.value = '';
        zoneEl?.classList.remove('has-file');

        this.updateImportValidation();
    },

    /**
     * Update validation and button states based on imported files.
     */
    updateImportValidation() {
        const generateBtn = document.getElementById('import-generate');
        const continueBtn = document.getElementById('import-continue-btn');
        const typeSelectorEl = document.getElementById('import-type-selector');
        const validationEl = document.getElementById('import-validation');

        const hasContinue = !!this.importedFiles.continue;
        const hasA = !!this.importedFiles.a;
        const hasB = !!this.importedFiles.b;

        // Handle based on current import mode
        if (this.importMode === 'continue') {
            // Continue mode: single file
            if (hasContinue) {
                const file = this.importedFiles.continue;
                const hasResponses = file.responses && Object.keys(file.responses).length > 0;

                if (!hasResponses) {
                    this.showImportValidation('Could not extract responses from this file.', 'error');
                    if (continueBtn) continueBtn.disabled = true;
                } else if (file.format === 'txt') {
                    this.showImportValidation(
                        `✓ Ready to continue as ${file.name} (${file.mode} mode). Note: Some complex answers may need adjustment.`,
                        'success'
                    );
                    if (continueBtn) continueBtn.disabled = false;
                } else {
                    this.showImportValidation(
                        `✓ Ready to continue as ${file.name} (${file.mode} mode, ${file.questionCount} questions)`,
                        'success'
                    );
                    if (continueBtn) continueBtn.disabled = false;
                }
            } else {
                if (validationEl) validationEl.style.display = 'none';
                if (continueBtn) continueBtn.disabled = true;
            }
        } else {
            // AI Prompt mode
            // Show type selector only if we have file(s)
            if (typeSelectorEl) {
                typeSelectorEl.style.display = hasA ? 'flex' : 'none';
            }

            // If both files, validate compatibility
            if (hasA && hasB) {
                const validation = ImportManager.validateCompatibility(
                    this.importedFiles.a,
                    this.importedFiles.b
                );

                if (!validation.isValid) {
                    this.showImportValidation(validation.message, 'error');
                    if (generateBtn) generateBtn.disabled = true;
                    return;
                }

                this.showImportValidation(
                    `✓ Both files compatible (${this.importedFiles.a.mode} mode)`,
                    'success'
                );
                // Auto-select couple's prompt
                const coupleRadio = document.querySelector('input[name="import-type"][value="couple"]');
                if (coupleRadio) coupleRadio.checked = true;
            } else if (hasA) {
                this.showImportValidation(
                    `Ready to generate individual prompt for ${this.importedFiles.a.name}`,
                    'success'
                );
            } else {
                if (validationEl) validationEl.style.display = 'none';
            }

            // Enable generate button if we have at least one file
            if (generateBtn) {
                generateBtn.disabled = !hasA;
            }
        }
    },

    /**
     * Show import validation message.
     * @param {string} message - The message
     * @param {string} type - 'error' or 'success'
     */
    showImportValidation(message, type) {
        const validationEl = document.getElementById('import-validation');
        if (validationEl) {
            validationEl.textContent = message;
            validationEl.className = `import-validation ${type}`;
            validationEl.style.display = 'block';
        }
    },

    /**
     * Show the import modal.
     */
    showImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Hide the import modal.
     */
    hideImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.resetImportModal();
    },

    /**
     * Reset import modal to initial state.
     */
    resetImportModal() {
        // Clear files
        this.clearImportFile('a');
        this.clearImportFile('b');

        // Hide output section
        const outputEl = document.getElementById('import-output');
        const bodyEl = document.querySelector('#import-modal .modal-body');
        const footerEl = document.querySelector('#import-modal .modal-footer');

        if (outputEl) outputEl.style.display = 'none';
        if (bodyEl) bodyEl.style.display = 'block';
        if (footerEl) footerEl.style.display = 'flex';

        // Reset validation
        const validationEl = document.getElementById('import-validation');
        if (validationEl) validationEl.style.display = 'none';
    },

    /**
     * Generate the AI prompt from imported files.
     */
    async generateImportedPrompt() {
        const hasA = !!this.importedFiles.a;
        const hasB = !!this.importedFiles.b;
        const promptType = document.querySelector('input[name="import-type"]:checked')?.value || 'individual';

        if (!hasA) return;

        try {
            let promptText = '';
            const mode = this.importedFiles.a.mode;

            if (promptType === 'couple' && hasB) {
                const prompt = DataLoader.getPrompt('couple', mode);
                promptText = ImportManager.buildCouplePrompt(
                    this.importedFiles.a,
                    this.importedFiles.b,
                    prompt
                );
            } else {
                const prompt = DataLoader.getPrompt('individual', mode);
                promptText = ImportManager.buildIndividualPrompt(this.importedFiles.a, prompt);
            }

            // Show output
            const outputEl = document.getElementById('import-output');
            const textareaEl = document.getElementById('import-prompt-text');
            const bodyEl = document.querySelector('#import-modal .modal-body');
            const footerEl = document.querySelector('#import-modal .modal-footer');

            if (textareaEl) textareaEl.value = promptText;
            if (bodyEl) bodyEl.style.display = 'none';
            if (footerEl) footerEl.style.display = 'none';
            if (outputEl) outputEl.style.display = 'block';

        } catch (error) {
            this.showImportValidation(`Error generating prompt: ${error.message}`, 'error');
        }
    },

    /**
     * Copy the generated import prompt to clipboard.
     */
    async copyImportedPrompt() {
        const textareaEl = document.getElementById('import-prompt-text');
        const copyBtn = document.getElementById('import-copy');

        if (!textareaEl) return;

        try {
            await navigator.clipboard.writeText(textareaEl.value);

            // Visual feedback
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            }
        } catch (err) {
            // Fallback: select text
            textareaEl.select();
            alert('Press Ctrl+C or Cmd+C to copy');
        }
    },

    /**
     * Switch between import modes (continue vs ai-prompt).
     * @param {string} mode - 'continue' or 'ai-prompt'
     */
    switchImportMode(mode) {
        this.importMode = mode;

        // Update tab selection
        document.querySelectorAll('.import-mode-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.importMode === mode);
        });

        // Show/hide sections
        const continueSection = document.getElementById('import-continue-section');
        const aiSection = document.getElementById('import-ai-section');
        const continueBtn = document.getElementById('import-continue-btn');
        const generateBtn = document.getElementById('import-generate');

        if (mode === 'continue') {
            if (continueSection) continueSection.style.display = 'block';
            if (aiSection) aiSection.style.display = 'none';
            if (continueBtn) continueBtn.style.display = 'block';
            if (generateBtn) generateBtn.style.display = 'none';
        } else {
            if (continueSection) continueSection.style.display = 'none';
            if (aiSection) aiSection.style.display = 'block';
            if (continueBtn) continueBtn.style.display = 'none';
            if (generateBtn) generateBtn.style.display = 'block';
        }

        // Reset validation
        const validationEl = document.getElementById('import-validation');
        if (validationEl) validationEl.style.display = 'none';

        // Update validation for current mode
        this.updateImportValidation();
    },

    /**
     * Continue questionnaire from imported file.
     */
    async continueFromImport() {
        const file = this.importedFiles.continue;
        if (!file || !file.responses) return;

        try {
            // Load the questionnaire in the appropriate mode
            const mode = file.mode;

            // Set participant name
            this.participantName = file.name;
            const nameInput = document.getElementById('participant-name');
            if (nameInput) nameInput.value = file.name;

            // Initialize questionnaire with proper mode
            await QuestionnaireEngine.init(mode);

            // Prepare responses for validation
            let responsesToValidate = {};

            if (file.format === 'json') {
                // JSON format has { response: {...}, status: 'answered' }
                Object.entries(file.responses).forEach(([qId, data]) => {
                    if (data.response) {
                        responsesToValidate[qId] = data.response;
                    }
                    if (data.status === 'skipped') {
                        QuestionnaireEngine.skipped.add(qId);
                    }
                });
            } else if (file.format === 'txt') {
                // TXT parsed responses are direct
                responsesToValidate = { ...file.responses };
            }

            // Validate and map responses against question definitions
            // DataLoader.data.questions is an object keyed by question ID
            const questions = DataLoader.data?.questions || {};
            const { mappedResponses, needsReview, fieldWarnings } = ImportManager.validateAndMapResponses(
                responsesToValidate,
                questions
            );

            // Load the mapped responses
            QuestionnaireEngine.responses = mappedResponses;

            // Store questions needing review and field warnings for debug overlay
            this.importNeedsReview = needsReview;
            this.importWarnings = fieldWarnings;

            // Update mode switcher
            const modeSwitcher = document.getElementById('mode-switcher');
            if (modeSwitcher) modeSwitcher.value = mode;

            // Save to storage
            StorageManager.saveProgress(QuestionnaireEngine.responses, QuestionnaireEngine.currentIndex);
            StorageManager.saveSkipped(Array.from(QuestionnaireEngine.skipped));
            StorageManager.saveMode(mode);

            // Close modal
            this.hideImportModal();

            // Navigate to questionnaire
            this.showView('questionnaire');
            this.renderCurrentQuestion();
            this.updateProgress();

            // Log import summary (no intrusive alert)
            const totalImported = Object.keys(mappedResponses).length;
            const reviewCount = needsReview.length;
        } catch (error) {
            this.showImportValidation(`Error loading file: ${error.message}`, 'error');
        }
    },

    // ==================== DASHBOARD METHODS ====================

    /**
     * Render the dashboard with questionnaire cards.
     */
    async renderDashboard() {
        const grid = document.getElementById('questionnaire-grid');
        if (!grid) return;

        const phases = DataLoader.getPhases();

        // Build cards for each phase
        const cards = await Promise.all(phases.map(async (phase) => {
            // Load phase metadata to get question counts
            const metadata = await this.getPhaseMetadata(phase);

            return this.renderQuestionnaireCard(phase, metadata);
        }));

        grid.innerHTML = cards.join('');

        // Set staggered animation delay for each card (supports any number of phases)
        grid.querySelectorAll('.questionnaire-card').forEach((card, index) => {
            card.style.setProperty('--card-index', index + 1);
        });

        // Add click handlers to cards
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.questionnaire-card');
            const btn = e.target.closest('.btn');

            if (btn && card) {
                const phaseId = card.dataset.phaseId;
                const mode = btn.dataset.mode;
                if (phaseId) {
                    this.selectQuestionnaire(phaseId, mode);
                }
            } else if (card) {
                // Click on card itself - select with default mode
                const phaseId = card.dataset.phaseId;
                if (phaseId) {
                    this.selectQuestionnaire(phaseId, 'lite');
                }
            }
        });

        // Check for resume banner
        this.updateDashboardResumeBanner();

        // Setup dashboard button in nav
        document.getElementById('btn-dashboard')?.addEventListener('click', () => {
            this.showView('dashboard');
            this.renderDashboard();
        });

        // Setup dashboard resume/fresh buttons
        document.getElementById('btn-dashboard-resume')?.addEventListener('click', () => {
            const lastPhase = StorageManager.getLastPhase();
            if (lastPhase) {
                this.selectQuestionnaire(lastPhase, null, true);
            }
        });

        document.getElementById('btn-dashboard-fresh')?.addEventListener('click', () => {
            const lastPhase = StorageManager.getLastPhase() || DataLoader.getDefaultPhaseId();
            this.selectQuestionnaire(lastPhase, 'lite', false);
        });
    },

    /**
     * Get metadata for a phase including question counts.
     * @param {Object} phase - Phase object from phases.json
     * @returns {Object} Metadata including counts
     */
    async getPhaseMetadata(phase) {
        try {
            // Fetch questions.json for this phase to get counts and artifact info
            const response = await fetch(`${phase.data_path}/questions.json`);
            if (!response.ok) throw new Error('Failed to load');

            const data = await response.json();

            // Count questions by mode
            let liteCount = 0;
            let fullCount = 0;

            if (data.questions) {
                Object.values(data.questions).forEach(q => {
                    const tags = q.tags?.included_in_manifests || [];
                    if (tags.includes('lite')) liteCount++;
                    if (tags.includes('full')) fullCount++;
                });
            }

            return {
                artifact: data.artifact || {},
                intro: data.intro || {},
                sections: data.sections || [],
                liteCount,
                fullCount
            };
        } catch (error) {
            console.warn(`Could not load metadata for ${phase.id}:`, error);
            return {
                artifact: {},
                intro: {},
                sections: [],
                liteCount: 0,
                fullCount: 0
            };
        }
    },

    /**
     * Render a questionnaire card for the dashboard.
     * @param {Object} phase - Phase object
     * @param {Object} metadata - Phase metadata
     * @returns {string} HTML for the card
     */
    renderQuestionnaireCard(phase, metadata) {
        const artifact = metadata.artifact || {};

        // Format phase number
        const phaseMatch = phase.id.match(/phase_([\d.]+)/);
        const phaseLabel = phaseMatch ? `Phase ${phaseMatch[1]}` : '';

        // Get purpose/eligibility
        const purpose = artifact.purpose || phase.description ? [phase.description] : [];
        const eligibility = artifact.stage?.eligibility || [];

        return `
            <div class="questionnaire-card" data-phase-id="${phase.id}" role="listitem" tabindex="0">
                <div class="card-header">
                    <span class="card-icon">${phase.icon || '📋'}</span>
                    <div class="card-titles">
                        ${phaseLabel ? `<div class="card-phase-label">${phaseLabel}</div>` : ''}
                        <h3 class="card-title">${artifact.title || phase.title}</h3>
                    </div>
                </div>
                
                <p class="card-subtitle">${artifact.subtitle || phase.description || ''}</p>
                
                <div class="card-stats">
                    <div class="stat-item">
                        <span class="stat-value">${metadata.liteCount}</span>
                        <span class="stat-label">Lite Questions</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <span class="stat-value">${metadata.fullCount}</span>
                        <span class="stat-label">Full Questions</span>
                    </div>
                </div>
                
                ${purpose.length > 0 ? `
                    <div class="card-details">
                        <div class="card-details-title">Purpose</div>
                        <ul class="card-list">
                            ${purpose.slice(0, 3).map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="card-action">
                    <button class="btn btn-primary" data-mode="lite">
                        ✨ Lite (${metadata.liteCount})
                    </button>
                    <button class="btn btn-secondary" data-mode="full">
                        📋 Full (${metadata.fullCount})
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Update the resume banner on dashboard.
     */
    updateDashboardResumeBanner() {
        const banner = document.getElementById('dashboard-resume-banner');
        if (!banner) return;

        // Check all phases for saved progress
        const phases = DataLoader.getPhases();
        let hasProgress = false;
        let progressPhase = null;

        for (const phase of phases) {
            // Temporarily switch to each phase to check progress
            const originalPhase = StorageManager.currentPhaseId;
            StorageManager.currentPhaseId = phase.id;

            if (StorageManager.hasResumableProgress()) {
                hasProgress = true;
                progressPhase = phase;
            }

            StorageManager.currentPhaseId = originalPhase;

            if (hasProgress) break;
        }

        if (hasProgress && progressPhase) {
            banner.style.display = 'flex';
            const nameEl = document.getElementById('resume-phase-name');
            if (nameEl) {
                nameEl.textContent = `progress in ${progressPhase.short_title}`;
            }
        } else {
            banner.style.display = 'none';
        }
    },

    /**
     * Select a questionnaire from the dashboard.
     * @param {string} phaseId - Phase ID to start
     * @param {string|null} mode - Mode (lite/full) or null to use saved
     * @param {boolean} resume - Whether to resume existing progress
     */
    async selectQuestionnaire(phaseId, mode = 'lite', resume = false) {
        try {
            this.showLoading(true);

            // Set phase
            DataLoader.setCurrentPhase(phaseId);
            StorageManager.setPhase(phaseId);

            // Load phase data
            await DataLoader.load();

            // Update display
            this.updatePhaseDisplay();
            this.updateModeOptions();
            this.populatePhaseSwitcher();

            // If resuming, check for existing progress
            if (resume && StorageManager.hasResumableProgress()) {
                // Load saved progress
                const savedMode = StorageManager.loadMode();
                await QuestionnaireEngine.init(savedMode);

                const progress = StorageManager.loadProgress();
                if (progress) {
                    QuestionnaireEngine.responses = progress.responses || {};
                    QuestionnaireEngine.currentIndex = progress.currentIndex || 0;
                    QuestionnaireEngine.skipped = new Set(StorageManager.loadSkipped() || []);
                }

                // Update mode switcher
                const modeSwitcher = document.getElementById('mode-switcher');
                if (modeSwitcher) modeSwitcher.value = savedMode;

                this.showView('questionnaire');
                this.renderCurrentQuestion();
                this.updateProgress();

                this.showToast('Welcome back! Continuing where you left off.', 'success');
            } else {
                // Fresh start - go to welcome view
                if (mode) {
                    StorageManager.saveMode(mode);

                    // Update mode selection UI
                    document.querySelectorAll('.mode-option').forEach(opt => {
                        opt.classList.toggle('selected', opt.dataset.mode === mode);
                    });

                    const modeSwitcher = document.getElementById('mode-switcher');
                    if (modeSwitcher) modeSwitcher.value = mode;
                }

                this.showView('welcome');

                // Check for resume prompt
                if (StorageManager.hasResumableProgress()) {
                    this.showResumePrompt();
                }
            }

            this.showLoading(false);

            // Announce for screen readers
            const phase = DataLoader.getCurrentPhase();
            this.announce(`Selected ${phase?.title || 'questionnaire'}`);

        } catch (error) {
            console.error('Failed to select questionnaire:', error);
            this.showError('Failed to load questionnaire. Please try again.');
            this.showLoading(false);
        }
    },

    // ==================== TOAST NOTIFICATIONS ====================

    /**
     * Show a toast notification.
     * @param {string} message - Message to display
     * @param {string} type - Type: 'info', 'success', 'skip', 'error'
     * @param {number} duration - Duration in ms (default 3000)
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            info: 'ℹ️',
            success: '✓',
            skip: '⏭',
            error: '⚠️'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // ==================== BOOKMARKS ====================

    /**
     * Toggle bookmark for a question.
     * @param {string} questionId - Question ID to bookmark/unbookmark
     */
    toggleBookmark(questionId) {
        const index = this.bookmarkedQuestions.indexOf(questionId);

        if (index > -1) {
            this.bookmarkedQuestions.splice(index, 1);
            this.showToast('Bookmark removed', 'info', 2000);
        } else {
            this.bookmarkedQuestions.push(questionId);
            this.showToast('Question bookmarked for later', 'success', 2000);
        }

        // Save to storage
        StorageManager.setBookmarks(this.bookmarkedQuestions);

        // Update bookmark button in current view
        this.updateBookmarkUI(questionId);
        this.updateBookmarkCount();
    },

    /**
     * Check if a question is bookmarked.
     * @param {string} questionId - Question ID
     * @returns {boolean}
     */
    isBookmarked(questionId) {
        return this.bookmarkedQuestions.includes(questionId);
    },

    /**
     * Update bookmark UI for a specific question.
     * @param {string} questionId - Question ID
     */
    updateBookmarkUI(questionId) {
        const btn = document.querySelector(`[data-bookmark-id="${questionId}"]`);
        if (btn) {
            const isBookmarked = this.isBookmarked(questionId);
            btn.classList.toggle('bookmarked', isBookmarked);
            btn.setAttribute('aria-pressed', isBookmarked);
            btn.innerHTML = isBookmarked ? '⭐' : '☆';
        }
    },

    /**
     * Update the bookmark count display.
     */
    updateBookmarkCount() {
        const countEl = document.getElementById('bookmarked-count');
        const btn = document.getElementById('btn-show-bookmarked');

        if (countEl) {
            countEl.textContent = this.bookmarkedQuestions.length;
        }

        if (btn) {
            btn.style.display = this.bookmarkedQuestions.length > 0 ? 'inline-flex' : 'none';
        }
    },

    // ==================== ACCESSIBILITY ====================

    /**
     * Announce a message for screen readers.
     * @param {string} message - Message to announce
     */
    announce(message) {
        const region = document.getElementById('sr-announcements');
        if (region) {
            region.textContent = message;
            // Clear after announcement is read
            setTimeout(() => {
                region.textContent = '';
            }, 1000);
        }
    }
};

// Initialize on DOM ready - wait for HTML components to load first
document.addEventListener('DOMContentLoaded', () => {
    // HTMLLoader injects all HTML partials from ./html/ folder
    // before initializing the app to ensure DOM elements exist
    if (typeof HTMLLoader !== 'undefined') {
        HTMLLoader.init(() => App.init());
    } else {
        // Fallback for static HTML (all elements already in page)
        App.init();
    }
});
