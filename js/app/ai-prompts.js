// ./js/app/ai-prompts.js
/**
 * AI Prompts module for Ready for Us.
 * 
 * Dynamically loads and displays AI prompts from each phase's prompts.json file
 * for the AI Prompts transparency page. Provides full visibility into how AI
 * analyzes questionnaire responses.
 * 
 * Usage: Automatically initializes when the AI Prompts view is shown.
 */

const AppAIPrompts = {
    // Cache for loaded prompts
    _promptsCache: {},

    // Track initialization
    _initialized: false,

    /**
     * Initialize the AI Prompts page.
     * Loads phases and renders the phase list.
     */
    async initAIPromptsPage() {
        const container = document.getElementById('ai-prompts-container');
        const tabsContainer = document.getElementById('ai-prompts-phase-tabs'); // We will remove/hide this

        if (!container) return;

        // Hide or clear the old tabs container if it exists
        if (tabsContainer) {
            tabsContainer.style.display = 'none';
        }

        // Get available phases
        let phases = DataLoader.getPhases();

        // Safety check: if phases not loaded, try loading them
        if (!phases || phases.length === 0) {
            try {
                // Show loading state
                container.innerHTML = '<p class="ai-prompts-loading">Loading phases...</p>';

                // Create a timeout promise (2 seconds max)
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Phase loading timed out')), 2000)
                );

                // Race the loader against the timeout
                await Promise.race([
                    DataLoader.loadPhases(),
                    timeoutPromise
                ]);

                phases = DataLoader.getPhases();
            } catch (error) {
                console.warn('Phase loading failed or timed out, using fallback:', error);
                // Fallback phases if loading fails, to ensure UI still works
                phases = [
                    { id: 'phase_0', title: 'Phase 0: Heart Readiness Check-in', short_title: 'Self-Readiness', icon: '◇' },
                    { id: 'phase_1', title: 'Phase 1: Early Connection Check-In', short_title: 'Early Alignment', icon: '❦' },
                    { id: 'phase_1.5', title: 'Phase 1.5: Slow Build Connection', short_title: 'Building Together', icon: '∞' }
                ];
            }
        }

        // Final safety check - if still no phases (shouldn't happen with fallback), show error
        if (!phases || phases.length === 0) {
            container.innerHTML = '<p class="ai-prompts-error">No phases available to display.</p>';
            return;
        }

        // Render the list of phases (Accordion style)
        this.renderPhaseList(phases, container);

        this._initialized = true;
    },

    /**
     * Render the list of phases as expandable cards.
     * @param {Array} phases - Array of phase objects
     * @param {HTMLElement} container - Main container element
     */
    renderPhaseList(phases, container) {
        let html = '<div class="ai-prompts-accordion">';

        phases.forEach((phase, index) => {
            const icon = phase.menu_icon || phase.icon || '•';

            html += `
                <div class="phase-accordion-item" data-phase-id="${phase.id}">
                    <button class="phase-accordion-header" aria-expanded="false">
                        <span class="phase-accordion-icon">${icon}</span>
                        <div class="phase-accordion-title-group">
                            <span class="phase-accordion-title">${phase.title}</span>
                            <span class="phase-accordion-subtitle">${phase.description || ''}</span>
                        </div>
                        <span class="phase-accordion-toggle">▼</span>
                    </button>
                    <div class="phase-accordion-content" hidden>
                        <div class="phase-prompts-loading">Loading prompts...</div>
                        <div class="phase-prompts-container"></div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        this.setupAccordionListeners(container);
    },

    /**
     * Set up listeners for the phase accordion.
     * @param {HTMLElement} container 
     */
    setupAccordionListeners(container) {
        container.querySelectorAll('.phase-accordion-header').forEach(header => {
            header.addEventListener('click', async (e) => {
                const item = header.closest('.phase-accordion-item');
                const content = item.querySelector('.phase-accordion-content');
                const toggle = header.querySelector('.phase-accordion-toggle');
                const phaseId = item.dataset.phaseId;

                const isExpanded = header.getAttribute('aria-expanded') === 'true';

                // Toggle state
                header.setAttribute('aria-expanded', !isExpanded);
                content.hidden = isExpanded;
                toggle.textContent = !isExpanded ? '▲' : '▼';
                toggle.style.transform = !isExpanded ? 'rotate(180deg)' : '';

                // Load prompts if expanding and not yet loaded
                if (!isExpanded && !item.dataset.loaded) {
                    await this.loadAndRenderPhasePrompts(phaseId, item);
                }
            });
        });
    },

    /**
     * Load and render prompts for a specific phase item.
     * @param {string} phaseId 
     * @param {HTMLElement} itemElement 
     */
    async loadAndRenderPhasePrompts(phaseId, itemElement) {
        const contentContainer = itemElement.querySelector('.phase-prompts-container');
        const loadingIndicator = itemElement.querySelector('.phase-prompts-loading');

        try {
            const prompts = await this.loadPhasePrompts(phaseId);
            loadingIndicator.style.display = 'none';

            if (!prompts || Object.keys(prompts).length === 0) {
                contentContainer.innerHTML = '<p class="ai-prompts-empty">No prompts found for this phase.</p>';
                return;
            }

            // Render the actual prompt cards inside this phase
            this.renderPrompts(prompts, contentContainer);
            itemElement.dataset.loaded = 'true';

        } catch (error) {
            console.error(`Error loading prompts for ${phaseId}:`, error);
            loadingIndicator.textContent = 'Failed to load prompts.';
            loadingIndicator.classList.add('error');
        }
    },

    /**
     * Load prompts for a specific phase.
     * @param {string} phaseId - Phase ID
     * @returns {Promise<Object>} Prompts object
     */
    async loadPhasePrompts(phaseId) {
        // Check cache first
        if (this._promptsCache[phaseId]) {
            return this._promptsCache[phaseId];
        }

        // Fetch prompts.json for this phase
        const version = DataLoader.CACHE_VERSION || '2.5.0';
        const response = await fetch(`data/${phaseId}/prompts.json?v=${version}`);

        if (!response.ok) {
            throw new Error(`Failed to load prompts: ${response.status}`);
        }

        const data = await response.json();
        const prompts = data.prompts || {};

        // Cache for future use
        this._promptsCache[phaseId] = prompts;

        return prompts;
    },

    /**
     * Render prompts into cards.
     * @param {Object} prompts - Prompts object from prompts.json
     * @param {HTMLElement} container - Container element
     */
    renderPrompts(prompts, container) {
        let html = '';

        // Define friendly names for prompt types
        const promptLabels = {
            'individual_reflection_lite': { name: 'Individual Reflection (Lite)', icon: '👤' },
            'individual_reflection_full': { name: 'Individual Reflection (Full)', icon: '👤' },
            'couple_reflection_lite': { name: 'Couple Reflection (Lite)', icon: '💑' },
            'couple_reflection_full': { name: 'Couple Reflection (Full)', icon: '💑' }
        };

        for (const [key, prompt] of Object.entries(prompts)) {
            const label = promptLabels[key] || { name: key, icon: '📝' };

            // Default to collapsed state
            html += `
                <article class="about-card ai-prompts-card collapsed">
                    <div class="ai-prompts-card-header" data-prompt-key="${key}">
                        <span class="ai-prompts-card-icon">${label.icon}</span>
                        <h3 class="ai-prompts-card-title">${prompt.title || label.name}</h3>
                        <span class="ai-prompts-card-toggle">▶</span>
                    </div>
                    <div class="ai-prompts-card-content" id="prompt-content-${key}">
                        ${prompt.description ? `<p class="ai-prompts-description">${prompt.description}</p>` : ''}
                        
                        ${this.renderPromptSection('Role / Persona', prompt.role, 'role')}
                        ${this.renderPromptSection('Context', prompt.context, 'context')}
                        ${this.renderPromptSection('Output Format', prompt.output_format, 'output')}
                        ${this.renderPromptSection('Constraints', prompt.constraints, 'constraints')}
                    </div>
                </article>
            `;
        }

        container.innerHTML = html;

        // Add expand/collapse handlers for the prompt cards themselves
        container.querySelectorAll('.ai-prompts-card-header').forEach(header => {
            header.addEventListener('click', () => {
                const card = header.closest('.ai-prompts-card');
                card.classList.toggle('collapsed');
                const toggle = header.querySelector('.ai-prompts-card-toggle');
                toggle.textContent = card.classList.contains('collapsed') ? '▶' : '▼';
            });
        });
    },

    /**
     * Render a section of prompt details.
     * @param {string} title - Section title
     * @param {string|Array|Object} content - Section content
     * @param {string} type - Content type for styling
     * @returns {string} HTML string
     */
    renderPromptSection(title, content, type) {
        if (!content) return '';

        let contentHtml = '';

        if (typeof content === 'string') {
            contentHtml = `<p class="ai-prompts-text">${this.escapeHtml(content)}</p>`;
        } else if (Array.isArray(content)) {
            if (type === 'output') {
                // Output format has structured sections
                contentHtml = '<div class="ai-prompts-output-list">';
                content.forEach(section => {
                    contentHtml += `
                        <div class="ai-prompts-output-section">
                            <strong>${this.escapeHtml(section.section || 'Section')}</strong>
                            ${section.requirements ? `
                                <ul class="ai-prompts-requirements">
                                    ${section.requirements.map(req => `<li>${this.escapeHtml(req)}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `;
                });
                contentHtml += '</div>';
            } else {
                // Simple list
                contentHtml = '<ul class="ai-prompts-list">';
                content.forEach(item => {
                    contentHtml += `<li>${this.escapeHtml(item)}</li>`;
                });
                contentHtml += '</ul>';
            }
        }

        return `
            <div class="ai-prompts-section ai-prompts-section-${type}">
                <h4 class="ai-prompts-section-title">${title}</h4>
                ${contentHtml}
            </div>
        `;
    },

    /**
     * Escape HTML special characters.
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Set up page event listeners.
     */
    setupAIPromptsListeners() {
        // Back button handled by delegation in init.js
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppAIPrompts);
}
