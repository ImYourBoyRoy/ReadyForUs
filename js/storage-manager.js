// ./js/storage-manager.js
/**
 * Storage manager module for the Slow Build Check-In questionnaire.
 * 
 * Handles localStorage for saving/loading progress, theme preferences,
 * and participant information. Provides auto-save and resume functionality.
 * 
 * Usage: Import and use StorageManager methods to persist state.
 */

const StorageManager = {
    KEYS: {
        RESPONSES: 'slowbuild_responses',
        PROGRESS: 'slowbuild_progress',
        THEME: 'slowbuild_theme',
        PARTICIPANTS: 'slowbuild_participants',
        PARTICIPANT_NAME: 'slowbuild_participant_name',
        MODE: 'slowbuild_mode',
        SKIPPED: 'slowbuild_skipped'
    },

    /**
     * Save responses to localStorage.
     * @param {Object} responses - Response object keyed by question ID.
     */
    saveResponses(responses) {
        try {
            localStorage.setItem(this.KEYS.RESPONSES, JSON.stringify(responses));
        } catch (e) {
            console.error('Failed to save responses:', e);
        }
    },

    /**
     * Load responses from localStorage.
     * @returns {Object} Saved responses or empty object.
     */
    loadResponses() {
        try {
            const saved = localStorage.getItem(this.KEYS.RESPONSES);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Failed to load responses:', e);
            return {};
        }
    },

    /**
     * Save current progress (question index).
     * @param {number} index - Current question index.
     */
    saveProgress(index) {
        try {
            localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify({ index, timestamp: Date.now() }));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    },

    /**
     * Load saved progress.
     * @returns {Object|null} Progress object with index and timestamp, or null.
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.KEYS.PROGRESS);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Failed to load progress:', e);
            return null;
        }
    },

    /**
     * Save skipped question IDs.
     * @param {Array<string>} skipped - Array of skipped question IDs.
     */
    saveSkipped(skipped) {
        try {
            localStorage.setItem(this.KEYS.SKIPPED, JSON.stringify(skipped));
        } catch (e) {
            console.error('Failed to save skipped:', e);
        }
    },

    /**
     * Load skipped question IDs.
     * @returns {Array<string>} Array of skipped question IDs.
     */
    loadSkipped() {
        try {
            const saved = localStorage.getItem(this.KEYS.SKIPPED);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load skipped:', e);
            return [];
        }
    },

    /**
     * Save theme preference.
     * @param {string} theme - Theme name.
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.KEYS.THEME, theme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    },

    /**
     * Load theme preference.
     * @returns {string|null} Saved theme name or null.
     */
    loadTheme() {
        try {
            return localStorage.getItem(this.KEYS.THEME);
        } catch (e) {
            console.error('Failed to load theme:', e);
            return null;
        }
    },

    /**
     * Save participant information.
     * @param {Array<Object>} participants - Array of participant objects.
     */
    saveParticipants(participants) {
        try {
            localStorage.setItem(this.KEYS.PARTICIPANTS, JSON.stringify(participants));
        } catch (e) {
            console.error('Failed to save participants:', e);
        }
    },

    /**
     * Load participant information.
     * @returns {Array<Object>} Array of participant objects.
     */
    loadParticipants() {
        try {
            const saved = localStorage.getItem(this.KEYS.PARTICIPANTS);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load participants:', e);
            return [];
        }
    },

    /**
     * Save mode preference (full/lite).
     * @param {string} mode - 'full' or 'lite'.
     */
    saveMode(mode) {
        try {
            localStorage.setItem(this.KEYS.MODE, mode);
        } catch (e) {
            console.error('Failed to save mode:', e);
        }
    },

    /**
     * Load mode preference.
     * @returns {string} Saved mode or 'lite' as default.
     */
    loadMode() {
        try {
            return localStorage.getItem(this.KEYS.MODE) || 'lite';
        } catch (e) {
            console.error('Failed to load mode:', e);
            return 'lite';
        }
    },

    /**
     * Save participant name.
     * @param {string} name - Participant name.
     */
    saveParticipantName(name) {
        try {
            localStorage.setItem(this.KEYS.PARTICIPANT_NAME, name);
        } catch (e) {
            console.error('Failed to save participant name:', e);
        }
    },

    /**
     * Load participant name.
     * @returns {string} Saved participant name or 'Participant' as default.
     */
    loadParticipantName() {
        try {
            return localStorage.getItem(this.KEYS.PARTICIPANT_NAME) || 'Participant';
        } catch (e) {
            console.error('Failed to load participant name:', e);
            return 'Participant';
        }
    },

    /**
     * Check if there's saved progress to resume.
     * @returns {boolean} True if resumable progress exists.
     */
    hasResumableProgress() {
        const responses = this.loadResponses();
        return Object.keys(responses).length > 0;
    },

    /**
     * Clear all saved data.
     */
    clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (e) {
            console.error('Failed to clear storage:', e);
        }
    },

    /**
     * Export all saved data as a single object.
     * @returns {Object} All saved data.
     */
    exportAll() {
        return {
            responses: this.loadResponses(),
            progress: this.loadProgress(),
            skipped: this.loadSkipped(),
            participants: this.loadParticipants(),
            mode: this.loadMode(),
            theme: this.loadTheme(),
            exportedAt: new Date().toISOString()
        };
    }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
