// ./js/app/phase.js
/**
 * Phase module for the Ready for Us.
 * 
 * Handles phase switching, mode updates, and phase-related display updates.
 * Mixed into the main App object.
 * 
 * Usage: Loaded after app.js to extend App object.
 */

const AppPhase = {
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
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppPhase);
}
