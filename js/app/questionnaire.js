// ./js/app/questionnaire.js
/**
 * Questionnaire module for the Ready for Us.
 * 
 * Handles question rendering, input handling, and progress updates.
 * Core questionnaire flow functionality.
 * Mixed into the main App object.
 * 
 * Usage: Loaded after app.js to extend App object.
 */

const AppQuestionnaire = {
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
        this.updateModeDisplay();
    },

    /**
     * Render the current question.
     */
    renderCurrentQuestion() {
        const container = document.getElementById('question-container');
        if (!container) return;

        // Scroll to top for consistent UX between questions
        window.scrollTo({ top: 0, behavior: 'smooth' });

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

        // Set up ranked-select drag-and-drop handlers if present
        this.setupRankedSelectHandlers(question);

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
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppQuestionnaire);
}
