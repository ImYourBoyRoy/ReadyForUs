// ./js/debug-overlay.js
/**
 * Debug overlay for the Slow Build Check-In questionnaire.
 * 
 * Provides a visual overlay showing raw response data and import status
 * for debugging purposes. Activated via ?debug=true URL parameter.
 * 
 * Usage: Add ?debug=true to the URL to enable the debug overlay.
 * Toggle visibility with Ctrl+D or click the debug button.
 */

const DebugOverlay = {
    enabled: false,
    visible: false,

    /**
     * Initialize the debug overlay if ?debug=true is in the URL.
     */
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.enabled = urlParams.get('debug') === 'true';

        if (!this.enabled) return;

        this.createOverlay();
        this.setupKeyboardShortcut();
        console.log('[Debug] Debug overlay enabled. Press Ctrl+D to toggle.');
    },

    /**
     * Create the debug overlay DOM elements.
     */
    createOverlay() {
        // Create toggle button
        const button = document.createElement('button');
        button.id = 'debug-toggle';
        button.innerHTML = '🐛';
        button.title = 'Toggle Debug Overlay (Ctrl+D)';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            background: #333;
            color: white;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        button.addEventListener('click', () => this.toggle());
        document.body.appendChild(button);

        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            width: 400px;
            max-height: calc(100vh - 100px);
            background: rgba(30, 30, 40, 0.95);
            color: #e0e0e0;
            border-radius: 12px;
            padding: 16px;
            z-index: 9999;
            overflow-y: auto;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            display: none;
            user-select: text;
            -webkit-user-select: text;
        `;
        overlay.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom: 1px solid #444; padding-bottom:8px;">
                <h3 style="margin:0; color:#fff; font-size:14px;">🐛 Debug Overlay</h3>
                <div>
                    <button id="debug-copy" style="background:#444; border:none; color:#fff; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:8px;" title="Copy JSON">📋</button>
                    <button id="debug-close" style="background:none; border:none; color:#888; font-size:20px; cursor:pointer;">&times;</button>
                </div>
            </div>
            <div id="debug-content">
                <p style="color:#888;">Loading...</p>
            </div>
        `;
        document.body.appendChild(overlay);

        // Pause refresh when mouse is over overlay (so user can select text)
        overlay.addEventListener('mouseenter', () => { this.paused = true; });
        overlay.addEventListener('mouseleave', () => { this.paused = false; });

        document.getElementById('debug-close').addEventListener('click', () => this.toggle());
        document.getElementById('debug-copy').addEventListener('click', () => this.copyResponse());

        // Update when question changes
        this.observeChanges();
    },

    /**
     * Toggle overlay visibility.
     */
    toggle() {
        this.visible = !this.visible;
        const overlay = document.getElementById('debug-overlay');
        if (overlay) {
            overlay.style.display = this.visible ? 'block' : 'none';
            if (this.visible) this.update();
        }
    },

    /**
     * Setup keyboard shortcut (Ctrl+D).
     */
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggle();
            }
        });
    },

    /**
     * Observe DOM changes to update overlay when question changes.
     */
    observeChanges() {
        // Update periodically when visible and not paused (mouse not hovering)
        setInterval(() => {
            if (this.visible && !this.paused) this.update();
        }, 500);
    },

    /**
     * Copy the current response JSON to clipboard.
     */
    copyResponse() {
        const currentQ = QuestionnaireEngine?.getCurrentQuestion();
        if (!currentQ) return;

        const qId = currentQ.id;
        const response = QuestionnaireEngine.responses[qId] || {};
        const text = JSON.stringify(response, null, 2);

        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('debug-copy');
            if (btn) {
                btn.textContent = '✓';
                setTimeout(() => { btn.textContent = '📋'; }, 1500);
            }
        });
    },

    /**
     * Update the overlay content with current question data.
     */
    update() {
        const content = document.getElementById('debug-content');
        if (!content || typeof QuestionnaireEngine === 'undefined') return;

        const currentQ = QuestionnaireEngine.getCurrentQuestion();
        if (!currentQ) {
            content.innerHTML = '<p style="color:#888;">No current question</p>';
            return;
        }

        const qId = currentQ.id;
        const response = QuestionnaireEngine.responses[qId] || {};
        const importWarnings = window.App?.importWarnings?.[qId] || [];
        const needsReview = window.App?.importNeedsReview?.includes(qId);

        // Build field status for compound questions
        let fieldStatus = '';
        if (currentQ.type === 'compound' && currentQ.fields) {
            fieldStatus = '<div style="margin-top:12px; border-top:1px solid #444; padding-top:8px;">';
            fieldStatus += '<h4 style="color:#fff; margin:0 0 8px 0; font-size:12px;">Field Status:</h4>';

            currentQ.fields.forEach(field => {
                const value = response[field.key];
                const hasValue = Array.isArray(value) ? value.length > 0 : !!value;
                const statusColor = hasValue ? '#4ade80' : '#f87171';
                const statusIcon = hasValue ? '✓' : '✗';

                fieldStatus += `
                    <div style="margin:4px 0; padding:4px 8px; background:rgba(255,255,255,0.05); border-radius:4px;">
                        <span style="color:${statusColor}">${statusIcon}</span>
                        <strong>${field.key}</strong>: 
                        <span style="color:#a0a0a0">${JSON.stringify(value) || 'null'}</span>
                    </div>
                `;
            });
            fieldStatus += '</div>';
        }

        // Import warnings section
        let warningsHtml = '';
        if (needsReview || importWarnings.length > 0) {
            warningsHtml = `
                <div style="margin-top:12px; background:#7f1d1d; padding:8px; border-radius:6px;">
                    <strong style="color:#fecaca;">⚠️ Import Issues:</strong>
                    <ul style="margin:4px 0 0 16px; padding:0; color:#fca5a5;">
                        ${importWarnings.map(w => `<li>${w}</li>`).join('') || '<li>Question flagged for review</li>'}
                    </ul>
                </div>
            `;
        }

        content.innerHTML = `
            <div style="margin-bottom:12px;">
                <strong style="color:#60a5fa;">Question:</strong> ${qId} (${currentQ.type})
                <br><small style="color:#888;">${currentQ.title}</small>
            </div>
            
            <div style="margin-bottom:12px;">
                <strong style="color:#60a5fa;">Status:</strong> 
                <span style="color:${needsReview ? '#f87171' : '#4ade80'}">
                    ${needsReview ? '⚠️ Needs Review' : '✓ OK'}
                </span>
            </div>
            
            <div style="margin-bottom:12px;">
                <strong style="color:#60a5fa;">Raw Response:</strong>
                <pre style="background:#1a1a2e; padding:8px; border-radius:6px; overflow-x:auto; margin:4px 0;">${JSON.stringify(response, null, 2) || 'null'}</pre>
            </div>
            
            ${fieldStatus}
            ${warningsHtml}
        `;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => DebugOverlay.init());
