// ./js/app/ai-analysis-transparency.js
/**
 * AI Analysis Transparency Module for Ready for Us.
 * 
 * Provides detailed visibility into AI prompt construction, showing users
 * exactly what data is sent to AI systems and how prompts are structured.
 * 
 * Key Features:
 * - Interactive prompt anatomy viewer (role, context, responses, format, constraints)
 * - Variable substitution highlighting (shows where {{name}} becomes actual values)
 * - Section-by-section breakdown with copy functionality
 * - Side-by-side comparison for couple's prompts
 * 
 * Usage: 
 * - AIAnalysisTransparency.renderPromptAnatomy(container, promptTemplate, participantData)
 * - AIAnalysisTransparency.showFullPreview(promptText)
 */

const AIAnalysisTransparency = {
    /**
     * Render the complete prompt anatomy viewer in a container.
     * @param {HTMLElement} container - Container element to render into.
     * @param {Object} promptTemplate - The prompt template from prompts.json.
     * @param {Object} participantData - Participant data with name and responses.
     * @param {Object} options - Optional settings (mode, isCouplePrompt, etc.)
     */
    renderPromptAnatomy(container, promptTemplate, participantData, options = {}) {
        if (!container || !promptTemplate) {
            console.error('Missing required parameters for prompt anatomy');
            return;
        }

        const { mode = 'individual', isCouplePrompt = false, partnerData = null } = options;

        let html = '<div class="prompt-anatomy-viewer">';

        // Header
        html += `
            <div class="prompt-anatomy-header">
                <h3 class="prompt-anatomy-title">
                    <span class="icon">🔍</span>
                    Prompt Transparency: See Exactly What the AI Receives
                </h3>
                <p class="prompt-anatomy-intro">
                    This shows you exactly how your responses are formatted and sent to the AI.
                    Each section serves a specific purpose in guiding the AI's analysis.
                </p>
            </div>
        `;

        // Section 1: System Role
        html += this.renderSection('system-role', {
            title: '🎭 System Role',
            description: 'Defines who the AI should act as and what perspective to take',
            content: promptTemplate.role,
            type: 'text',
            copyable: true,
            defaultExpanded: false
        });

        // Section 2: Context
        html += this.renderSection('context', {
            title: '📋 Context',
            description: 'Background information that helps the AI understand the questionnaire and your situation',
            content: promptTemplate.context,
            type: 'list',
            copyable: true,
            defaultExpanded: false
        });

        // Section 3: Your Responses (with substitution highlighting)
        const responsesContent = this.buildResponsesPreview(participantData, isCouplePrompt, partnerData);
        html += this.renderSection('responses', {
            title: '💬 Your Responses',
            description: 'Your actual questionnaire answers, formatted for the AI to analyze',
            content: responsesContent,
            type: 'html',
            copyable: true,
            defaultExpanded: true,
            highlight: 'This is YOUR data being sent to the AI'
        });

        // Section 4: Output Format
        html += this.renderSection('output-format', {
            title: '📝 Requested Output Format',
            description: 'Instructions telling the AI how to structure its response to you',
            content: promptTemplate.output_format,
            type: 'structured-list',
            copyable: true,
            defaultExpanded: false
        });

        // Section 5: Constraints
        html += this.renderSection('constraints', {
            title: '⚠️ Constraints & Guidelines',
            description: 'Rules the AI must follow to provide safe, helpful, non-judgmental analysis',
            content: promptTemplate.constraints,
            type: 'list',
            copyable: true,
            defaultExpanded: false
        });

        // Full Preview Button
        html += `
            <div class="prompt-anatomy-actions">
                <button class="btn btn-secondary btn-full-width" id="btn-view-full-prompt">
                    👁️ View Complete Final Prompt
                </button>
                <p class="prompt-anatomy-hint">
                    See the entire assembled prompt exactly as it will be sent to ChatGPT, Claude, or Gemini
                </p>
            </div>
        `;

        html += '</div>';

        container.innerHTML = html;
        this.attachEventListeners(container, promptTemplate, participantData, options);
    },

    /**
     * Render a single section of the prompt anatomy.
     * @param {string} id - Section ID.
     * @param {Object} config - Section configuration.
     * @returns {string} HTML string.
     */
    renderSection(id, config) {
        const {
            title,
            description,
            content,
            type,
            copyable = true,
            defaultExpanded = false,
            highlight = null
        } = config;

        const expandedClass = defaultExpanded ? 'expanded' : '';
        const contentHtml = this.renderContent(content, type);

        return `
            <div class="prompt-anatomy-section ${expandedClass}" data-section="${id}">
                <button class="prompt-section-header" aria-expanded="${defaultExpanded}">
                    <span class="prompt-section-title">${title}</span>
                    <span class="prompt-section-toggle">▼</span>
                </button>
                <div class="prompt-section-content" ${defaultExpanded ? '' : 'hidden'}>
                    <p class="prompt-section-description">${description}</p>
                    ${highlight ? `<div class="prompt-highlight-box">${highlight}</div>` : ''}
                    <div class="prompt-section-body">
                        ${contentHtml}
                    </div>
                    ${copyable ? `
                        <div class="prompt-section-actions">
                            <button class="btn btn-sm btn-secondary copy-section-btn" data-section="${id}">
                                📋 Copy This Section
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Render content based on type.
     * @param {*} content - Content to render.
     * @param {string} type - Content type (text, list, structured-list, html).
     * @returns {string} HTML string.
     */
    renderContent(content, type) {
        switch (type) {
            case 'text':
                return `<div class="prompt-text-content">${this.escapeHtml(content)}</div>`;

            case 'list':
                if (!Array.isArray(content)) return '';
                return `
                    <ul class="prompt-list-content">
                        ${content.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                `;

            case 'structured-list':
                if (!Array.isArray(content)) return '';
                return `
                    <div class="prompt-structured-list">
                        ${content.map(section => `
                            <div class="prompt-output-section">
                                <h4 class="prompt-output-title">${this.escapeHtml(section.section)}</h4>
                                <ul class="prompt-requirements-list">
                                    ${section.requirements.map(req => `<li>${this.escapeHtml(req)}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                `;

            case 'html':
                // For pre-rendered HTML (like responses with highlighting)
                return content;

            default:
                return `<pre class="prompt-raw-content">${this.escapeHtml(JSON.stringify(content, null, 2))}</pre>`;
        }
    },

    /**
     * Build a preview of responses with variable highlighting.
     * @param {Object} participantData - Participant data object.
     * @param {boolean} isCouplePrompt - Whether this is a couple's prompt.
     * @param {Object} partnerData - Partner data if couple's prompt.
     * @returns {string} HTML string with highlighted responses.
     */
    buildResponsesPreview(participantData, isCouplePrompt, partnerData) {
        if (!participantData) {
            return '<p class="prompt-no-data">No participant data available</p>';
        }

        let html = '';

        // Highlight participant name substitution
        html += `
            <div class="prompt-variable-highlight">
                <strong>Participant Name:</strong> 
                <span class="variable-before">{{participantName}}</span>
                <span class="variable-arrow">→</span>
                <span class="variable-after">${this.escapeHtml(participantData.name || 'Unknown')}</span>
            </div>
        `;

        // Render full responses (prettier format)
        html += '<div class="prompt-responses-full styled-scroll">';

        if (participantData.formattedText) {
            // Parse the markdown-like formatted text into HTML blocks
            const blocks = this.parseFormattedTextToHtml(participantData.formattedText);
            html += blocks;
        } else if (participantData.responses) {
            // Fallback: render from responses object if text missing
            html += '<div class="prompt-sample-questions">';
            Object.values(participantData.responses).forEach(resp => {
                if (resp && resp.question) {
                    html += `
                        <div class="prompt-question-block">
                            <h4 class="prompt-q-title">${this.escapeHtml(resp.question.title)}</h4>
                            <p class="prompt-q-prompt">${this.escapeHtml(resp.question.prompt)}</p>
                            <div class="prompt-q-answer">
                                <strong>Answer:</strong> 
                                <span class="answer-content">${this.escapeHtml(this.formatResponse(resp.response))}</span>
                            </div>
                        </div>
                    `;
                }
            });
            html += '</div>';
        }

        html += '</div>';

        html += '</div>';

        return html;
    },

    /**
     * Parse formatted text (Markdown-like) into structured HTML.
     * @param {string} text - The formatted text.
     * @returns {string} HTML string.
     */
    parseFormattedTextToHtml(text) {
        if (!text) return '';

        // Split by "Q#:" pattern to identify blocks
        // Pattern matches start of line, **, Q, numbers, colon
        const parts = text.split(/(?=\*\*Q\d+:)/);

        return parts.map(part => {
            const cleanPart = part.trim();
            if (!cleanPart) return '';

            // Extract title
            const titleMatch = cleanPart.match(/\*\*Q(\d+): (.*?)\*\*/);
            const title = titleMatch ? `Q${titleMatch[1]}: ${titleMatch[2]}` : 'Question';

            // Extract content after title
            let content = cleanPart.replace(/\*\*Q\d+: .*?\*\*/, '').trim();

            // Extract Prompt (usually first line after title)
            const lines = content.split('\n');
            const prompt = lines[0] || '';

            // Extract Answer
            // "Answer: ..."
            const answerMatch = content.match(/Answer: ([\s\S]*)/);
            const answer = answerMatch ? answerMatch[1].trim() : '';

            // If prompt and answer look identical or empty, just dump raw
            if (!answerMatch && !titleMatch) {
                return `<div class="prompt-question-raw">${this.escapeHtml(cleanPart)}</div>`;
            }

            return `
                <div class="prompt-question-block">
                    <h4 class="prompt-q-title">${this.escapeHtml(title)}</h4>
                    <p class="prompt-q-prompt">${this.escapeHtml(prompt)}</p>
                    <div class="prompt-q-answer">
                        <span class="answer-label">Answer:</span>
                        <span class="answer-content">${this.escapeHtml(answer)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Format a single response for display.
     * @param {Object} response - Response object.
     * @returns {string} Formatted response text.
     */
    formatResponse(response) {
        if (!response) return '[No response]';
        if (response.text) return response.text;
        if (response.selected_value) return response.selected_value;
        if (response.selected_values && response.selected_values.length > 0) {
            return response.selected_values.join(', ');
        }
        return JSON.stringify(response);
    },

    /**
     * Attach event listeners to the anatomy viewer.
     * @param {HTMLElement} container - Container element.
     * @param {Object} promptTemplate - Prompt template.
     * @param {Object} participantData - Participant data.
     * @param {Object} options - Options.
     */
    attachEventListeners(container, promptTemplate, participantData, options) {
        // Section expand/collapse
        container.querySelectorAll('.prompt-section-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.prompt-anatomy-section');
                const content = section.querySelector('.prompt-section-content');
                const toggle = header.querySelector('.prompt-section-toggle');
                const isExpanded = header.getAttribute('aria-expanded') === 'true';

                header.setAttribute('aria-expanded', !isExpanded);
                content.hidden = isExpanded;
                section.classList.toggle('expanded');
                toggle.style.transform = !isExpanded ? 'rotate(180deg)' : '';
            });
        });

        // Copy section buttons
        container.querySelectorAll('.copy-section-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const sectionId = btn.dataset.section;
                const text = this.getSectionText(sectionId, promptTemplate, participantData, options);

                try {
                    await navigator.clipboard.writeText(text);
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Copied!';
                    btn.classList.add('btn-success');
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.classList.remove('btn-success');
                    }, 2000);
                } catch (err) {
                    console.error('Copy failed:', err);
                    alert('Copy failed. Please try manually selecting and copying the text.');
                }
            });
        });

        // Full preview button
        const fullPreviewBtn = container.querySelector('#btn-view-full-prompt');
        if (fullPreviewBtn) {
            fullPreviewBtn.addEventListener('click', () => {
                const fullPrompt = this.buildFullPrompt(promptTemplate, participantData, options);
                this.showFullPreviewModal(fullPrompt);
            });
        }
    },

    /**
     * Get the text content for a specific section.
     * @param {string} sectionId - Section ID.
     * @param {Object} promptTemplate - Prompt template.
     * @param {Object} participantData - Participant data.
     * @param {Object} options - Options.
     * @returns {string} Section text.
     */
    getSectionText(sectionId, promptTemplate, participantData, options) {
        switch (sectionId) {
            case 'system-role':
                return `=== SYSTEM ROLE ===\n${promptTemplate.role}`;

            case 'context':
                return `=== CONTEXT ===\n${promptTemplate.context.map(c => `• ${c}`).join('\n')}`;

            case 'responses':
                return `=== PARTICIPANT: ${participantData.name} ===\n\n=== RESPONSES ===\n\n${participantData.formattedText || '[Responses data]'}`;

            case 'output-format':
                let output = '=== REQUESTED OUTPUT FORMAT ===\n';
                promptTemplate.output_format.forEach(section => {
                    output += `\n### ${section.section}\n`;
                    section.requirements.forEach(req => output += `• ${req}\n`);
                });
                return output;

            case 'constraints':
                return `=== CONSTRAINTS ===\n${promptTemplate.constraints.map(c => `• ${c}`).join('\n')}`;

            default:
                return '';
        }
    },

    /**
     * Build the complete final prompt text.
     * @param {Object} promptTemplate - Prompt template.
     * @param {Object} participantData - Participant data.
     * @param {Object} options - Options.
     * @returns {string} Complete prompt text.
     */
    buildFullPrompt(promptTemplate, participantData, options) {
        // Use existing ImportManager logic
        if (typeof ImportManager !== 'undefined') {
            return ImportManager.buildIndividualPrompt(participantData, promptTemplate);
        }

        // Fallback: build manually
        let text = '';
        text += '=== SYSTEM ROLE ===\n' + promptTemplate.role + '\n\n';
        text += '=== CONTEXT ===\n';
        promptTemplate.context.forEach(c => text += `• ${c}\n`);
        text += '\n';
        text += `=== PARTICIPANT: ${participantData.name} ===\n\n`;
        text += '=== RESPONSES ===\n\n';
        text += participantData.formattedText || '[Responses]';
        text += '\n\n=== REQUESTED OUTPUT FORMAT ===\n';
        promptTemplate.output_format.forEach(section => {
            text += `\n### ${section.section}\n`;
            section.requirements.forEach(req => text += `• ${req}\n`);
        });
        text += '\n=== CONSTRAINTS ===\n';
        promptTemplate.constraints.forEach(c => text += `• ${c}\n`);

        return text;
    },

    /**
     * Show the full prompt preview in a modal.
     * @param {string} promptText - Complete prompt text.
     */
    showFullPreviewModal(promptText) {
        // Reuse ExportManager's modal if available
        if (typeof ExportManager !== 'undefined' && ExportManager.showRawView) {
            ExportManager.showRawView('Complete AI Prompt', promptText);
        } else {
            // Fallback: alert or simple modal
            alert('Full prompt:\n\n' + promptText.substring(0, 500) + '...\n\n(Use the main copy button to get the full text)');
        }
    },

    /**
     * Escape HTML special characters.
     * @param {string} text - Text to escape.
     * @returns {string} Escaped text.
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Expose globally for access from ai-analysis.js
if (typeof window !== 'undefined') {
    window.AIAnalysisTransparency = AIAnalysisTransparency;
}

// Also mix into App when loaded
if (typeof App !== 'undefined') {
    App.AIAnalysisTransparency = AIAnalysisTransparency;
}
