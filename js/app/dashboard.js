// ./js/app/dashboard.js
/**
 * Dashboard module for the Ready for Us.
 * 
 * Handles rendering and managing the main dashboard with questionnaire cards.
 * Manages phase metadata loading and card display.
 * Mixed into the main App object.
 * 
 * Usage: App.renderDashboard() to render the dashboard view.
 */

const AppDashboard = {
    /**
     * Render the dashboard with questionnaire cards.
     */
    async renderDashboard() {
        const grid = document.getElementById('questionnaire-grid');
        if (!grid) return;

        // Render dynamic header, instructions, and tips from config
        this.renderDashboardHeader();
        this.renderDashboardInstructions();
        this.renderDashboardTips();

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
            if (card) {
                const phaseId = card.dataset.phaseId;
                if (phaseId) {
                    // Navigate to welcome page where user can choose mode
                    this.selectQuestionnaire(phaseId, null);
                }
            }
        });

        // Check for resume banner
        this.updateDashboardResumeBanner();

        // Check for install banner (PWA)
        this.updateInstallBanner();

        // Setup dashboard button in nav
        document.getElementById('btn-dashboard')?.addEventListener('click', () => {
            this.showView('dashboard');
            this.renderDashboard();
        });

        // Setup install button
        document.getElementById('btn-install-app')?.addEventListener('click', async () => {
            if (typeof PWAInstall !== 'undefined' && PWAInstall.canInstall()) {
                const result = await PWAInstall.triggerInstall();
                if (result.outcome === 'accepted') {
                    this.showToast('App installed successfully! 🎉', 'success');
                }
                this.updateInstallBanner();
            }
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
     * Render dashboard header from config.
     */
    renderDashboardHeader() {
        const config = DataLoader.getDashboardConfig();

        const iconEl = document.querySelector('.dashboard-icon');
        const titleEl = document.getElementById('dashboard-title');
        const subtitleEl = document.querySelector('.dashboard-subtitle');

        if (iconEl && config.icon) {
            iconEl.textContent = config.icon;
        }
        if (titleEl && config.title) {
            titleEl.textContent = config.title;
        }
        if (subtitleEl && config.subtitle) {
            subtitleEl.textContent = config.subtitle;
        }
    },

    /**
     * Render dashboard instructions from config.
     */
    renderDashboardInstructions() {
        const container = document.getElementById('dashboard-instructions');
        if (!container) return;

        const config = DataLoader.getDashboardConfig();
        const instructions = config.instructions;

        if (!instructions || !instructions.items?.length) {
            container.innerHTML = '';
            return;
        }

        const itemsHTML = instructions.items.map(item => `
            <div class="instruction-item">
                <span class="instruction-icon">${item.icon || '•'}</span>
                <span class="instruction-text"><strong>${item.title}</strong> ${item.text}</span>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="instructions-header">
                <span class="instructions-icon">${instructions.icon || '📋'}</span>
                <h2 class="instructions-title">${instructions.title || 'How These Work'}</h2>
            </div>
            <div class="instructions-grid">
                ${itemsHTML}
            </div>
        `;
    },

    /**
     * Render dashboard tips from config.
     */
    renderDashboardTips() {
        const container = document.getElementById('dashboard-tips');
        if (!container) return;

        const config = DataLoader.getDashboardConfig();
        const tips = config.tips;

        if (!tips || !tips.length) {
            container.innerHTML = '';
            return;
        }

        // Render the first tip (or could rotate through tips)
        const tip = tips[0];
        container.innerHTML = `
            <div class="tips-title">${tip.icon || '💡'} ${tip.title || 'Tip'}</div>
            <div class="tips-content">${tip.text}</div>
        `;
    },

    /**
     * Get metadata for a phase including question counts.
     * @param {Object} phase - Phase object from phases.json
     * @returns {Object} Metadata including counts
     */
    async getPhaseMetadata(phase) {
        try {
            // Fetch manifest.json and questions.json for this phase
            const [manifestRes, questionsRes] = await Promise.all([
                fetch(`${phase.data_path}/manifest.json`),
                fetch(`${phase.data_path}/questions.json`)
            ]);

            if (!manifestRes.ok || !questionsRes.ok) throw new Error('Failed to load');

            const manifest = await manifestRes.json();
            const data = await questionsRes.json();

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
                artifact: manifest.artifact || {},
                intro: manifest.intro || {},
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

        // Get stage label and eligibility from manifest
        const stageLabel = artifact.stage?.label || '';
        const eligibility = artifact.stage?.eligibility || [];
        const purpose = artifact.purpose || [];

        return `
            <div class="questionnaire-card" data-phase-id="${phase.id}" role="listitem" tabindex="0">
                <div class="card-header">
                    <span class="card-icon">${phase.icon || '📋'}</span>
                    <div class="card-titles">
                        ${phaseLabel ? `<div class="card-phase-label">${phaseLabel}${stageLabel ? ` · ${stageLabel}` : ''}</div>` : ''}
                        <h3 class="card-title">${artifact.title || phase.title}</h3>
                    </div>
                </div>
                
                <p class="card-subtitle">${artifact.subtitle || phase.description || ''}</p>
                
                ${eligibility.length > 0 ? `
                    <div class="card-details">
                        <div class="card-details-title">This is for you if...</div>
                        <ul class="card-list">
                            ${eligibility.map(e => `<li>${e}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${purpose.length > 0 ? `
                    <div class="card-details">
                        <div class="card-details-title">Purpose</div>
                        <ul class="card-list">
                            ${purpose.slice(0, 3).map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="card-footer">
                    <div class="card-question-counts">
                        <div class="question-count-badge">
                            <span class="count-number">${metadata.liteCount}</span>
                            <span class="count-label">Lite</span>
                        </div>
                        <div class="count-divider"></div>
                        <div class="question-count-badge">
                            <span class="count-number">${metadata.fullCount}</span>
                            <span class="count-label">Full</span>
                        </div>
                    </div>
                    <div class="card-cta">
                        <span class="cta-text">Tap to Begin</span>
                        <span class="cta-arrow">→</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Update the install banner on dashboard.
     * Shows when PWA can be installed.
     */
    updateInstallBanner() {
        const banner = document.getElementById('dashboard-install-banner');
        if (!banner) return;

        // Check if PWA install is available
        if (typeof PWAInstall !== 'undefined' && PWAInstall.canInstall()) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
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
            banner.classList.remove('hidden');
            const nameEl = document.getElementById('resume-phase-name');
            if (nameEl) {
                nameEl.textContent = `progress in ${progressPhase.short_title}`;
            }
        } else {
            banner.classList.add('hidden');
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
                    QuestionnaireEngine.skipped = StorageManager.loadSkipped() || [];
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
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppDashboard);
}
