/* ./js/app/results-navigator.js */
/**
 * Results Navigator Module
 * 
 * Manages a collection of imported questionnaire results.
 * Allows users to:
 * - View a list of imported files
 * - Switch between active results
 * - Remove results
 * - See metadata (participant, date, mode) at a glance
 */

const ResultsNavigator = {
    // State
    results: new Map(), // ID -> Result Data
    activeResultId: null,

    // UI Elements
    container: null,

    // Callbacks
    onSelectionChange: null,

    /**
     * Initialize the navigator.
     * @param {string} containerId - DOM ID of container element
     * @param {Function} onSelectionChangeFn - Callback when active result ends
     */
    init(containerId, onSelectionChangeFn) {
        this.container = document.getElementById(containerId);
        this.onSelectionChange = onSelectionChangeFn;
        this.results.clear();
        this.activeResultId = null;
        this.render();
    },

    /**
     * Add a new result file.
     * @param {Object} data - Parsed file data from ImportManager
     * @returns {string} The ID of the added result
     */
    addResult(data) {
        // Generate ID if missing (simple timestamp + random)
        if (!data.id) {
            data.id = 'res_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        }

        // Add import timestamp if missing
        if (!data.importedAt) {
            data.importedAt = new Date();
        }

        this.results.set(data.id, data);

        // Auto-select if it's the first one
        if (this.results.size === 1) {
            this.setActive(data.id);
        } else {
            // Re-render to show new item in list
            this.render();
        }

        return data.id;
    },

    /**
     * Remove a result by ID.
     * @param {string} id 
     */
    removeResult(id) {
        if (this.results.has(id)) {
            this.results.delete(id);

            // If we removed the active one, select another or clear
            if (this.activeResultId === id) {
                if (this.results.size > 0) {
                    // Select the most recent one remaining
                    const nextId = Array.from(this.results.keys()).pop();
                    this.setActive(nextId);
                } else {
                    this.clearSelection();
                }
            } else {
                this.render();
            }
        }
    },

    /**
     * Set the active result.
     * @param {string} id 
     */
    setActive(id) {
        if (!this.results.has(id)) return;

        this.activeResultId = id;
        this.render();

        // Trigger callback
        if (this.onSelectionChange) {
            this.onSelectionChange(this.results.get(id));
        }
    },

    /**
     * Clear all results.
     */
    clearAll() {
        this.results.clear();
        this.clearSelection();
    },

    /**
     * Clear active selection (e.g., when list empty).
     */
    clearSelection() {
        this.activeResultId = null;
        this.render();
        if (this.onSelectionChange) {
            this.onSelectionChange(null);
        }
    },

    /**
     * Get the currently active result data.
     * @returns {Object|null}
     */
    getActiveResult() {
        return this.activeResultId ? this.results.get(this.activeResultId) : null;
    },

    /**
     * Return all results as an array.
     */
    getAllResults() {
        return Array.from(this.results.values());
    },

    /**
     * Render the navigator UI.
     */
    render() {
        if (!this.container) return;

        // Hide if empty
        if (this.results.size === 0) {
            this.container.style.display = 'none';
            this.container.innerHTML = '';
            return;
        }

        this.container.style.display = 'block';

        // Build Header
        let html = `
            <div class="results-nav-header">
                <h3 class="results-nav-title">Loaded Results (${this.results.size})</h3>
                <button class="btn-text btn-sm" id="btn-clear-all-results">Clear All</button>
            </div>
            <div class="results-nav-list">
        `;

        // Build Cards
        this.results.forEach((data, id) => {
            const isActive = id === this.activeResultId;
            const activeClass = isActive ? 'active' : '';
            const dateStr = data.importedAt instanceof Date ?
                data.importedAt.toLocaleDateString() : 'Just now';

            // Format completion %
            const percent = data.stats?.percent ||
                (data.questionCount ? Math.round((Object.keys(data.responses).length / data.questionCount) * 100) : 0);

            html += `
                <div class="result-card ${activeClass}" data-id="${id}">
                    <div class="result-card-icon">
                        ${isActive ? '👉' : '📄'}
                    </div>
                    <div class="result-card-info">
                        <div class="result-card-name">${data.name || 'Unknown'}</div>
                        <div class="result-card-meta">
                            ${data.mode === 'full' ? 'Full Mode' : 'Lite Mode'} • ${percent}%
                        </div>
                    </div>
                    <button class="result-card-remove" data-id="${id}" title="Remove file">×</button>
                </div>
            `;
        });

        html += '</div>';
        this.container.innerHTML = html;

        // Attach Events
        this.attachEventListeners();
    },

    /**
     * Attach DOM event listeners.
     */
    attachEventListeners() {
        if (!this.container) return;

        // Card Selection
        this.container.querySelectorAll('.result-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't modify selection if clicking remove button
                if (e.target.classList.contains('result-card-remove')) return;

                const id = card.dataset.id;
                this.setActive(id);
            });
        });

        // Remove Buttons
        this.container.querySelectorAll('.result-card-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.dataset.id;
                if (confirm('Remove this result file?')) {
                    this.removeResult(id);
                }
            });
        });

        // Clear All
        const clearBtn = this.container.querySelector('#btn-clear-all-results');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear all loaded results?')) {
                    this.clearAll();
                }
            });
        }
    }
};

// Expose globally
if (typeof window !== 'undefined') {
    window.ResultsNavigator = ResultsNavigator;
}
