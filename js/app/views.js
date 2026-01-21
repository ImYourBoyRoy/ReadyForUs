// ./js/app/views.js
/**
 * Views module for the Ready for Us.
 * 
 * Handles rendering of review and complete views.
 * Mixed into the main App object.
 * 
 * Usage: Loaded after app.js to extend App object.
 */

const AppViews = {
    /**
     * Cache DOM references for views.
     */
    cacheViews() {
        this.views.dashboard = document.getElementById('view-dashboard');
        this.views.welcome = document.getElementById('view-welcome');
        this.views.questionnaire = document.getElementById('view-questionnaire');
        this.views.review = document.getElementById('view-review');
        this.views.complete = document.getElementById('view-complete');
        this.views.comparison = document.getElementById('view-comparison');
        this.views.about = document.getElementById('view-about');
        this.views.howto = document.getElementById('view-howto');
        this.views['ai-prompts'] = document.getElementById('view-ai-prompts');
        this.views['ai-analysis'] = document.getElementById('view-ai-analysis');

        // Set initial inert state
        Object.values(this.views).forEach(view => {
            if (view) view.inert = true;
        });

        // Load bookmarks from storage
        this.bookmarkedQuestions = StorageManager.getBookmarks() || [];

        // Update navigation branding from config
        this.updateNavigationBranding();
    },

    /**
     * Update navigation bar branding from config.json.
     */
    updateNavigationBranding() {
        const config = DataLoader.getNavigationConfig();

        const logoEl = document.querySelector('.nav-logo');
        const titleEl = document.querySelector('.nav-title');

        if (logoEl && config.logo) {
            logoEl.textContent = config.logo;
        }
        if (titleEl && config.title) {
            titleEl.textContent = config.title;
        }
    },

    /**
     * Render review grid.
     */
    renderReview() {
        const grid = document.getElementById('review-grid');
        if (!grid) return;

        const stats = QuestionnaireEngine.getStats();
        const questions = QuestionnaireEngine.getQuestionsWithStatus();

        // Update stats
        document.getElementById('review-total').textContent = stats.total;
        document.getElementById('review-answered').textContent = stats.answered;
        document.getElementById('review-skipped').textContent = stats.skipped;

        // Clear and rebuild grid
        grid.innerHTML = questions.map(({ question, status, response }) => {
            return QuestionRenderer.renderReviewCard(question, response, status);
        }).join('');

        // Add click handlers for editing
        grid.querySelectorAll('.review-card').forEach((card, idx) => {
            card.addEventListener('click', () => {
                QuestionnaireEngine.jumpToIndex(idx);
                this.showView('questionnaire');
                this.renderCurrentQuestion();
            });
        });
    },

    /**
     * Render complete view.
     * Updates stats and upgrade prompt visibility.
     */
    renderComplete() {
        const stats = QuestionnaireEngine.getStats();

        // Update stats text
        const statsText = document.getElementById('complete-stats-text');
        if (statsText) {
            statsText.textContent = `${stats.answered} / ${stats.total} Questions Answered`;
        }

        // Update participant name display if it exists (for personalized messaging)
        const nameEl = document.getElementById('complete-participant-name');
        if (nameEl) {
            nameEl.textContent = this.getParticipantName() || 'Participant';
        }

        // Show/hide skip review button
        const skipBtn = document.getElementById('btn-go-skipped');
        if (skipBtn) {
            skipBtn.style.display = stats.skipped > 0 ? 'inline-block' : 'none';
        }

        // Handle upgrade prompt visibility
        const upgradeSection = document.getElementById('upgrade-section');
        const upgradeBtn = document.getElementById('btn-upgrade-full');
        const countSpan = document.getElementById('additional-count');

        if (upgradeSection) {
            if (QuestionnaireEngine.canUpgradeToFull()) {
                upgradeSection.style.display = 'block';

                if (countSpan) {
                    countSpan.textContent = QuestionnaireEngine.getAdditionalQuestionCount();
                }

                // Remove old listeners to prevent duplicates (cloning is a simple way)
                if (upgradeBtn) {
                    const newBtn = upgradeBtn.cloneNode(true);
                    upgradeBtn.parentNode.replaceChild(newBtn, upgradeBtn);
                    newBtn.addEventListener('click', () => {
                        this.upgradeToFullMode();
                    });
                }
            } else {
                upgradeSection.style.display = 'none';
            }
        }
    },

    /**
     * Render welcome intro sections dynamically from manifest.json.
     * Uses DataLoader.getIntro() to get instructions and keep_in_mind items.
     */
    renderWelcomeIntro() {
        const container = document.getElementById('welcome-intro-container');
        if (!container) return;

        const intro = DataLoader.getIntro();
        const artifact = DataLoader.getArtifact();

        // Build HTML for intro sections
        let html = '';

        // Instructions section
        if (intro.instructions?.items?.length > 0) {
            html += `
                <div class="intro-section">
                    <h2 class="intro-title">📋 ${intro.instructions.title || 'Instructions'}</h2>
                    <ul class="intro-list">
                        ${intro.instructions.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Keep in Mind section
        if (intro.keep_in_mind?.items?.length > 0) {
            html += `
                <div class="intro-section">
                    <h2 class="intro-title">💡 ${intro.keep_in_mind.title || 'Keep in Mind'}</h2>
                    <ul class="intro-list">
                        ${intro.keep_in_mind.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Fallback if no intro data
        if (!html) {
            html = `
                <div class="intro-section">
                    <h2 class="intro-title">📋 Getting Started</h2>
                    <p class="intro-text">Answer honestly and take your time. There are no wrong answers.</p>
                </div>
            `;
        }

        container.innerHTML = html;

        // Update welcome title with phase info if available
        const welcomeTitle = document.getElementById('welcome-title');
        const welcomeSubtitle = document.querySelector('.welcome-subtitle');

        if (welcomeTitle && artifact?.title) {
            welcomeTitle.textContent = artifact.title;
        }
        if (welcomeSubtitle && artifact?.subtitle) {
            welcomeSubtitle.textContent = artifact.subtitle;
        }
    },
    /**
     * Render about view (update back button text and page title).
     */
    renderAbout() {
        // Set page title
        document.title = 'About | Ready for Us';

        const btn = document.getElementById('btn-about-dashboard');
        if (!btn) return;

        // Always say Back to Home as requested
        btn.textContent = 'Back to Home';
    },

    /**
     * Render How-To view.
     * Sets page title and attaches button handlers.
     */
    renderHowto() {
        // Set page title
        document.title = 'How to Use | Ready for Us';

        // Set up back button
        // Event listener handled by delegation in init.js
    },

    /**
     * Render AI Prompts view.
     * Sets page title. Dynamic content handled by ai-prompts.js.
     */
    renderAIPrompts() {
        // Set page title
        document.title = 'AI Prompts | Ready for Us';
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppViews);
}
