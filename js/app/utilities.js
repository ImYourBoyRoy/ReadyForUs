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
    },

    /**
     * Show a "Hard Reset" button for users stuck in a broken state.
     */
    showResetOption() {
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '⚠️ Fix App (Hard Reset)';
        resetBtn.className = 'btn-primary';
        resetBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: #e74c3c; color: white; padding: 12px 24px; border-radius: 50px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: none; font-weight: bold; font-family: inherit;';
        resetBtn.onclick = () => this.hardReset();
        document.body.appendChild(resetBtn);
    },

    /**
     * Nuke everything and reload.
     * Unregisters SW, clears localStorage/sessionStorage.
     */
    async hardReset() {
        if (!confirm('This will fix the app by clearing all local data. Your saved progress might be lost if not exported. Continue?')) {
            return;
        }

        try {
            // Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            // Clear Storage
            localStorage.clear();
            sessionStorage.clear();

            // Clear Cache API
            if ('caches' in window) {
                const keys = await caches.keys();
                for (const key of keys) {
                    await caches.delete(key);
                }
            }

            // Force Reload
            window.location.reload(true);
        } catch (e) {
            console.error('Reset failed:', e);
            alert('Failed to reset automatically. Please clear browser data manually.');
        }
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppUtilities);
}
