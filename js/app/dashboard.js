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
    // Guard against duplicate event listener setup
    _dashboardListenersInitialized: false,
    /**
     * Render the dashboard with questionnaire cards.
     * Uses progressive loading: renders skeleton cards first, then populates
     * with metadata as it loads for better perceived performance.
     */
    async renderDashboard() {
        const grid = document.getElementById('questionnaire-grid');
        if (!grid) return;

        // Refresh menu indicators whenever dashboard is rendered
        if (typeof this.refreshMenuIndicators === 'function') {
            this.refreshMenuIndicators();
        }

        // Render dynamic header, instructions, and tips from config
        this.renderDashboardHeader();
        this.renderDashboardInstructions();
        this.renderDashboardTips();

        const phases = DataLoader.getPhases();

        // PHASE 1: Render skeleton cards immediately (no network wait)
        const skeletonCards = phases.map((phase) => this.renderSkeletonCard(phase));
        grid.innerHTML = skeletonCards.join('');

        // Set staggered animation delay for each card immediately
        grid.querySelectorAll('.questionnaire-card').forEach((card, index) => {
            card.style.setProperty('--card-index', index + 1);
        });

        // Add click handlers to cards (works even before metadata loads)
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.questionnaire-card');
            if (card) {
                const phaseId = card.dataset.phaseId;
                if (phaseId) {
                    // Check if they clicked the Continue button (resume progress)
                    const isContinueBtn = e.target.closest('.card-cta-continue');
                    if (isContinueBtn) {
                        // Resume existing progress
                        this.selectQuestionnaire(phaseId, null, true);
                    } else {
                        // Navigate to welcome page where user can choose mode
                        this.selectQuestionnaire(phaseId, null);
                    }
                }
            }
        });

        // Hide global resume banner since cards now show per-phase progress
        const resumeBanner = document.getElementById('dashboard-resume-banner');
        if (resumeBanner) {
            resumeBanner.classList.add('hidden');
        }

        // Check for install banner (PWA)
        this.updateInstallBanner();

        // Setup dashboard button listeners (only once)
        if (!this._dashboardListenersInitialized) {
            this._dashboardListenersInitialized = true;
            this.setupDashboardListeners();
        }

        // PHASE 2: Load metadata in parallel and update cards progressively
        phases.forEach(async (phase) => {
            try {
                const metadata = await this.getPhaseMetadata(phase);
                this.updateCardWithMetadata(phase.id, phase, metadata);
            } catch (error) {
                console.warn(`Failed to load metadata for ${phase.id}:`, error);
            }
        });
    },

    /**
     * Set up dashboard button event listeners.
     * Called once to avoid duplicate handlers.
     */
    setupDashboardListeners() {
        // Dashboard button in nav
        document.getElementById('btn-dashboard')?.addEventListener('click', () => {
            this.showView('dashboard');
            this.renderDashboard();
        });

        // Install app button
        document.getElementById('btn-install-app')?.addEventListener('click', async () => {
            if (typeof PWAInstall !== 'undefined' && PWAInstall.canInstall()) {
                const result = await PWAInstall.triggerInstall();
                if (result.outcome === 'accepted') {
                    this.showToast('App installed successfully! 🎉', 'success');
                }
                this.updateInstallBanner();
            }
        });

        // Resume button
        document.getElementById('btn-dashboard-resume')?.addEventListener('click', () => {
            const lastPhase = StorageManager.getLastPhase();
            if (lastPhase) {
                this.selectQuestionnaire(lastPhase, null, true);
            }
        });

        // Start fresh button
        document.getElementById('btn-dashboard-fresh')?.addEventListener('click', () => {
            const lastPhase = StorageManager.getLastPhase() || DataLoader.getDefaultPhaseId();
            this.selectQuestionnaire(lastPhase, 'lite', false);
        });

        // Listen for PWA state changes (showing banner when prompt becomes available)
        if (typeof PWAInstall !== 'undefined') {
            PWAInstall.onStateChange(() => {
                this.updateInstallBanner();
            });
        }
    },

    /**
     * Render a skeleton card while metadata loads.
     * @param {Object} phase - Phase object from phases.json
     * @returns {string} HTML for skeleton card
     */
    renderSkeletonCard(phase) {
        const phaseMatch = phase.id.match(/phase_([\d.]+)/);
        const phaseLabel = phaseMatch ? `Phase ${phaseMatch[1]}` : '';

        return `
            <div class="questionnaire-card" data-phase-id="${phase.id}" role="listitem" tabindex="0">
                <div class="card-header">
                    <span class="card-icon">${phase.icon || '📋'}</span>
                    <div class="card-titles">
                        ${phaseLabel ? `<div class="card-phase-label">${phaseLabel}</div>` : ''}
                        <h3 class="card-title">${phase.title}</h3>
                    </div>
                </div>
                
                <p class="card-subtitle">${phase.description || ''}</p>
                
                <div class="card-details card-skeleton">
                    <div class="skeleton-line skeleton-pulse"></div>
                    <div class="skeleton-line skeleton-pulse" style="width: 80%"></div>
                    <div class="skeleton-line skeleton-pulse" style="width: 60%"></div>
                </div>
                
                <div class="card-footer">
                    <div class="card-question-counts">
                        <div class="question-count-badge">
                            <span class="count-number skeleton-pulse">--</span>
                            <span class="count-label">Lite</span>
                        </div>
                        <div class="count-divider"></div>
                        <div class="question-count-badge">
                            <span class="count-number skeleton-pulse">--</span>
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
     * Get detailed progress information for a specific phase.
     * @param {string} phaseId - Phase ID to check
     * @param {Object} metadata - Phase metadata with question counts
     * @returns {Object} Progress info or null if no progress
     */
    getPhaseProgressDetails(phaseId, metadata) {
        const originalPhase = StorageManager.currentPhaseId;
        StorageManager.currentPhaseId = phaseId;

        const responses = StorageManager.loadResponses();
        const responseCount = Object.keys(responses).length;
        const mode = StorageManager.loadMode();
        const hasProgress = responseCount > 0;

        // Debug logging
        console.log(`[Progress Check] Phase: ${phaseId}, Responses: ${responseCount}, Mode: ${mode}, Metadata:`, metadata);

        // Get total questions for the saved mode
        const totalQuestions = mode === 'lite' ? (metadata.liteCount || 0) : (metadata.fullCount || 0);

        const percentage = totalQuestions > 0 ? Math.round((responseCount / totalQuestions) * 100) : 0;

        StorageManager.currentPhaseId = originalPhase;

        if (hasProgress) {
            console.log(`[Progress Detected] ${phaseId}: ${percentage}% (${responseCount}/${totalQuestions})`);
        }

        return hasProgress ? {
            hasProgress: true,
            mode,
            responseCount,
            totalQuestions,
            percentage
        } : null;
    },

    /**
     * Update a skeleton card with loaded metadata.
     * @param {string} phaseId - Phase ID
     * @param {Object} phase - Phase object
     * @param {Object} metadata - Loaded metadata
     */
    updateCardWithMetadata(phaseId, phase, metadata) {
        const card = document.querySelector(`.questionnaire-card[data-phase-id="${phaseId}"]`);
        if (!card) return;

        const artifact = metadata.artifact || {};
        const stageLabel = artifact.stage?.label || '';
        const eligibility = artifact.stage?.eligibility || [];
        const purpose = artifact.purpose || [];

        // Update phase label with stage
        const phaseLabelEl = card.querySelector('.card-phase-label');
        if (phaseLabelEl && stageLabel) {
            const currentLabel = phaseLabelEl.textContent;
            phaseLabelEl.textContent = `${currentLabel} · ${stageLabel}`;
        }

        // Update title if artifact has one
        if (artifact.title) {
            const titleEl = card.querySelector('.card-title');
            if (titleEl) titleEl.textContent = artifact.title;
        }

        // Update subtitle if artifact has one
        if (artifact.subtitle) {
            const subtitleEl = card.querySelector('.card-subtitle');
            if (subtitleEl) subtitleEl.textContent = artifact.subtitle;
        }

        // Replace skeleton details with real content
        const detailsContainer = card.querySelector('.card-details');
        if (detailsContainer) {
            detailsContainer.classList.remove('card-skeleton');

            let detailsHTML = '';

            if (eligibility.length > 0) {
                detailsHTML += `
                    <div class="card-details-title">This is for you if...</div>
                    <ul class="card-list">
                        ${eligibility.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                `;
            } else if (purpose.length > 0) {
                detailsHTML += `
                    <div class="card-details-title">Purpose</div>
                    <ul class="card-list">
                        ${purpose.slice(0, 3).map(p => `<li>${p}</li>`).join('')}
                    </ul>
                `;
            }

            detailsContainer.innerHTML = detailsHTML || '';
        }

        // Check for existing progress
        const progress = this.getPhaseProgressDetails(phaseId, metadata);

        // Update footer with progress or question counts
        const footerEl = card.querySelector('.card-footer');
        if (footerEl) {
            if (progress && progress.hasProgress) {
                // Show progress indicator and Continue button
                footerEl.innerHTML = `
                    <div class="card-progress-section">
                        <div class="progress-info">
                            <span class="progress-percentage">${progress.percentage}%</span>
                            <span class="progress-counts">${progress.responseCount}/${progress.totalQuestions} questions</span>
                            <span class="progress-mode-badge">${progress.mode === 'lite' ? 'Lite' : 'Full'} Mode</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                        </div>
                    </div>
                    <div class="card-cta card-cta-continue">
                        <span class="cta-text">Continue</span>
                        <span class="cta-arrow">→</span>
                    </div>
                `;
            } else {
                // Show normal question counts and CTA
                const liteCount = card.querySelector('.question-count-badge:first-child .count-number');
                const fullCount = card.querySelector('.question-count-badge:last-child .count-number');

                if (liteCount) {
                    liteCount.classList.remove('skeleton-pulse');
                    liteCount.textContent = metadata.liteCount || 0;
                }
                if (fullCount) {
                    fullCount.classList.remove('skeleton-pulse');
                    fullCount.textContent = metadata.fullCount || 0;
                }
            }
        }
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
            const v = DataLoader.CACHE_VERSION || '2.3.1';
            const [manifestRes, questionsRes] = await Promise.all([
                fetch(`${phase.data_path}/manifest.json?v=${v}`),
                fetch(`${phase.data_path}/questions.json?v=${v}`)
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
