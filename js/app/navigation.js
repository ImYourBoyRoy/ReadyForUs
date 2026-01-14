// ./js/app/navigation.js
/**
 * Navigation module for the Ready for Us toolkit.
 * 
 * Handles view transitions, URL routing, and keyboard navigation.
 * Mixed into the main App object.
 * 
 * Usage: Loaded after app.js to extend App object.
 */

const AppNavigation = {
    /**
     * Go to next question (or skip if unanswered).
     * Smart behavior: if user hasn't answered, this acts as skip.
     */
    nextQuestion() {
        // Clear warning for current question (user has viewed it)
        this.clearImportWarning(QuestionnaireEngine.getCurrentQuestion()?.id);

        const nextBtn = document.getElementById('btn-next');
        const isSkipState = nextBtn?.dataset.state === 'skip';
        const isLast = QuestionnaireEngine.currentIndex === QuestionnaireEngine.getTotalQuestions() - 1;

        // If button is in skip state (not answered), mark as skipped
        if (isSkipState && !QuestionnaireEngine.isCurrentAnswered()) {
            QuestionnaireEngine.markAsSkipped();
        }

        if (isLast) {
            this.showView('complete');
            this.renderComplete();
        } else if (QuestionnaireEngine.next()) {
            this.renderCurrentQuestion();
            this.updateProgress();
        }
    },

    /**
     * Go to previous question.
     */
    previousQuestion() {
        // Clear warning for current question (user has viewed it)
        this.clearImportWarning(QuestionnaireEngine.getCurrentQuestion()?.id);

        if (QuestionnaireEngine.previous()) {
            this.renderCurrentQuestion();
            this.updateProgress();
        }
    },

    /**
     * Skip current question.
     */
    skipQuestion() {
        if (QuestionnaireEngine.skip()) {
            this.renderCurrentQuestion();
            this.updateProgress();
        } else {
            // Was last question
            this.showView('complete');
            this.renderComplete();
        }
    },

    /**
     * Go to first skipped question.
     */
    goToSkipped() {
        if (QuestionnaireEngine.goToFirstSkipped()) {
            this.showView('questionnaire');
            this.renderCurrentQuestion();
        }
    },

    /**
     * Show a specific view.
     * @param {string} viewName - View name.
     */
    showView(viewName) {
        // Hide all views - use inert instead of aria-hidden to prevent focus issues
        Object.values(this.views).forEach(view => {
            if (view) {
                view.classList.remove('active');
                view.inert = true;
            }
        });

        // Show target view
        const targetView = this.views[viewName];
        if (targetView) {
            targetView.classList.add('active');
            targetView.inert = false;

            // Move focus to the view for accessibility
            targetView.focus({ preventScroll: true });
        }

        this.currentView = viewName;

        // Show/hide nav elements based on view
        const navRestart = document.getElementById('btn-nav-restart');
        const modeToggle = document.querySelector('.mode-toggle');
        const dashboardBtn = document.getElementById('btn-dashboard');

        // Dashboard/welcome/about hide most nav controls
        const showNavControls = !['dashboard', 'welcome', 'about'].includes(viewName);
        const showDashboardBtn = viewName !== 'dashboard';

        if (navRestart) {
            // Use .visible class since CSS uses opacity for this button
            navRestart.classList.toggle('visible', showNavControls);
        }
        if (modeToggle) {
            modeToggle.style.display = showNavControls ? 'flex' : 'none';
        }
        if (dashboardBtn) {
            dashboardBtn.style.display = showDashboardBtn ? 'inline-flex' : 'none';
        }

        // Special handling for review view
        if (viewName === 'review') {
            this.renderReview();
        }

        // Special handling for welcome view - render dynamic intro
        if (viewName === 'welcome') {
            this.renderWelcomeIntro();
        }

        // Scroll to top
        window.scrollTo(0, 0);

        // Reset page title and nav branding for dashboard
        if (viewName === 'dashboard') {
            document.title = 'Ready for Us | Relationship Building Toolkit';
            const navTitle = document.querySelector('.nav-title');
            const navLogo = document.querySelector('.nav-logo');
            if (navTitle) navTitle.textContent = 'Ready for Us';
            if (navLogo) navLogo.textContent = '💜';
        }

        // Update URL hash for navigation state
        if (typeof URLRouter !== 'undefined') {
            const questionId = viewName === 'questionnaire' ? QuestionnaireEngine.getCurrentQuestion()?.id : null;
            URLRouter.updateHash(viewName, questionId);
        }
    },

    /**
     * Handle keyboard navigation.
     * @param {KeyboardEvent} e - Keyboard event.
     */
    handleKeyboard(e) {
        // Only handle in questionnaire view
        if (this.currentView !== 'questionnaire') return;

        // Ignore if user is typing in an input
        const activeEl = document.activeElement;
        if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'n':
                e.preventDefault();
                this.nextQuestion();
                break;
            case 'ArrowLeft':
            case 'p':
                e.preventDefault();
                this.previousQuestion();
                break;
            case 's':
                e.preventDefault();
                this.skipQuestion();
                break;
        }
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppNavigation);
}
