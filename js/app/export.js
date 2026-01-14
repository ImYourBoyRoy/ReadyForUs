// ./js/app/export.js
/**
 * Export module for the Ready for Us.
 * 
 * Handles all export operations: text, JSON, clipboard, AI prompts.
 * Also manages save modal functionality.
 * Mixed into the main App object.
 * 
 * Usage: Loaded after app.js to extend App object.
 */

const AppExport = {
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
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppExport);
}
