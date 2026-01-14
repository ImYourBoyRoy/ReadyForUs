// ./js/app/progress.js
/**
 * Progress module for the Ready for Us.
 * 
 * Handles resume/restart functionality, mode switching, and import operations.
 * Mixed into the main App object.
 * 
 * Usage: Loaded after app.js to extend App object.
 */

const AppProgress = {
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
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppProgress);
}
