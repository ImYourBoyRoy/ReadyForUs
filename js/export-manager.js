// ./js/export-manager.js
/**
 * Export manager module for the HeartReady Toolkit.
 * 
 * Handles exporting questionnaire responses as formatted text or JSON files.
 * Supports individual and couple reflection exports.
 * 
 * Usage: Import and call ExportManager methods to download responses.
 */

const ExportManager = {
    /**
     * Export responses as a formatted text file.
     * @param {Object} options - Export options.
     */
    exportAsText(options = {}) {
        const {
            participantName = 'Participant',
            includeExamples = false
        } = options;

        const artifact = DataLoader.getArtifact();
        const sections = DataLoader.getSections();
        const responses = QuestionnaireEngine.responses;
        const stats = QuestionnaireEngine.getStats();
        const questions = QuestionnaireEngine.questions;

        let text = '';

        // Header
        text += '═'.repeat(60) + '\n';
        text += `  ${artifact.title || 'HeartReady Check-In'}\n`;
        text += `  ${artifact.subtitle || ''}\n`;
        text += '═'.repeat(60) + '\n\n';

        // Participant info
        text += `Completed by: ${participantName}\n`;
        text += `Date: ${new Date().toLocaleDateString()}\n`;
        text += `Progress: ${stats.answered}/${stats.total} questions answered\n`;
        if (stats.skipped > 0) {
            text += `Skipped: ${stats.skipped} questions\n`;
        }
        text += '\n' + '─'.repeat(60) + '\n\n';

        // Group questions by section
        let currentSectionId = null;

        questions.forEach(question => {
            // Add section header if new section
            if (question.section_id !== currentSectionId) {
                currentSectionId = question.section_id;
                const section = sections.find(s => s.id === currentSectionId);
                if (section) {
                    text += `\n▸ ${section.title.toUpperCase()}\n`;
                    text += '─'.repeat(40) + '\n\n';
                }
            }

            const response = responses[question.id];
            const status = QuestionnaireEngine.getQuestionStatus(question.id);

            text += `Q${question.order}: ${question.title}\n`;
            text += `   "${question.prompt}"\n\n`;

            if (status === 'answered') {
                text += `   ➤ ${this.formatResponseForText(question, response)}\n`;
            } else if (status === 'skipped') {
                text += `   ➤ [Skipped]\n`;
            } else {
                text += `   ➤ [Not answered]\n`;
            }

            text += '\n';
        });

        // Footer
        text += '\n' + '═'.repeat(60) + '\n';
        text += '  HeartReady Toolkit\n';
        text += '  Made for Clara with ❤️ by Roy Dawson IV\n';
        text += '═'.repeat(60) + '\n';

        // Download
        this.downloadFile(text, `heartready-${participantName.toLowerCase().replace(/\s+/g, '-')}.txt`, 'text/plain');
    },

    /**
     * Export responses as JSON.
     * @param {Object} options - Export options.
     */
    exportAsJSON(options = {}) {
        const { participantName = 'Participant', filename = null } = options;

        const exportData = {
            meta: {
                artifact: DataLoader.getArtifact(),
                exportedAt: new Date().toISOString(),
                participantName,
                mode: QuestionnaireEngine.mode
            },
            stats: QuestionnaireEngine.getStats(),
            responses: {}
        };

        // Include full question data with responses
        QuestionnaireEngine.questions.forEach(question => {
            exportData.responses[question.id] = {
                question: {
                    id: question.id,
                    title: question.title,
                    prompt: question.prompt,
                    type: question.type
                },
                response: QuestionnaireEngine.responses[question.id] || null,
                status: QuestionnaireEngine.getQuestionStatus(question.id)
            };
        });

        const json = JSON.stringify(exportData, null, 2);
        const safeName = participantName.toLowerCase().replace(/\s+/g, '-');
        const baseFilename = filename || `heartready-${safeName}`;
        this.downloadFile(json, `${baseFilename}.json`, 'application/json');
    },

    /**
     * Export for AI reflection prompts.
     * @param {string} type - 'individual' or 'couple'
     * @param {Object} options - Export options.
     */
    exportForAI(type = 'individual', options = {}) {
        const mode = QuestionnaireEngine.mode || 'lite';
        const prompt = DataLoader.getPrompt(type, mode);

        if (!prompt) {
            console.error('Prompt template not found');
            return;
        }

        let text = '';

        // Role/instruction
        text += '--- SYSTEM ROLE ---\n';
        text += prompt.role + '\n\n';

        // Context
        text += '--- CONTEXT ---\n';
        prompt.context.forEach(c => text += `• ${c}\n`);
        text += '\n';

        // Responses
        text += '--- RESPONSES ---\n\n';

        QuestionnaireEngine.questions.forEach(question => {
            const response = QuestionnaireEngine.responses[question.id];
            if (!response) return;

            text += `**Q${question.order}: ${question.title}**\n`;
            text += `${question.prompt}\n`;
            text += `Answer: ${this.formatResponseForText(question, response)}\n\n`;
        });

        // Output format
        text += '--- REQUESTED OUTPUT FORMAT ---\n';
        prompt.output_format.forEach(section => {
            text += `\n### ${section.section}\n`;
            section.requirements.forEach(req => text += `• ${req}\n`);
        });

        // Constraints
        text += '\n--- CONSTRAINTS ---\n';
        prompt.constraints.forEach(c => text += `• ${c}\n`);

        this.downloadFile(text, 'ai-reflection-prompt.txt', 'text/plain');
    },

    /**
     * Format a response for text display.
     * @param {Object} question - Question object.
     * @param {Object} response - Response object.
     * @returns {string} Formatted response string.
     */
    formatResponseForText(question, response) {
        if (!response) return '[No response]';

        switch (question.type) {
            case 'single_select':
                const option = question.options.find(o => o.value === response.selected_value);
                let text = option ? option.label : response.selected_value || '';
                if (response.other_text) {
                    text += ` (${response.other_text})`;
                }
                return text;

            case 'multi_select':
                const labels = (response.selected_values || []).map(v => {
                    const opt = question.options.find(o => o.value === v);
                    return opt ? opt.label : v;
                });
                let result = labels.join(', ');
                if (response.other_text) {
                    result += ` (Other: ${response.other_text})`;
                }
                return result;

            case 'free_text':
                return response.text || '[No text entered]';

            case 'compound':
                const parts = [];
                question.fields.forEach(field => {
                    const val = response[field.key];
                    if (val) {
                        if (Array.isArray(val) && val.length > 0) {
                            const fieldLabels = val.map(v => {
                                const opt = field.options?.find(o => o.value === v);
                                return opt ? opt.label : v;
                            });
                            parts.push(`${field.label}: ${fieldLabels.join(', ')}`);
                        } else if (typeof val === 'string' && val.trim()) {
                            parts.push(`${field.label}: ${val}`);
                        } else if (typeof val === 'number') {
                            parts.push(`${field.label}: ${val}`);
                        }
                    }
                });
                return parts.length > 0 ? parts.join('; ') : '[Partially answered]';

            default:
                return JSON.stringify(response);
        }
    },

    /**
     * Trigger file download.
     * @param {string} content - File content.
     * @param {string} filename - Download filename.
     * @param {string} mimeType - MIME type.
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Copy responses to clipboard as text.
     * @param {Object} options - Export options.
     * @returns {Promise<boolean>} True if successful.
     */
    async copyToClipboard(options = {}) {
        const { participantName = 'Participant' } = options;

        let text = `${DataLoader.getArtifact().title} - ${participantName}\n\n`;

        QuestionnaireEngine.questions.forEach(question => {
            const response = QuestionnaireEngine.responses[question.id];
            if (!response) return;

            text += `${question.title}\n`;
            text += `${this.formatResponseForText(question, response)}\n\n`;
        });

        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            return false;
        }
    },

    /**
     * Copy AI reflection prompt to clipboard.
     * @param {string} type - 'individual' or 'couple'
     * @param {Object} options - Export options.
     * @returns {Promise<boolean>} True if successful.
     */
    async copyAIPrompt(type = 'individual', options = {}) {
        const { participantName = 'Participant' } = options;
        const mode = QuestionnaireEngine.mode || 'lite';
        const prompt = DataLoader.getPrompt(type, mode);

        if (!prompt) {
            console.error('Prompt template not found');
            return false;
        }

        let text = '';

        // Role/instruction
        text += '=== SYSTEM ROLE ===\n';
        text += prompt.role + '\n\n';

        // Context
        text += '=== CONTEXT ===\n';
        prompt.context.forEach(c => text += `• ${c}\n`);
        text += '\n';

        // Participant info
        text += `=== PARTICIPANT: ${participantName} ===\n\n`;

        // Responses
        text += '=== RESPONSES ===\n\n';

        QuestionnaireEngine.questions.forEach(question => {
            const response = QuestionnaireEngine.responses[question.id];
            const status = QuestionnaireEngine.getQuestionStatus(question.id);

            text += `**Q${question.order}: ${question.title}**\n`;
            text += `${question.prompt}\n`;

            if (status === 'answered' && response) {
                text += `Answer: ${this.formatResponseForText(question, response)}\n\n`;
            } else if (status === 'skipped') {
                text += `Answer: [Skipped]\n\n`;
            } else {
                text += `Answer: [Not answered]\n\n`;
            }
        });

        // Output format
        text += '=== REQUESTED OUTPUT FORMAT ===\n';
        prompt.output_format.forEach(section => {
            text += `\n### ${section.section}\n`;
            section.requirements.forEach(req => text += `• ${req}\n`);
        });

        // Constraints
        text += '\n=== CONSTRAINTS ===\n';
        prompt.constraints.forEach(c => text += `• ${c}\n`);

        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy AI prompt to clipboard:', err);
            return false;
        }
    },

    /**
     * Copy just the results formatted for sharing with partner (for couple's review).
     * @param {Object} options - Export options.
     * @returns {Promise<boolean>} True if successful.
     */
    async copyResultsForCouple(options = {}) {
        const { participantName = 'Participant' } = options;

        let text = '';
        text += `=== ${participantName.toUpperCase()}'S RESPONSES ===\n\n`;

        QuestionnaireEngine.questions.forEach(question => {
            const response = QuestionnaireEngine.responses[question.id];
            const status = QuestionnaireEngine.getQuestionStatus(question.id);

            text += `**Q${question.order}: ${question.title}**\n`;
            text += `${question.prompt}\n`;

            if (status === 'answered' && response) {
                text += `Answer: ${this.formatResponseForText(question, response)}\n\n`;
            } else if (status === 'skipped') {
                text += `Answer: [Skipped]\n\n`;
            } else {
                text += `Answer: [Not answered]\n\n`;
            }
        });

        text += `=== END OF ${participantName.toUpperCase()}'S RESPONSES ===\n`;

        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy results to clipboard:', err);
            return false;
        }
    },

    /**
     * Copy the couple's AI prompt template (without responses - users paste both sets of results).
     * @returns {Promise<boolean>} True if successful.
     */
    async copyCouplePrompt() {
        const mode = QuestionnaireEngine.mode || 'lite';
        const prompt = DataLoader.getPrompt('couple', mode);

        if (!prompt) {
            console.error('Couple prompt template not found');
            return false;
        }

        let text = '';

        // Role/instruction
        text += '=== SYSTEM ROLE ===\n';
        text += prompt.role + '\n\n';

        // Context
        text += '=== CONTEXT ===\n';
        prompt.context.forEach(c => text += `• ${c}\n`);
        text += '\n';

        // Instructions for users
        text += '=== INSTRUCTIONS ===\n';
        text += 'Paste BOTH partners\' responses below (each partner copies their results using "Copy My Results").\n\n';

        // Placeholder for Participant A
        text += '=== PARTICIPANT A RESPONSES ===\n';
        text += '[Paste Participant A\'s results here]\n\n';

        // Placeholder for Participant B
        text += '=== PARTICIPANT B RESPONSES ===\n';
        text += '[Paste Participant B\'s results here]\n\n';

        // Output format
        text += '=== REQUESTED OUTPUT FORMAT ===\n';
        prompt.output_format.forEach(section => {
            text += `\n### ${section.section}\n`;
            section.requirements.forEach(req => text += `• ${req}\n`);
        });

        // Constraints
        text += '\n=== CONSTRAINTS ===\n';
        prompt.constraints.forEach(c => text += `• ${c}\n`);

        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy couple prompt to clipboard:', err);
            return false;
        }
    },

    /**
     * Show raw text in a modal for manual copy (mobile fallback).
     * @param {string} title - Modal title.
     * @param {string} content - Text content to display.
     */
    showRawView(title, content) {
        // Create or get existing modal
        let modal = document.getElementById('raw-view-modal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'raw-view-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title" id="raw-view-title"></h2>
                        <button class="modal-close" aria-label="Close" onclick="ExportManager.hideRawView()">×</button>
                    </div>
                    <div class="modal-body">
                        <p class="raw-text-hint">
                            <span class="icon">📋</span>
                            <span>Tap the text below, then <strong>Select All</strong> and <strong>Copy</strong></span>
                        </p>
                        <textarea class="raw-text-view" id="raw-view-content" readonly></textarea>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" onclick="ExportManager.hideRawView()">Close</button>
                        <button class="btn btn-secondary" onclick="ExportManager.selectAllInModal()">Select All</button>
                        <button class="btn btn-primary" onclick="ExportManager.copyFromModal()">Copy</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideRawView();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.hideRawView();
                }
            });
        }

        // Update content and show
        document.getElementById('raw-view-title').textContent = title;
        document.getElementById('raw-view-content').value = content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll

        // Focus the textarea for easy selection
        setTimeout(() => {
            document.getElementById('raw-view-content').focus();
        }, 100);
    },

    /**
     * Hide the raw view modal.
     */
    hideRawView() {
        const modal = document.getElementById('raw-view-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Select all text in the modal textarea.
     */
    selectAllInModal() {
        const textarea = document.getElementById('raw-view-content');
        if (textarea) {
            textarea.focus();
            textarea.select();
        }
    },

    /**
     * Copy text from modal and provide feedback.
     */
    async copyFromModal() {
        const textarea = document.getElementById('raw-view-content');
        if (!textarea) return;

        try {
            textarea.select();
            await navigator.clipboard.writeText(textarea.value);

            // Visual feedback
            const copyBtn = document.querySelector('#raw-view-modal .btn-primary');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✓ Copied!';
                copyBtn.classList.add('btn-success');
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('btn-success');
                }, 2000);
            }
        } catch (err) {
            // Fallback: prompt user to use manual copy
            alert('Please use Select All and copy manually (Ctrl+C or Cmd+C)');
        }
    },

    /**
     * Show individual AI prompt in raw view.
     * @param {Object} options - Export options.
     */
    showIndividualPromptRaw(options = {}) {
        const { participantName = 'Participant' } = options;
        const mode = QuestionnaireEngine.mode || 'lite';
        const prompt = DataLoader.getPrompt('individual', mode);
        if (!prompt) return;

        let text = this.buildAIPromptText(prompt, participantName);
        this.showRawView('Individual AI Prompt', text);
    },

    /**
     * Show results in raw view for sharing.
     * @param {Object} options - Export options.
     */
    showResultsRaw(options = {}) {
        const { participantName = 'Participant' } = options;

        let text = `=== ${participantName.toUpperCase()}'S RESPONSES ===\n\n`;

        QuestionnaireEngine.questions.forEach(question => {
            const response = QuestionnaireEngine.responses[question.id];
            const status = QuestionnaireEngine.getQuestionStatus(question.id);

            text += `**Q${question.order}: ${question.title}**\n`;
            text += `${question.prompt}\n`;

            if (status === 'answered' && response) {
                text += `Answer: ${this.formatResponseForText(question, response)}\n\n`;
            } else if (status === 'skipped') {
                text += `Answer: [Skipped]\n\n`;
            } else {
                text += `Answer: [Not answered]\n\n`;
            }
        });

        text += `=== END OF ${participantName.toUpperCase()}'S RESPONSES ===\n`;

        this.showRawView(`${participantName}'s Results`, text);
    },

    /**
     * Show couple's prompt in raw view.
     */
    showCouplePromptRaw() {
        const mode = QuestionnaireEngine.mode || 'lite';
        const prompt = DataLoader.getPrompt('couple', mode);
        if (!prompt) return;

        let text = '';
        text += '=== SYSTEM ROLE ===\n';
        text += prompt.role + '\n\n';
        text += '=== CONTEXT ===\n';
        prompt.context.forEach(c => text += `• ${c}\n`);
        text += '\n';
        text += '=== INSTRUCTIONS ===\n';
        text += 'Paste BOTH partners\' responses below.\n\n';
        text += '=== PARTICIPANT A RESPONSES ===\n';
        text += '[Paste Participant A\'s results here]\n\n';
        text += '=== PARTICIPANT B RESPONSES ===\n';
        text += '[Paste Participant B\'s results here]\n\n';
        text += '=== REQUESTED OUTPUT FORMAT ===\n';
        prompt.output_format.forEach(section => {
            text += `\n### ${section.section}\n`;
            section.requirements.forEach(req => text += `• ${req}\n`);
        });
        text += '\n=== CONSTRAINTS ===\n';
        prompt.constraints.forEach(c => text += `• ${c}\n`);

        this.showRawView("Couple's AI Prompt", text);
    },

    /**
     * Build AI prompt text (helper).
     * @param {Object} prompt - Prompt template.
     * @param {string} participantName - Participant name.
     * @returns {string} Formatted prompt text.
     */
    buildAIPromptText(prompt, participantName) {
        let text = '';
        text += '=== SYSTEM ROLE ===\n';
        text += prompt.role + '\n\n';
        text += '=== CONTEXT ===\n';
        prompt.context.forEach(c => text += `• ${c}\n`);
        text += '\n';
        text += `=== PARTICIPANT: ${participantName} ===\n\n`;
        text += '=== RESPONSES ===\n\n';

        QuestionnaireEngine.questions.forEach(question => {
            const response = QuestionnaireEngine.responses[question.id];
            const status = QuestionnaireEngine.getQuestionStatus(question.id);

            text += `**Q${question.order}: ${question.title}**\n`;
            text += `${question.prompt}\n`;

            if (status === 'answered' && response) {
                text += `Answer: ${this.formatResponseForText(question, response)}\n\n`;
            } else if (status === 'skipped') {
                text += `Answer: [Skipped]\n\n`;
            } else {
                text += `Answer: [Not answered]\n\n`;
            }
        });

        text += '=== REQUESTED OUTPUT FORMAT ===\n';
        prompt.output_format.forEach(section => {
            text += `\n### ${section.section}\n`;
            section.requirements.forEach(req => text += `• ${req}\n`);
        });
        text += '\n=== CONSTRAINTS ===\n';
        prompt.constraints.forEach(c => text += `• ${c}\n`);

        return text;
    }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}
