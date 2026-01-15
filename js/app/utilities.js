// ./js/app/utilities.js
/**
 * Utilities module for the Ready for Us.
 * 
 * General utility functions: loading states, error handling, import warnings.
 * Mixed into the main App object.
 * 
 * Usage: Loaded after app.js to extend App object.
 */

const AppUtilities = {
    /**
     * Show loading state.
     * @param {boolean} show - Whether to show loading.
     */
    showLoading(show) {
        const loader = document.getElementById('loader-container');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
        // Prevent body scroll while loading
        document.body.style.overflow = show ? 'hidden' : '';
    },

    /**
     * Show error message.
     * @param {string} message - Error message.
     */
    showError(message) {
        console.error(message);
        // Use toast if available, otherwise just console
        if (typeof this.showToast === 'function') {
            this.showToast(message, 'error');
        } else {
            alert(message); // Fallback for critical init errors
        }
    },

    /**
     * Clear import warning for a question (user has reviewed it).
     * @param {string} questionId - Question ID to clear.
     */
    clearImportWarning(questionId) {
        if (!questionId) return;

        // Remove from needs review
        if (this.importNeedsReview) {
            const idx = this.importNeedsReview.indexOf(questionId);
            if (idx > -1) {
                this.importNeedsReview.splice(idx, 1);
            }
        }

        // Remove from field warnings
        if (this.importWarnings) {
            delete this.importWarnings[questionId];
        }
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppUtilities);
}
