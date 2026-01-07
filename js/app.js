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
        welcome: null,
        questionnaire: null,
        review: null,
        complete: null
    },
    currentView: 'welcome',
    participantName: '',

    /**
     * Initialize the application.
     */
    async init() {
        try {
            // Show loading state
            this.showLoading(true);

            // Load data
            await DataLoader.load();

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

            // Show welcome
            this.showView('welcome');

            // Initialize mode switcher to saved mode
            const savedMode = StorageManager.loadMode();
            const modeSwitcher = document.getElementById('mode-switcher');
            if (modeSwitcher) {
                modeSwitcher.value = savedMode;
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
        this.views.welcome = document.getElementById('view-welcome');
        this.views.questionnaire = document.getElementById('view-questionnaire');
        this.views.review = document.getElementById('view-review');
        this.views.complete = document.getElementById('view-complete');
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

        // Navigation buttons
        document.getElementById('btn-prev')?.addEventListener('click', () => this.previousQuestion());
        document.getElementById('btn-next')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('btn-skip')?.addEventListener('click', () => this.skipQuestion());

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

        // Resume buttons
        document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeProgress());
        document.getElementById('btn-start-fresh')?.addEventListener('click', () => this.startFresh());

        // Import button and file input
        document.getElementById('btn-import')?.addEventListener('click', () => {
            document.getElementById('import-file')?.click();
        });
        document.getElementById('import-file')?.addEventListener('change', (e) => this.handleImport(e));

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

        // Mode switcher in nav
        document.getElementById('mode-switcher')?.addEventListener('change', (e) => {
            this.switchMode(e.target.value);
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
    },

    /**
     * Update navigation button states.
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        const skipBtn = document.getElementById('btn-skip');

        const isFirst = QuestionnaireEngine.currentIndex === 0;
        const isLast = QuestionnaireEngine.currentIndex === QuestionnaireEngine.getTotalQuestions() - 1;
        const isAnswered = QuestionnaireEngine.isCurrentAnswered();
        const isSkipped = QuestionnaireEngine.isCurrentSkipped();

        if (prevBtn) {
            prevBtn.disabled = isFirst;
            prevBtn.style.visibility = isFirst ? 'hidden' : 'visible';
        }

        if (nextBtn) {
            nextBtn.textContent = isLast ? 'Finish' : 'Next';
            nextBtn.classList.toggle('btn-primary', isAnswered);
            nextBtn.classList.toggle('btn-secondary', !isAnswered);
        }

        if (skipBtn) {
            skipBtn.style.display = isAnswered || isSkipped ? 'none' : 'inline-flex';
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
     * Go to next question.
     */
    nextQuestion() {
        const isLast = QuestionnaireEngine.currentIndex === QuestionnaireEngine.getTotalQuestions() - 1;

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

        // Show/hide nav elements (hide on welcome view)
        const navRestart = document.getElementById('btn-nav-restart');
        const modeSwitcher = document.getElementById('mode-switcher');
        const showNavControls = viewName !== 'welcome';

        if (navRestart) {
            navRestart.classList.toggle('visible', showNavControls);
        }
        if (modeSwitcher) {
            modeSwitcher.style.display = showNavControls ? 'block' : 'none';
        }

        // Special handling for review view
        if (viewName === 'review') {
            this.renderReview();
        }

        // Scroll to top
        window.scrollTo(0, 0);
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
            return QuestionRenderer.renderReviewCard(question, response, status);
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
        const modeSwitcher = document.getElementById('mode-switcher');
        if (modeSwitcher) {
            modeSwitcher.value = QuestionnaireEngine.mode;
        }
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
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
