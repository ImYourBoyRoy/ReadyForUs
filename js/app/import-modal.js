// ./js/app/import-modal.js
/**
 * Import Modal module for the Ready for Us.
 * 
 * Manages the file import modal UI for loading saved questionnaire results.
 * Handles file parsing, validation, and loading responses.
 * Mixed into the main App object.
 * 
 * Usage: App.showImportModal() to open the import modal.
 */

const AppImportModal = {
    // Parsed file data storage
    importedFiles: {
        a: null,
        b: null,
        continue: null
    },

    // Current import mode: 'continue' or 'ai-prompt'
    importMode: 'continue',

    /**
     * Set up file input handlers for import zones.
     */
    setupImportFileHandlers() {
        // AI Prompt zones (a, b)
        const zones = ['a', 'b'];

        zones.forEach(zone => {
            const zoneEl = document.getElementById(`upload-zone-${zone}`);
            const inputEl = document.getElementById(`import-file-${zone}`);
            const infoEl = document.getElementById(`upload-info-${zone}`);

            if (!zoneEl || !inputEl) return;

            // File selection
            inputEl.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    await this.handleImportFile(zone, e.target.files[0]);
                }
            });

            // Drag and drop
            zoneEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                zoneEl.classList.add('drag-over');
            });

            zoneEl.addEventListener('dragleave', () => {
                zoneEl.classList.remove('drag-over');
            });

            zoneEl.addEventListener('drop', async (e) => {
                e.preventDefault();
                zoneEl.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    await this.handleImportFile(zone, e.dataTransfer.files[0]);
                }
            });

            // Remove button
            infoEl?.querySelector('.upload-remove')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImportFile(zone);
            });
        });

        // Continue zone
        const continueZoneEl = document.getElementById('upload-zone-continue');
        const continueInputEl = document.getElementById('import-file-continue');
        const continueInfoEl = document.getElementById('upload-info-continue');

        if (continueZoneEl && continueInputEl) {
            continueInputEl.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    await this.handleImportFile('continue', e.target.files[0]);
                }
            });

            continueZoneEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                continueZoneEl.classList.add('drag-over');
            });

            continueZoneEl.addEventListener('dragleave', () => {
                continueZoneEl.classList.remove('drag-over');
            });

            continueZoneEl.addEventListener('drop', async (e) => {
                e.preventDefault();
                continueZoneEl.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    await this.handleImportFile('continue', e.dataTransfer.files[0]);
                }
            });

            continueInfoEl?.querySelector('.upload-remove')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearImportFile('continue');
            });
        }

        // Close modal on overlay click
        document.getElementById('import-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'import-modal') {
                this.hideImportModal();
            }
        });
    },

    /**
     * Handle an imported file.
     * @param {string} zone - 'a' or 'b'
     * @param {File} file - The file object
     */
    async handleImportFile(zone, file) {
        const zoneEl = document.getElementById(`upload-zone-${zone}`);
        const contentEl = zoneEl?.querySelector('.upload-zone-content');
        const infoEl = document.getElementById(`upload-info-${zone}`);

        try {
            const parsed = await ImportManager.parseFile(file);
            this.importedFiles[zone] = parsed;

            // Update UI
            if (contentEl) contentEl.style.display = 'none';
            if (infoEl) {
                infoEl.style.display = 'flex';
                infoEl.querySelector('.upload-name').textContent = parsed.name;
                infoEl.querySelector('.upload-details').textContent =
                    `${parsed.mode} • ${parsed.questionCount} questions • ${parsed.format.toUpperCase()}`;
            }
            zoneEl?.classList.add('has-file');

            this.updateImportValidation();

        } catch (error) {
            this.showImportValidation(error.message, 'error');
        }
    },

    /**
     * Clear an imported file.
     * @param {string} zone - 'a' or 'b'
     */
    clearImportFile(zone) {
        this.importedFiles[zone] = null;

        const zoneEl = document.getElementById(`upload-zone-${zone}`);
        const contentEl = zoneEl?.querySelector('.upload-zone-content');
        const infoEl = document.getElementById(`upload-info-${zone}`);
        const inputEl = document.getElementById(`import-file-${zone}`);

        if (contentEl) contentEl.style.display = 'flex';
        if (infoEl) infoEl.style.display = 'none';
        if (inputEl) inputEl.value = '';
        zoneEl?.classList.remove('has-file');

        this.updateImportValidation();
    },

    /**
     * Update validation and button states based on imported files.
     */
    updateImportValidation() {
        const generateBtn = document.getElementById('import-generate');
        const continueBtn = document.getElementById('import-continue-btn');
        const typeSelectorEl = document.getElementById('import-type-selector');
        const validationEl = document.getElementById('import-validation');

        const hasContinue = !!this.importedFiles.continue;
        const hasA = !!this.importedFiles.a;
        const hasB = !!this.importedFiles.b;

        // Handle based on current import mode
        if (this.importMode === 'continue') {
            // Continue mode: single file
            if (hasContinue) {
                const file = this.importedFiles.continue;
                const hasResponses = file.responses && Object.keys(file.responses).length > 0;

                if (!hasResponses) {
                    this.showImportValidation('Could not extract responses from this file.', 'error');
                    if (continueBtn) continueBtn.disabled = true;
                } else if (file.format === 'txt') {
                    this.showImportValidation(
                        `✓ Ready to continue as ${file.name} (${file.mode} mode). Note: Some complex answers may need adjustment.`,
                        'success'
                    );
                    if (continueBtn) continueBtn.disabled = false;
                } else {
                    this.showImportValidation(
                        `✓ Ready to continue as ${file.name} (${file.mode} mode, ${file.questionCount} questions)`,
                        'success'
                    );
                    if (continueBtn) continueBtn.disabled = false;
                }
            } else {
                if (validationEl) validationEl.style.display = 'none';
                if (continueBtn) continueBtn.disabled = true;
            }
        } else {
            // AI Prompt mode
            // Show type selector only if we have file(s)
            if (typeSelectorEl) {
                typeSelectorEl.style.display = hasA ? 'flex' : 'none';
            }

            // If both files, validate compatibility
            if (hasA && hasB) {
                const validation = ImportManager.validateCompatibility(
                    this.importedFiles.a,
                    this.importedFiles.b
                );

                if (!validation.isValid) {
                    this.showImportValidation(validation.message, 'error');
                    if (generateBtn) generateBtn.disabled = true;
                    return;
                }

                this.showImportValidation(
                    `✓ Both files compatible (${this.importedFiles.a.mode} mode)`,
                    'success'
                );
                // Auto-select couple's prompt
                const coupleRadio = document.querySelector('input[name="import-type"][value="couple"]');
                if (coupleRadio) coupleRadio.checked = true;
            } else if (hasA) {
                this.showImportValidation(
                    `Ready to generate individual prompt for ${this.importedFiles.a.name}`,
                    'success'
                );
            } else {
                if (validationEl) validationEl.style.display = 'none';
            }

            // Enable generate button if we have at least one file
            if (generateBtn) {
                generateBtn.disabled = !hasA;
            }
        }
    },

    /**
     * Show import validation message.
     * @param {string} message - The message
     * @param {string} type - 'error' or 'success'
     */
    showImportValidation(message, type) {
        const validationEl = document.getElementById('import-validation');
        if (validationEl) {
            validationEl.textContent = message;
            validationEl.className = `import-validation ${type}`;
            validationEl.style.display = 'block';
        }
    },

    /**
     * Show the import modal.
     */
    showImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Hide the import modal.
     */
    hideImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.resetImportModal();
    },

    /**
     * Reset import modal to initial state.
     */
    resetImportModal() {
        // Clear files
        this.clearImportFile('a');
        this.clearImportFile('b');

        // Hide output section
        const outputEl = document.getElementById('import-output');
        const bodyEl = document.querySelector('#import-modal .modal-body');
        const footerEl = document.querySelector('#import-modal .modal-footer');

        if (outputEl) outputEl.style.display = 'none';
        if (bodyEl) bodyEl.style.display = 'block';
        if (footerEl) footerEl.style.display = 'flex';

        // Reset validation
        const validationEl = document.getElementById('import-validation');
        if (validationEl) validationEl.style.display = 'none';
    },

    /**
     * Generate the AI prompt from imported files.
     */
    async generateImportedPrompt() {
        const hasA = !!this.importedFiles.a;
        const hasB = !!this.importedFiles.b;
        const promptType = document.querySelector('input[name="import-type"]:checked')?.value || 'individual';

        if (!hasA) return;

        try {
            let promptText = '';
            const mode = this.importedFiles.a.mode;

            if (promptType === 'couple' && hasB) {
                const prompt = DataLoader.getPrompt('couple', mode);
                promptText = ImportManager.buildCouplePrompt(
                    this.importedFiles.a,
                    this.importedFiles.b,
                    prompt
                );
            } else {
                const prompt = DataLoader.getPrompt('individual', mode);
                promptText = ImportManager.buildIndividualPrompt(this.importedFiles.a, prompt);
            }

            // Show output
            const outputEl = document.getElementById('import-output');
            const textareaEl = document.getElementById('import-prompt-text');
            const bodyEl = document.querySelector('#import-modal .modal-body');
            const footerEl = document.querySelector('#import-modal .modal-footer');

            if (textareaEl) textareaEl.value = promptText;
            if (bodyEl) bodyEl.style.display = 'none';
            if (footerEl) footerEl.style.display = 'none';
            if (outputEl) outputEl.style.display = 'block';

        } catch (error) {
            this.showImportValidation(`Error generating prompt: ${error.message}`, 'error');
        }
    },

    /**
     * Copy the generated import prompt to clipboard.
     */
    async copyImportedPrompt() {
        const textareaEl = document.getElementById('import-prompt-text');
        const copyBtn = document.getElementById('import-copy');

        if (!textareaEl) return;

        try {
            await navigator.clipboard.writeText(textareaEl.value);

            // Visual feedback
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            }
        } catch (err) {
            // Fallback: select text
            textareaEl.select();
            alert('Press Ctrl+C or Cmd+C to copy');
        }
    },

    /**
     * Switch between import modes (continue vs ai-prompt).
     * @param {string} mode - 'continue' or 'ai-prompt'
     */
    switchImportMode(mode) {
        this.importMode = mode;

        // Update tab selection
        document.querySelectorAll('.import-mode-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.importMode === mode);
        });

        // Show/hide sections
        const continueSection = document.getElementById('import-continue-section');
        const aiSection = document.getElementById('import-ai-section');
        const continueBtn = document.getElementById('import-continue-btn');
        const generateBtn = document.getElementById('import-generate');

        if (mode === 'continue') {
            if (continueSection) continueSection.style.display = 'block';
            if (aiSection) aiSection.style.display = 'none';
            if (continueBtn) continueBtn.style.display = 'block';
            if (generateBtn) generateBtn.style.display = 'none';
        } else {
            if (continueSection) continueSection.style.display = 'none';
            if (aiSection) aiSection.style.display = 'block';
            if (continueBtn) continueBtn.style.display = 'none';
            if (generateBtn) generateBtn.style.display = 'block';
        }

        // Reset validation
        const validationEl = document.getElementById('import-validation');
        if (validationEl) validationEl.style.display = 'none';

        // Update validation for current mode
        this.updateImportValidation();
    },

    /**
     * Continue questionnaire from imported file.
     */
    async continueFromImport() {
        const file = this.importedFiles.continue;
        if (!file || !file.responses) return;

        try {
            // Extract artifact ID to determine the correct phase
            const artifactId = file.meta?.artifact?.id || file.artifactId || null;

            // Find the matching phase ID
            let phaseId = null;
            if (artifactId) {
                phaseId = await DataLoader.getPhaseIdByArtifactId(artifactId);
                if (!phaseId) {
                    console.warn(`Could not find phase for artifact ID: ${artifactId}`);
                }
            }

            // If no phase found, try to use the current phase or fall back to default
            if (!phaseId) {
                phaseId = StorageManager.getLastPhase() || DataLoader.getCurrentPhaseId() || DataLoader.getDefaultPhaseId();
                console.log(`Falling back to phase: ${phaseId}`);
            }

            // Load the correct phase data
            if (phaseId && phaseId !== DataLoader.getCurrentPhaseId()) {
                console.log(`Switching to phase ${phaseId} for import`);
                DataLoader.setCurrentPhase(phaseId);
                StorageManager.setPhase(phaseId);
                await DataLoader.load();

                // Update the app's mode options for the new phase
                if (typeof this.updateModeOptions === 'function') {
                    this.updateModeOptions();
                }
            }

            // Load the questionnaire in the appropriate mode
            const mode = file.mode;

            // Set participant name
            this.participantName = file.name;
            const nameInput = document.getElementById('participant-name');
            if (nameInput) nameInput.value = file.name;

            // Initialize questionnaire with proper mode
            await QuestionnaireEngine.init(mode);

            // Prepare responses for validation
            let responsesToValidate = {};

            if (file.format === 'json') {
                // JSON format has { response: {...}, status: 'answered' }
                Object.entries(file.responses).forEach(([qId, data]) => {
                    if (data.response) {
                        responsesToValidate[qId] = data.response;
                    }
                    if (data.status === 'skipped') {
                        if (!QuestionnaireEngine.skipped.includes(qId)) {
                            QuestionnaireEngine.skipped.push(qId);
                        }
                    }
                });
            } else if (file.format === 'txt') {
                // TXT parsed responses are direct
                responsesToValidate = { ...file.responses };
            }

            // Validate and map responses against question definitions
            // DataLoader.data.questions is an object keyed by question ID
            const questions = DataLoader.data?.questions || {};
            const { mappedResponses, needsReview, fieldWarnings } = ImportManager.validateAndMapResponses(
                responsesToValidate,
                questions
            );

            // Load the mapped responses
            QuestionnaireEngine.responses = mappedResponses;

            // Store questions needing review and field warnings for debug overlay
            this.importNeedsReview = needsReview;
            this.importWarnings = fieldWarnings;

            // Update mode switcher and display
            const modeSwitcher = document.getElementById('mode-switcher');
            if (modeSwitcher) {
                modeSwitcher.value = mode;
            }

            // Update the visual mode toggle buttons to match imported mode
            if (typeof this.updateModeToggle === 'function') {
                this.updateModeToggle(mode);
            }

            // Save to storage - CRITICAL: Must save responses before navigation
            // The URL router will re-initialize the engine and load from storage
            StorageManager.saveResponses(mappedResponses);
            StorageManager.saveProgress(QuestionnaireEngine.currentIndex);
            StorageManager.saveSkipped(QuestionnaireEngine.skipped);
            StorageManager.saveMode(mode);
            StorageManager.saveParticipantName(this.participantName);

            // Persist import metadata for review indicators
            if (needsReview.length > 0) {
                const phaseId = DataLoader.getCurrentPhaseId();
                const storageKey = `slowbuild_${phaseId}_needsReview`;
                localStorage.setItem(storageKey, JSON.stringify(needsReview));

                // Also store field warnings for debugging
                const warningsKey = `slowbuild_${phaseId}_importWarnings`;
                localStorage.setItem(warningsKey, JSON.stringify(fieldWarnings));
            }

            // Close modal
            this.hideImportModal();

            // Navigate to the correct question based on completion status
            const currentPhaseId = DataLoader.getCurrentPhaseId();

            // Find first unanswered or skipped question
            let targetQuestionId = null;
            for (const question of QuestionnaireEngine.questions) {
                const status = QuestionnaireEngine.getQuestionStatus(question.id);
                if (status !== 'answered') {
                    targetQuestionId = question.id;
                    break;
                }
            }

            if (currentPhaseId && targetQuestionId) {
                // Navigate to first unanswered question
                window.location.hash = `/${currentPhaseId}/${targetQuestionId}`;
            } else if (currentPhaseId) {
                // All questions answered - go to review page
                window.location.hash = `/${currentPhaseId}/review`;
            } else {
                // Fallback
                this.showView('questionnaire');
                this.renderCurrentQuestion();
                this.updateProgress();
                this.updateModeDisplay();
            }

            // Show success toast
            const totalImported = Object.keys(mappedResponses).length;
            const reviewCount = needsReview.length;

            // Enhanced logging for debugging
            console.log(`Import results: ${totalImported} mapped, ${reviewCount} need review`, {
                totalImported,
                reviewCount,
                needsReview,
                fieldWarnings,
                mappedResponses: Object.keys(mappedResponses),
                originalResponses: Object.keys(file.responses || {})
            });

            if (typeof this.showToast === 'function' && totalImported > 0) {
                const message = reviewCount > 0
                    ? `✓ Imported ${totalImported} response${totalImported !== 1 ? 's' : ''} (${reviewCount} need${reviewCount === 1 ? 's' : ''} review)`
                    : `✓ Imported ${totalImported} response${totalImported !== 1 ? 's' : ''} from ${file.name}`;

                this.showToast(message, reviewCount > 0 ? 'warning' : 'success', 3000);
            }

        } catch (error) {
            console.error('Import error:', error);
            this.showImportValidation(`Error loading file: ${error.message}`, 'error');
        }
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppImportModal);
}
