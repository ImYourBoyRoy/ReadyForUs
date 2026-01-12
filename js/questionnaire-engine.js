// ./js/questionnaire-engine.js
/**
 * Questionnaire engine module for the Slow Build Check-In questionnaire.
 * 
 * Core state machine handling navigation, responses, skip logic, and progress tracking.
 * Coordinates between data loader, storage, and renderer.
 * 
 * Usage: Import and call QuestionnaireEngine.init() after data is loaded.
 */

const QuestionnaireEngine = {
    // State
    mode: 'lite',           // 'full' or 'lite'
    questions: [],          // Array of question objects for current mode
    currentIndex: 0,        // Current question index
    responses: {},          // Responses keyed by question ID
    skipped: [],            // Array of skipped question IDs
    isReviewMode: false,    // Whether in review mode

    /**
     * Initialize the questionnaire engine.
     * @param {string} mode - 'full' or 'lite'
     */
    async init(mode = 'lite') {
        this.mode = mode;
        this.questions = DataLoader.getQuestions(mode);

        // Load saved state
        this.responses = StorageManager.loadResponses();
        this.skipped = StorageManager.loadSkipped();

        // Check for resume
        const progress = StorageManager.loadProgress();
        if (progress && progress.index < this.questions.length) {
            this.currentIndex = progress.index;
        } else {
            this.currentIndex = 0;
        }

        StorageManager.saveMode(mode);
    },

    /**
     * Get the current question.
     * @returns {Object|null} Current question or null.
     */
    getCurrentQuestion() {
        return this.questions[this.currentIndex] || null;
    },

    /**
     * Get the current question index (1-based for display).
     * @returns {number} Current question number.
     */
    getCurrentNumber() {
        return this.currentIndex + 1;
    },

    /**
     * Get total question count.
     * @returns {number} Total questions.
     */
    getTotalQuestions() {
        return this.questions.length;
    },

    /**
     * Get progress as a percentage (0-100).
     * @returns {number} Progress percentage.
     */
    getProgress() {
        const answered = Object.keys(this.responses).filter(id =>
            this.questions.some(q => q.id === id)
        ).length;
        return Math.round((answered / this.questions.length) * 100);
    },

    /**
     * Get the response for a specific question.
     * @param {string} questionId - Question ID.
     * @returns {Object} Response object.
     */
    getResponse(questionId) {
        return this.responses[questionId] || {};
    },

    /**
     * Save a response for the current question.
     * @param {string} questionId - Question ID.
     * @param {Object} response - Response data.
     */
    saveResponse(questionId, response) {
        this.responses[questionId] = response;
        StorageManager.saveResponses(this.responses);

        // Remove from skipped if it was skipped
        this.skipped = this.skipped.filter(id => id !== questionId);
        StorageManager.saveSkipped(this.skipped);
    },

    /**
     * Update a field in the current response.
     * @param {string} questionId - Question ID.
     * @param {string} field - Field name.
     * @param {*} value - Field value.
     */
    updateResponseField(questionId, field, value) {
        if (!this.responses[questionId]) {
            this.responses[questionId] = {};
        }
        this.responses[questionId][field] = value;
        StorageManager.saveResponses(this.responses);
    },

    /**
     * Navigate to the next question.
     * @returns {boolean} True if navigation succeeded.
     */
    next() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            StorageManager.saveProgress(this.currentIndex);
            return true;
        }
        return false;
    },

    /**
     * Navigate to the previous question.
     * @returns {boolean} True if navigation succeeded.
     */
    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            StorageManager.saveProgress(this.currentIndex);
            return true;
        }
        return false;
    },

    /**
     * Jump to a specific question by ID.
     * @param {string} questionId - Question ID.
     * @returns {boolean} True if found and jumped.
     */
    jumpTo(questionId) {
        const index = this.questions.findIndex(q => q.id === questionId);
        if (index !== -1) {
            this.currentIndex = index;
            StorageManager.saveProgress(this.currentIndex);
            return true;
        }
        return false;
    },

    /**
     * Jump to a specific index.
     * @param {number} index - Question index (0-based).
     * @returns {boolean} True if valid index.
     */
    jumpToIndex(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentIndex = index;
            StorageManager.saveProgress(this.currentIndex);
            return true;
        }
        return false;
    },

    /**
     * Skip the current question.
     * @returns {boolean} True if skipped and moved to next.
     */
    skip() {
        const currentQ = this.getCurrentQuestion();
        if (currentQ && !this.skipped.includes(currentQ.id)) {
            this.skipped.push(currentQ.id);
            StorageManager.saveSkipped(this.skipped);
        }
        return this.next();
    },

    /**
     * Mark the current question as skipped (without navigating).
     * Used by the smart Next/Skip button.
     */
    markAsSkipped() {
        const currentQ = this.getCurrentQuestion();
        if (currentQ && !this.skipped.includes(currentQ.id)) {
            this.skipped.push(currentQ.id);
            StorageManager.saveSkipped(this.skipped);
        }
    },

    /**
     * Get the count of skipped questions.
     * @returns {number} Number of skipped questions.
     */
    getSkippedCount() {
        return this.skipped.length;
    },

    /**
     * Get the list of skipped questions.
     * @returns {Array<Object>} Array of skipped question objects.
     */
    getSkippedQuestions() {
        return this.skipped.map(id => this.questions.find(q => q.id === id)).filter(Boolean);
    },

    /**
     * Jump to the first skipped question.
     * @returns {boolean} True if jumped to a skipped question.
     */
    goToFirstSkipped() {
        if (this.skipped.length > 0) {
            return this.jumpTo(this.skipped[0]);
        }
        return false;
    },

    /**
     * Check if the current question has been answered.
     * @returns {boolean} True if answered.
     */
    isCurrentAnswered() {
        const current = this.getCurrentQuestion();
        if (!current) return false;

        const response = this.responses[current.id];
        if (!response) return false;

        // Check based on question type
        switch (current.type) {
            case 'single_select':
                return !!response.selected_value;
            case 'multi_select':
                return response.selected_values?.length > 0;
            case 'free_text':
                return !!response.text?.trim();
            case 'compound':
                // Check if at least one field has a value
                return Object.keys(response).some(key => {
                    const val = response[key];
                    if (Array.isArray(val)) return val.length > 0;
                    return !!val;
                });
            default:
                return false;
        }
    },

    /**
     * Check if the current question was skipped.
     * @returns {boolean} True if skipped.
     */
    isCurrentSkipped() {
        const current = this.getCurrentQuestion();
        return current ? this.skipped.includes(current.id) : false;
    },

    /**
     * Get the status of a question.
     * @param {string} questionId - Question ID.
     * @returns {string} 'answered', 'skipped', or 'unanswered'.
     */
    getQuestionStatus(questionId) {
        const response = this.responses[questionId];
        const question = this.questions.find(q => q.id === questionId);

        if (!question) return 'unanswered';

        // Check if answered
        let answered = false;
        if (response) {
            switch (question.type) {
                case 'single_select':
                    answered = !!response.selected_value;
                    break;
                case 'multi_select':
                    answered = response.selected_values?.length > 0;
                    break;
                case 'free_text':
                    answered = !!response.text?.trim();
                    break;
                case 'compound':
                    answered = Object.keys(response).some(key => {
                        const val = response[key];
                        if (Array.isArray(val)) return val.length > 0;
                        return !!val;
                    });
                    break;
            }
        }

        if (answered) return 'answered';
        if (this.skipped.includes(questionId)) return 'skipped';
        return 'unanswered';
    },

    /**
     * Check if the questionnaire is complete.
     * @returns {boolean} True if all questions answered.
     */
    isComplete() {
        return this.questions.every(q => this.getQuestionStatus(q.id) === 'answered');
    },

    /**
     * Get summary statistics.
     * @returns {Object} Stats object.
     */
    getStats() {
        let answered = 0;
        let skipped = 0;
        let unanswered = 0;

        this.questions.forEach(q => {
            const status = this.getQuestionStatus(q.id);
            if (status === 'answered') answered++;
            else if (status === 'skipped') skipped++;
            else unanswered++;
        });

        return {
            total: this.questions.length,
            answered,
            skipped,
            unanswered,
            progress: this.getProgress()
        };
    },

    /**
     * Reset the questionnaire (clear all progress).
     */
    reset() {
        this.currentIndex = 0;
        this.responses = {};
        this.skipped = [];
        StorageManager.clearAll();
    },

    /**
     * Get the section title for the current question.
     * @returns {string} Section title.
     */
    getCurrentSectionTitle() {
        const current = this.getCurrentQuestion();
        if (!current) return '';

        const section = DataLoader.getSectionForQuestion(current.id);
        return section ? section.title : '';
    },

    /**
     * Initialize with mode switch (Lite ↔ Full).
     * Keeps existing responses and goes to last answered question.
     * @param {string} newMode - The new mode ('full' or 'lite').
     * @returns {Object} Result with success status and target question index.
     */
    async initWithUpgrade(newMode = 'full') {
        // Store the previous mode and questions answered
        const previousMode = this.mode;
        const previousAnswers = { ...this.responses };
        const previousSkipped = [...this.skipped];

        // Get the new question set
        this.mode = newMode;
        this.questions = DataLoader.getQuestions(newMode);

        // Preserve existing responses
        this.responses = previousAnswers;
        this.skipped = previousSkipped.filter(id =>
            this.questions.some(q => q.id === id)
        );

        // Find the last answered question in the new mode's question set
        let lastAnsweredIndex = 0;
        for (let i = this.questions.length - 1; i >= 0; i--) {
            const status = this.getQuestionStatus(this.questions[i].id);
            if (status === 'answered') {
                lastAnsweredIndex = i;
                break;
            }
        }

        this.currentIndex = lastAnsweredIndex;
        StorageManager.saveMode(newMode);
        StorageManager.saveProgress(this.currentIndex);

        return {
            success: true,
            previousMode,
            newMode,
            targetQuestionIndex: lastAnsweredIndex,
            existingAnswers: Object.keys(previousAnswers).length,
            newQuestions: this.questions.length
        };
    },

    /**
     * Get IDs of all answered questions.
     * @returns {Array<string>} Array of answered question IDs.
     */
    getAnsweredQuestionIds() {
        return Object.keys(this.responses);
    },

    /**
     * Check if user can upgrade from Lite to Full.
     * @returns {boolean} True if in Lite mode and Full has more questions.
     */
    canUpgradeToFull() {
        if (this.mode !== 'lite') return false;

        const fullQuestions = DataLoader.getQuestions('full');
        const liteQuestions = DataLoader.getQuestions('lite');

        // Always allow upgrade if Full has more questions
        return fullQuestions.length > liteQuestions.length;
    },

    /**
     * Get count of additional questions available in Full mode.
     * @returns {number} Number of additional questions.
     */
    getAdditionalFullQuestionCount() {
        const fullQuestions = DataLoader.getQuestions('full');
        const liteQuestions = DataLoader.getQuestions('lite');
        return fullQuestions.length - liteQuestions.length;
    }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionnaireEngine;
}
