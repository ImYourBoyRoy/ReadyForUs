// ./js/app/ai-analysis.js
/**
 * AI Analysis module for Ready for Us.
 * 
 * Handles the dedicated AI Analysis page where users can:
 * - Import saved results (individual or couple)
 * - Generate AI prompts with clear step-by-step guidance
 * - Copy prompts with user-friendly success feedback
 * 
 * Designed for non-technical users with clear language and visual guides.
 * 
 * Usage: Automatically initializes when AI Analysis view is shown.
 */

const AppAIAnalysis = {
    // Data storage for imports
    _importedData: null,
    _couplePartnerData: null,
    _aiAnalysisInitialized: false,

    /**
     * Initialize the AI Analysis page.
     */
    async initAIAnalysisPage() {
        if (this._aiAnalysisInitialized) return;

        // Initialize Results Navigator
        if (typeof ResultsNavigator !== 'undefined') {
            ResultsNavigator.init('results-navigator-container', (activeResult) => {
                this.handleResultSelection(activeResult);
            });
        }

        // Set up import handlers
        this.setupImportHandlers();

        // Set up button handlers
        this.setupButtonHandlers();

        // Populate current session data
        this.loadCurrentSessionData();

        this._aiAnalysisInitialized = true;
    },

    /**
     * Load current session data (if questionnaire is in progress/complete).
     */
    /**
     * Load current session data (if questionnaire is in progress/complete).
     */
    loadCurrentSessionData() {
        if (typeof QuestionnaireEngine !== 'undefined' && QuestionnaireEngine.responses && Object.keys(QuestionnaireEngine.responses).length > 0) {
            const stats = QuestionnaireEngine.getStats();
            const name = this.getParticipantName();

            // Create a "Current Session" result object
            const currentData = {
                id: 'current_session',
                name: name + ' (Current)',
                mode: QuestionnaireEngine.mode || 'lite',
                questionCount: QuestionnaireEngine.questions.length,
                responses: QuestionnaireEngine.responses,
                // Add formatted text for transparency viewer
                formattedText: this.getFormattedResponses(),
                stats: {
                    answered: stats.answered,
                    total: stats.total,
                    percent: Math.round((stats.answered / stats.total) * 100)
                },
                importedAt: new Date()
            };

            // Add to navigator
            if (typeof ResultsNavigator !== 'undefined') {
                ResultsNavigator.addResult(currentData);
            }

            // Update Couple's UI if needed
            const p1Name = document.getElementById('couple-p1-name');
            const p1Answered = document.getElementById('couple-p1-answered');
            const p1Total = document.getElementById('couple-p1-total');

            if (p1Name && name && name !== 'Me') {
                p1Name.textContent = name;
            }
            if (p1Answered) p1Answered.textContent = stats.answered;
            if (p1Total) p1Total.textContent = stats.total;
        }
    },

    /**
     * Set up file import handlers for both individual and couple zones.
     */
    setupImportHandlers() {
        // Individual import zone
        const individualZone = document.getElementById('ai-analysis-import-zone');
        const individualInput = document.getElementById('ai-analysis-import-file');

        if (individualZone && individualInput) {
            // Click to upload
            individualZone.addEventListener('click', (e) => {
                if (!e.target.closest('.upload-remove')) {
                    individualInput.click();
                }
            });

            // File change
            individualInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    await this.handleIndividualImport(e.target.files[0]);
                }
            });

            // Drag & drop
            individualZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                individualZone.classList.add('drag-over');
            });
            individualZone.addEventListener('dragleave', () => {
                individualZone.classList.remove('drag-over');
            });
            individualZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                individualZone.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    await this.handleIndividualImport(e.dataTransfer.files[0]);
                }
            });

            // Remove button
            const removeBtn = individualZone.querySelector('.upload-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clearIndividualImport();
                });
            }
        }

        // Couple's partner import zone
        const coupleZone = document.getElementById('upload-zone-couple-partner');
        const coupleInput = document.getElementById('import-file-couple-partner');

        if (coupleZone && coupleInput) {
            // Click to upload
            coupleZone.addEventListener('click', (e) => {
                if (!e.target.closest('.upload-remove')) {
                    coupleInput.click();
                }
            });

            // File change
            coupleInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    await this.handleCouplePartnerImport(e.target.files[0]);
                }
            });

            // Drag & drop
            coupleZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                coupleZone.classList.add('drag-over');
            });
            coupleZone.addEventListener('dragleave', () => {
                coupleZone.classList.remove('drag-over');
            });
            coupleZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                coupleZone.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    await this.handleCouplePartnerImport(e.dataTransfer.files[0]);
                }
            });

            // Remove button
            const removeBtn = coupleZone.querySelector('.upload-remove');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clearCouplePartnerImport();
                });
            }

            // Prevent input clicks from triggering upload
            const partnerInfo = document.getElementById('couple-partner-info-container');
            if (partnerInfo) {
                partnerInfo.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        }
    },

    /**
     * Set up button click handlers.
     */
    setupButtonHandlers() {
        // Individual analysis button
        const individualBtn = document.getElementById('btn-generate-individual-analysis');
        if (individualBtn) {
            individualBtn.addEventListener('click', () => this.generateIndividualAnalysis());
        }

        // View individual raw button
        const viewRawBtn = document.getElementById('btn-view-individual-raw');
        if (viewRawBtn) {
            viewRawBtn.addEventListener('click', () => {
                ExportManager.showIndividualPromptRaw({ participantName: this.getParticipantName() });
            });
        }

        // Couple analysis button
        const coupleBtn = document.getElementById('btn-generate-couple-analysis');
        if (coupleBtn) {
            coupleBtn.addEventListener('click', () => this.generateCoupleAnalysis());
        }

        // Back buttons


        const dashboardBtn = document.getElementById('btn-ai-analysis-dashboard');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                window.location.hash = '/';
            });
        }
    },

    /**
     * Handle individual file import.
     */
    async handleIndividualImport(file) {
        try {
            const parsed = await ImportManager.parseFile(file);

            // Add to navigator
            if (typeof ResultsNavigator !== 'undefined') {
                ResultsNavigator.addResult(parsed);

                // Visual feedback: scroll to navigator
                const navContainer = document.getElementById('results-navigator-container');
                if (navContainer) {
                    navContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    navContainer.classList.add('flash-highlight');
                    setTimeout(() => navContainer.classList.remove('flash-highlight'), 1000);
                }
            }

            // Set as current imported data (for compatibility)
            this._importedData = parsed;

            // Update Import Zone UI to "Success Card"
            const zone = document.getElementById('ai-analysis-import-zone');
            const content = zone?.querySelector('.upload-zone-content');
            const info = zone?.querySelector('.upload-zone-info');
            const nameEl = info?.querySelector('.upload-name');
            const statsEl = document.getElementById('import-stats-answered');
            const totalEl = document.getElementById('import-stats-total');
            const removeBtn = info?.querySelector('.upload-remove');

            if (content) content.style.display = 'none';
            if (info) {
                info.classList.remove('hidden');
                info.style.display = 'flex';
            }
            if (zone) zone.classList.add('has-file');

            // Build rich summary text
            const answered = parsed.stats?.answered || Object.keys(parsed.responses).length || 0;
            const total = parsed.stats?.total || parsed.questionCount || 0;
            const modeLabel = (parsed.mode || 'lite') === 'full' ? 'Full' : 'Lite';

            if (nameEl) {
                nameEl.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <span style="color: var(--accent-green); font-weight: 700;">✓ Successfully Loaded</span>
                        <span>${parsed.name} • ${answered}/${total} ${modeLabel} • Slow Build Check-In</span>
                    </div>
                `;
            }

            // Update stats numbers if visual container exists
            if (statsEl) statsEl.textContent = answered;
            if (totalEl) totalEl.textContent = total;

            // Update Remove Button to be "Upload Different"
            if (removeBtn) {
                removeBtn.innerHTML = 'Upload Different';
                removeBtn.title = 'Upload different results';
                removeBtn.style.width = 'auto';
                removeBtn.style.fontSize = '0.8rem';
                removeBtn.style.padding = '4px 8px';
                removeBtn.style.borderRadius = '4px';
                removeBtn.style.background = 'var(--bg-main)';
                removeBtn.style.color = 'var(--text-primary)';
                removeBtn.style.opacity = '1'; /* Override CSS opacity */
            }

            // Reset file input so same file can be selected again
            const input = document.getElementById('ai-analysis-import-file');
            if (input) input.value = '';

            // Show success toast
            if (this.showToast) {
                this.showToast('Analysis imported successfully! See Results Navigator.', 'success');
            }

        } catch (error) {
            console.error('Error importing file:', error);
            if (this.showToast) {
                this.showToast(`Import failed: ${error.message}`, 'error');
            } else {
                alert(`Error reading file: ${error.message}`);
            }
        }
    },

    /**
     * Handle result selection change from Navigator.
     * @param {Object} result - The selected result data
     */
    handleResultSelection(result) {
        if (!result) {
            // Do not clear import zone UI, just reset internal state
            this._importedData = null;
            this.initializeTransparencyViewer(); // Show placeholder
            return;
        }

        // Update local state
        this._importedData = result;

        // Note: We no longer hide the import zone. It stays available for uploading MORE files.
        // The Results Navigator above shows the active selection.

        // Update Transparency Viewer
        this.updateTransparencyViewer(result);

        // Update Couple Partner 1 UI
        this.updateCouplePartner1UI(result);

        // Ensure generate button is ready
        const btn = document.getElementById('btn-generate-individual-analysis');
        if (btn) btn.disabled = false;
    },

    /**
     * Update Couple Partner 1 UI with active result data.
     */
    updateCouplePartner1UI(result) {
        const p1Name = document.getElementById('couple-p1-name');
        const p1StatsAnswered = document.getElementById('couple-p1-answered');
        const p1StatsTotal = document.getElementById('couple-p1-total');

        if (!result) return;

        // Calculate stats
        const answered = result.stats?.answered || Object.keys(result.responses || {}).length || 0;
        const total = result.stats?.total || result.questionCount || 0;
        const name = result.name || 'Me';

        if (p1Name) {
            p1Name.textContent = name;
            // Add visual cue if it's an imported file
            if (this._importedData) {
                p1Name.innerHTML = `<span style="border-bottom: 2px solid var(--accent-purple);">${this.escapeHtml(name)}</span>`;
            }
        }
        if (p1StatsAnswered) p1StatsAnswered.textContent = answered;
        if (p1StatsTotal) p1StatsTotal.textContent = total;
    },

    /**
     * Clear imported individual data.
     */
    clearIndividualImport() {
        this._importedData = null;

        // Update UI
        const zone = document.getElementById('ai-analysis-import-zone');
        const content = zone?.querySelector('.upload-zone-content');
        const info = zone?.querySelector('.upload-zone-info');
        const fileInput = document.getElementById('ai-analysis-import-file');

        if (content) content.style.display = 'flex';
        if (info) info.style.display = 'none';
        if (zone) zone.classList.remove('has-file');
        if (fileInput) fileInput.value = ''; // Reset input

        // Force reload transparency viewer with empty/default state
        this.initializeTransparencyViewer();
    },

    /**
     * Handle couple's partner file import.
     */
    async handleCouplePartnerImport(file) {
        try {
            const parsed = await ImportManager.parseFile(file);
            this._couplePartnerData = parsed;

            // Get current user context for validation
            const currentArtifact = DataLoader.getArtifact();

            // UI References
            const zone = document.getElementById('upload-zone-couple-partner');
            const content = zone?.querySelector('.upload-zone-content');
            const info = zone?.querySelector('.upload-zone-info');
            const nameEl = info?.querySelector('.upload-name');
            const btn = document.getElementById('btn-generate-couple-analysis');

            const nameInput = document.getElementById('couple-partner-name-input');
            const statsAnswered = document.getElementById('couple-partner-stats-answered');
            const statsTotal = document.getElementById('couple-partner-stats-total');
            const warningEl = document.getElementById('couple-partner-warning');

            // Validation
            const warnings = [];
            if (parsed.artifactId && currentArtifact.id && parsed.artifactId !== currentArtifact.id) {
                warnings.push(`⚠️ Mismatch: Partner used \"${parsed.artifactId}\" but you used \"${currentArtifact.id}\".`);
            }

            const partnerMode = parsed.mode;
            const myMode = QuestionnaireEngine.mode || 'lite';
            if (partnerMode !== myMode) {
                warnings.push(`⚠️ Mode Mismatch: Partner did \"${partnerMode}\" mode, you did \"${myMode}\" mode.`);
            }

            // Update UI
            if (content) content.style.display = 'none';
            if (info) info.style.display = 'flex';
            if (nameEl) nameEl.textContent = parsed.fileName;
            if (zone) zone.classList.add('has-file');

            // Populate fields
            if (nameInput) {
                nameInput.value = parsed.name && parsed.name !== 'Unknown' ? parsed.name : 'Partner';
                nameInput.oninput = (e) => {
                    if (this._couplePartnerData) {
                        this._couplePartnerData.name = e.target.value;
                    }
                };
            }

            const answered = parsed.stats?.answered || 0;
            const total = parsed.stats?.total || parsed.questionCount || 0;
            if (statsAnswered) statsAnswered.textContent = answered;
            if (statsTotal) statsTotal.textContent = total;

            // Show warnings
            if (warningEl) {
                if (warnings.length > 0) {
                    warningEl.textContent = warnings.join('\n');
                    warningEl.style.display = 'block';
                } else {
                    warningEl.style.display = 'none';
                }
            }

            if (btn) btn.disabled = false;

        } catch (error) {
            console.error('Error importing partner file:', error);
            alert(`Error reading file: ${error.message}`);
            this.clearCouplePartnerImport();
        }
    },

    /**
     * Clear couple partner import.
     */
    clearCouplePartnerImport() {
        this._couplePartnerData = null;

        const zone = document.getElementById('upload-zone-couple-partner');
        const input = document.getElementById('import-file-couple-partner');
        const content = zone?.querySelector('.upload-zone-content');
        const info = zone?.querySelector('.upload-zone-info');
        const btn = document.getElementById('btn-generate-couple-analysis');
        const nameInput = document.getElementById('couple-partner-name-input');
        const warningEl = document.getElementById('couple-partner-warning');

        if (input) input.value = '';
        if (content) content.style.display = 'flex';
        if (info) info.style.display = 'none';
        if (zone) zone.classList.remove('has-file');
        if (btn) btn.disabled = true;
        if (nameInput) nameInput.value = '';
        if (warningEl) {
            warningEl.textContent = '';
            warningEl.style.display = 'none';
        }
    },

    /**
     * Generate and copy individual AI analysis prompt.
     */
    async generateIndividualAnalysis() {
        try {
            // Determine which data to use: imported or current session
            let startData = this._importedData;

            if (!startData) {
                // If no imported data, use current session
                if (typeof QuestionnaireEngine !== 'undefined') {
                    const stats = QuestionnaireEngine.getStats();
                    startData = {
                        name: this.getParticipantName(),
                        mode: QuestionnaireEngine.mode || 'lite',
                        questionCount: QuestionnaireEngine.questions.length,
                        responses: QuestionnaireEngine.responses,
                        formattedText: this.getFormattedResponses(),
                        stats: {
                            answered: stats.answered,
                            total: stats.total
                        }
                    };
                } else {
                    throw new Error('No questionnaire data available');
                }
            }

            // Generate full prompt text (Exact same logic as Transparency Viewer)
            const mode = startData.mode || 'lite';
            const promptTemplate = DataLoader.getPrompt('individual', mode);

            if (!promptTemplate) throw new Error('Prompt template not found');

            const fullText = ImportManager.buildIndividualPrompt(startData, promptTemplate);

            // Copy to clipboard
            await navigator.clipboard.writeText(fullText);
            const success = true;

            if (success) {
                // Show success message
                const successMsg = document.getElementById('individual-success-message');
                if (successMsg) {
                    successMsg.style.display = 'flex';
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                    }, 5000);
                }

                // Update button state temporarily
                const btn = document.getElementById('btn-generate-individual-analysis');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '✓ Copied to Clipboard!';
                    btn.classList.add('btn-success');
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.classList.remove('btn-success');
                    }, 3000);
                }
            } else {
                throw new Error('Failed to copy prompt');
            }

        } catch (error) {
            console.error('Error generating individual analysis:', error);
            alert(`Failed to generate AI message: ${error.message}`);
        }
    },

    /**
     * Generate and copy couple's AI analysis prompt.
     */
    async generateCoupleAnalysis() {
        if (!this._couplePartnerData) {
            alert('Please upload your partner\'s results first.');
            return;
        }

        try {
            // Ensure we have latest name from input
            const nameInput = document.getElementById('couple-partner-name-input');
            if (nameInput && nameInput.value) {
                this._couplePartnerData.name = nameInput.value;
            }

            // Create self data - prefer IMPORTED data if active
            let selfData;

            if (this._importedData) {
                selfData = this._importedData;
            } else {
                // Fallback to current session
                selfData = {
                    name: this.getParticipantName() || 'Me',
                    mode: QuestionnaireEngine.mode || 'lite',
                    formattedText: ImportManager.formatJSONResponses(QuestionnaireEngine.responses),
                    format: 'json'
                };
            }

            const mode = selfData.mode || 'lite';
            const prompt = DataLoader.getPrompt('couple', mode);

            // Generate combined prompt
            const promptText = ImportManager.buildCouplePrompt(
                selfData,
                this._couplePartnerData,
                prompt
            );

            // Copy to clipboard
            await navigator.clipboard.writeText(promptText);

            // Show success message
            const successMsg = document.getElementById('couple-success-message');
            if (successMsg) {
                successMsg.style.display = 'flex';
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 5000);
            }

            // Update button
            const btn = document.getElementById('btn-generate-couple-analysis');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✓ Copied to Clipboard!';
                btn.classList.add('btn-success');
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('btn-success');
                }, 3000);
            }

        } catch (error) {
            console.error('Error generating couple analysis:', error);
            alert(`Failed to generate combined AI message: ${error.message}`);
        }
    },

    /**
     * Update transparency viewer with specific result data.
     */
    updateTransparencyViewer(resultData) {
        if (typeof AIAnalysisTransparency === 'undefined') return;
        const container = document.getElementById('individual-transparency-container');
        if (!container) return;

        if (!resultData) {
            // Show placeholder
            container.innerHTML = `
                <div class="prompt-transparency-placeholder">
                    <p class="about-text" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <strong>Select a result to view</strong><br>
                        Choose a result from the navigator above to see its prompt transparency.
                    </p>
                </div>
            `;
            return;
        }

        // Get the prompt template based on result mode
        const mode = resultData.mode || 'lite';
        const promptTemplate = DataLoader.getPrompt('individual', mode);

        if (!promptTemplate) {
            console.error('Failed to load prompt template for mode:', mode);
            return;
        }

        // Prepare participant data
        const participantData = {
            name: resultData.name || 'Participant',
            mode: mode,
            responses: resultData.responses,
            formattedText: resultData.formattedText || this.getFormattedResponses(resultData.responses)
        };

        // Render the transparency viewer
        AIAnalysisTransparency.renderPromptAnatomy(
            container,
            promptTemplate,
            participantData,
            { mode: 'individual' }
        );
    },

    /**
     * Initialize the transparency viewer for individual analysis.
     * Shows the interactive prompt anatomy with current session data.
     */
    initializeTransparencyViewer() {
        // Check if logic handled by ResultNavigator selection
        if (typeof ResultsNavigator !== 'undefined' && ResultsNavigator.getActiveResult()) {
            this.updateTransparencyViewer(ResultsNavigator.getActiveResult());
            return;
        }

        // Check if transparency module is loaded
        if (typeof AIAnalysisTransparency === 'undefined') {
            console.warn('Transparency module not loaded yet');
            return;
        }

        const container = document.getElementById('individual-transparency-container');
        if (!container) return;

        // Only render if we have questionnaire data
        if (typeof QuestionnaireEngine === 'undefined' || !QuestionnaireEngine.questions || QuestionnaireEngine.questions.length === 0) {
            container.innerHTML = `
                <div class="prompt-transparency-placeholder">
                    <p class="about-text" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <strong>Complete a questionnaire first</strong><br>
                        Your prompt transparency will appear here once you've answered some questions.
                    </p>
                </div>
            `;
            return;
        }

        // Get the prompt template
        const mode = QuestionnaireEngine.mode || 'lite';
        const promptTemplate = DataLoader.getPrompt('individual', mode);

        if (!promptTemplate) {
            console.error('Failed to load prompt template');
            return;
        }

        // Prepare participant data
        const participantData = {
            name: this.getParticipantName(),
            mode: mode,
            responses: QuestionnaireEngine.responses,
            formattedText: this.getFormattedResponses()
        };

        // Render the transparency viewer
        AIAnalysisTransparency.renderPromptAnatomy(
            container,
            promptTemplate,
            participantData,
            { mode: 'individual' }
        );
    },

    /**
     * Get formatted responses text for transparency preview.
     * @param {Object} [responses] - Optional responses object to format (defaults to engine responses)
     * @returns {string} Formatted responses.
     */
    getFormattedResponses(responses) {
        const targetResponses = responses || QuestionnaireEngine.responses;

        if (typeof ImportManager !== 'undefined' && ImportManager.formatJSONResponses) {
            // If passed raw responses (key-value), format directly?
            // ImportManager EXPECTS formatted structure. 
            // We need to rebuild structure if we only have simple responses.

            // For now, let's use a simpler approach if we don't have the full object structure
            // If we have QuestionnaireEngine style responses (just values), we need to map to questions

            const questionMap = new Map();
            if (typeof QuestionnaireEngine !== 'undefined') {
                QuestionnaireEngine.questions.forEach(q => questionMap.set(q.id, q));
            }

            const formattedResponses = {};
            Object.entries(targetResponses).forEach(([qId, answer]) => {
                // If answer already has question/response structure (from JSON import), use it directly
                if (answer && answer.question && answer.response) {
                    formattedResponses[qId] = answer;
                    return;
                }

                const question = questionMap.get(qId);
                if (question) {
                    formattedResponses[qId] = {
                        question: {
                            id: question.id,
                            title: question.title,
                            prompt: question.prompt,
                            type: question.type
                        },
                        response: answer,
                        status: 'answered'
                    };
                }
            });
            return ImportManager.formatJSONResponses(formattedResponses);
        }

        return '';
    },

    /**
     * Get participant name from various sources.
     */
    getParticipantName() {
        // Try imported data first
        if (this._importedData && this._importedData.name && this._importedData.name !== 'Unknown') {
            return this._importedData.name;
        }

        // Try App property directly (avoid recursion since this is mixed into App)
        if (this.participantName) {
            return this.participantName;
        }

        // Try QuestionnaireEngine
        if (typeof QuestionnaireEngine !== 'undefined' && QuestionnaireEngine.participantName) {
            return QuestionnaireEngine.participantName;
        }

        // Try storage
        const stored = StorageManager.loadParticipantName();
        if (stored) return stored;

        return 'Friend';
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppAIAnalysis);
}
