// ./js/export-manager.js
/**
 * Export manager module for the Slow Build Check-In questionnaire.
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
        text += `  ${artifact.title || 'Slow Build Check-In'}\n`;
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
        text += '  Slow Build Check-In\n';
        text += '  Made for Clara with ❤️ by Roy Dawson IV\n';
        text += '═'.repeat(60) + '\n';

        // Download
        this.downloadFile(text, `slow-build-checkin-${participantName.toLowerCase().replace(/\s+/g, '-')}.txt`, 'text/plain');
    },

    /**
     * Export responses as JSON.
     * @param {Object} options - Export options.
     */
    exportAsJSON(options = {}) {
        const { participantName = 'Participant' } = options;

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
        this.downloadFile(json, `slow-build-checkin-${participantName.toLowerCase().replace(/\s+/g, '-')}.json`, 'application/json');
    },

    /**
     * Export for AI reflection prompts.
     * @param {string} type - 'individual' or 'couple'
     * @param {Object} options - Export options.
     */
    exportForAI(type = 'individual', options = {}) {
        const promptType = type === 'couple' ? 'couple_reflection' : 'individual_reflection';
        const prompt = DataLoader.getPrompt(promptType);

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
        const promptType = type === 'couple' ? 'couple_reflection' : 'individual_reflection';
        const prompt = DataLoader.getPrompt(promptType);

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
        const prompt = DataLoader.getPrompt('couple_reflection');

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
    }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}
