// ./js/app/export.js
/**
 * Export module for the Ready for Us.
 * 
 * Handles all export operations: text, JSON, clipboard, AI prompts.
 * Also manages save modal functionality.
 * Mixed into the main App object.
 * 
 * Usage: Loaded after app.js to extend App object.
 */

const AppExport = {
    /**
     * Export responses as text.
     */
    exportText() {
        ExportManager.exportAsText({ participantName: this.participantName });
    },

    /**
     * Export responses as JSON.
     */
    exportJSON() {
        ExportManager.exportAsJSON({ participantName: this.participantName });
    },

    /**
     * Generate a user-friendly filename for save progress.
     * Format: phase-version_answered-of-total_date.json
     */
    generateSaveFilename() {
        const stats = QuestionnaireEngine.getStats();
        const mode = QuestionnaireEngine.mode || 'lite';
        const artifact = DataLoader.getArtifact();
        const phaseName = artifact?.stage?.code || 'checkin';

        // Get current date in simple format (Jan-08)
        const date = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateStr = `${months[date.getMonth()]}-${String(date.getDate()).padStart(2, '0')}`;

        // Build filename: readyforus-Roy-lite.json or readyforus-Friend-lite.json
        const name = this.getParticipantName().replace(/[^a-z0-9]/gi, '_');
        return `readyforus-${name}-${mode}.json`;
    },

    /**
     * Show the save progress modal with preview info.
     */
    showSaveModal() {
        const modal = document.getElementById('save-modal');
        const filenameEl = document.getElementById('save-filename-preview');
        const statsEl = document.getElementById('save-stats-preview');

        // Generate and show filename
        const filename = this.generateSaveFilename();
        if (filenameEl) {
            filenameEl.textContent = filename;
        }

        // Show stats
        const stats = QuestionnaireEngine.getStats();
        if (statsEl) {
            statsEl.innerHTML = `
                <span>✓ ${stats.answered} answered</span>
                <span>⏭ ${stats.skipped} skipped</span>
                <span>○ ${stats.unanswered} remaining</span>
            `;
        }

        // Show modal
        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Hide the save progress modal.
     */
    hideSaveModal() {
        const modal = document.getElementById('save-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Confirm and execute the save operation.
     */
    confirmSaveProgress() {
        const filename = this.generateSaveFilename();

        try {
            // Export using the generated filename (without .json, it gets added automatically)
            ExportManager.exportAsJSON({
                participantName: this.getParticipantName(),
                filename: filename.replace('.json', '')
            });

            // Hide modal
            this.hideSaveModal();

            // Show success toast
            this.showSaveToast();

        } catch (error) {
            console.error('Failed to save progress:', error);
            // Could add error handling UI here
        }
    },

    /**
     * Show a friendly success toast notification.
     */
    showSaveToast() {
        const toast = document.getElementById('save-toast');
        if (toast) {
            toast.classList.add('show');

            // Auto-hide after 4 seconds
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    },

    /**
     * Copy responses to clipboard.
     */
    async copyToClipboard() {
        const success = await ExportManager.copyToClipboard({ participantName: this.participantName });

        const btn = document.getElementById('btn-copy');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = success ? '✓ Copied!' : '✗ Failed';
            btn.classList.add(success ? 'success' : 'error');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('success', 'error');
            }, 2000);
        }
    },

    /**
     * Get current participant name (from input or saved).
     */
    getParticipantName() {
        // 1. Try input (Welcome View)
        const nameInput = document.getElementById('participant-name');
        if (nameInput && nameInput.value.trim()) {
            return nameInput.value.trim();
        }

        // 2. Try App-level property
        if (this.participantName) {
            return this.participantName;
        }

        // 3. Try Questionnaire Engine (Source of Truth)
        if (typeof QuestionnaireEngine !== 'undefined' && QuestionnaireEngine.participantName) {
            return QuestionnaireEngine.participantName;
        }

        // 4. Try Storage
        const stored = StorageManager.loadParticipantName();
        if (stored) return stored;

        return 'Friend'; // Fallback so filename isn't broken
    },

    /**
     * Copy AI prompt to clipboard.
     */
    async copyAIPrompt() {
        const success = await ExportManager.copyAIPrompt('individual', { participantName: this.getParticipantName() });

        const btn = document.getElementById('btn-copy-ai-prompt');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = success ? '✓ Copied!' : '✗ Failed';
            btn.classList.add(success ? 'success' : 'error');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('success', 'error');
            }, 2000);
        }
    },

    /**
     * Initialize the Complete View (called when view is shown).
     * Binds events and updates stats.
     */
    initCompleteView() {
        this.updateCompleteStats();
        this.bindCompleteViewEvents();
    },

    /**
     * Update the stats display on Complete page.
     */
    updateCompleteStats() {
        // Global Stats
        const statsEl = document.getElementById('complete-stats-text');
        const stats = QuestionnaireEngine.getStats();

        if (statsEl) {
            statsEl.textContent = `${stats.answered} / ${stats.total} Questions Answered`;
        }

        // Partner 1 (You) Stats in Couple Section
        const p1Answered = document.getElementById('p1-answered');
        const p1Total = document.getElementById('p1-total');
        if (p1Answered && p1Total) {
            p1Answered.textContent = stats.answered;
            p1Total.textContent = stats.total;
        }

        // Also update name if we know it
        const p1Name = document.getElementById('p1-name');
        if (p1Name) {
            const name = this.getParticipantName();
            if (name && name !== 'Me') {
                p1Name.textContent = name;
            }
        }
    },

    /**
     * Bind events for the Complete page specifically.
     */
    bindCompleteViewEvents() {
        // Name field - populate and auto-save
        const nameInput = document.getElementById('complete-name-input');
        if (nameInput) {
            // Populate from storage
            nameInput.value = this.getParticipantName();

            // Auto-save on input (debounced)
            let timeoutId;
            nameInput.addEventListener('input', (e) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    const newName = e.target.value.trim();
                    if (newName) {
                        this.participantName = newName;
                        StorageManager.saveParticipantName(newName);
                        if (typeof QuestionnaireEngine !== 'undefined') {
                            QuestionnaireEngine.participantName = newName;
                        }
                    }
                }, 300); // 300ms debounce
            });
        }

        // Copy AI Prompt button - replaces navigation
        const copyPromptBtn = document.getElementById('btn-copy-ai-prompt');
        if (copyPromptBtn) {
            copyPromptBtn.onclick = async () => {
                const name = this.getParticipantName();
                const success = await ExportManager.copyAIPrompt('individual', {
                    participantName: name
                });

                if (success) {
                    // Show success toast
                    if (typeof this.showSuccessCopyToast === 'function') {
                        this.showSuccessCopyToast(name);
                    }

                    // Visual button feedback
                    const originalText = copyPromptBtn.textContent;
                    copyPromptBtn.textContent = '✓ Copied!';
                    copyPromptBtn.classList.add('btn-success');
                    setTimeout(() => {
                        copyPromptBtn.textContent = originalText;
                        copyPromptBtn.classList.remove('btn-success');
                    }, 2000);
                } else {
                    // Error feedback
                    alert('Failed to copy to clipboard. Please use the View Raw button instead.');
                }
            };
        }

        // View Raw Prompt button
        const viewRawBtn = document.getElementById('btn-view-raw-prompt');
        if (viewRawBtn) {
            viewRawBtn.onclick = () => {
                const name = this.getParticipantName();
                ExportManager.showIndividualPromptRaw({ participantName: name });
            };
        }

        // Review Answers
        const reviewBtn = document.getElementById('btn-review-answers');
        if (reviewBtn) {
            reviewBtn.onclick = () => {
                const phase = DataLoader.getCurrentPhaseId();
                window.location.hash = `#/${phase}/review`;
            };
        }

        // Export Buttons
        const exportJsonBtn = document.getElementById('btn-export-json');
        if (exportJsonBtn) {
            exportJsonBtn.onclick = () => this.exportJSON();
        }

        const exportTextBtn = document.getElementById('btn-export-text');
        if (exportTextBtn) {
            exportTextBtn.onclick = () => this.exportText();
        }

        // Upgrade to Full Mode
        const upgradeBtn = document.getElementById('btn-upgrade-full');
        if (upgradeBtn) {
            upgradeBtn.onclick = async () => {
                // Switch to full mode
                QuestionnaireEngine.mode = 'full';
                StorageManager.saveMode('full');

                // Reinitialize with full mode
                await QuestionnaireEngine.init('full');

                // Navigate to first unanswered question in full mode
                const phase = DataLoader.getCurrentPhaseId();
                const firstUnanswered = QuestionnaireEngine.findFirstUnanswered();
                if (firstUnanswered) {
                    window.location.hash = `#/${phase}/${firstUnanswered}`;
                } else {
                    // All questions answered, go to questionnaire view
                    window.location.hash = `#/${phase}/questionnaire`;
                }
            };
        }

        // Check if user completed in Lite mode and show upgrade section
        this.updateUpgradeSection();

        // Partner file upload
        const zone = document.getElementById('upload-zone-partner');
        const input = document.getElementById('import-file-partner');
        const removeBtn = document.querySelector('#upload-info-partner .upload-remove');
        const generateBtn = document.getElementById('btn-generate-couple-prompt');

        if (zone && input) {
            // Remove old listeners by cloning (simple reset)
            const newZone = zone.cloneNode(true);
            zone.parentNode.replaceChild(newZone, zone);

            // Re-select fresh elements
            const freshZone = document.getElementById('upload-zone-partner');
            const freshInput = freshZone.querySelector('#import-file-partner');
            const freshRemoveBtn = freshZone.querySelector('.upload-remove');
            const freshGenerateBtn = document.getElementById('btn-generate-couple-prompt');

            // Click to upload
            freshZone.addEventListener('click', (e) => {
                if (e.target !== freshRemoveBtn) freshInput.click();
            });

            // File change
            freshInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    await this.handlePartnerFile(e.target.files[0]);
                }
            });

            // Drag & Drop
            freshZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                freshZone.classList.add('drag-over');
            });
            freshZone.addEventListener('dragleave', () => {
                freshZone.classList.remove('drag-over');
            });
            freshZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                freshZone.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    await this.handlePartnerFile(e.dataTransfer.files[0]);
                }
            });

            // Remove file
            if (freshRemoveBtn) {
                freshRemoveBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clearPartnerFile();
                });
            }

            // Prevent input click from triggering file upload
            const partnerInfo = document.getElementById('partner-info-container');
            if (partnerInfo) {
                partnerInfo.addEventListener('click', (e) => {
                    // Stop propagation so we don't trigger the zone's click listener
                    e.stopPropagation();
                });
            }

            // Generate Button
            if (freshGenerateBtn) {
                // Remove old listeners
                const newBtn = freshGenerateBtn.cloneNode(true);
                freshGenerateBtn.parentNode.replaceChild(newBtn, freshGenerateBtn);

                newBtn.addEventListener('click', () => {
                    this.generateCombinedCouplePrompt();
                });
            }
        }
    },

    /**
     * Handle partner file upload.
     */
    async handlePartnerFile(file) {
        try {
            const parsed = await ImportManager.parseFile(file);
            this.partnerData = parsed;

            // Get current user context for validation
            const currentArtifact = DataLoader.getArtifact();
            const currentStats = QuestionnaireEngine.getStats();

            // UI References
            const zone = document.getElementById('upload-zone-partner');
            const content = zone.querySelector('.upload-zone-content');
            const info = zone.querySelector('.upload-zone-info');
            const nameEl = info.querySelector('.upload-name');
            const btn = document.getElementById('btn-generate-couple-prompt');

            // New UI fields
            const nameInput = document.getElementById('partner-name-input');
            const statsAnswered = document.getElementById('partner-stats-answered');
            const statsTotal = document.getElementById('partner-stats-total');
            const warningEl = document.getElementById('partner-warning');

            // Validation Checks
            const warnings = [];
            let isValid = true; // Use this to gate generation if critical mismatch? 

            // 1. Check if Artifact IDs match
            if (parsed.artifactId && currentArtifact.id && parsed.artifactId !== currentArtifact.id) {
                warnings.push(`⚠️ Mismatch: Partner used a different questionnaire ("${parsed.artifactId}" vs yours "${currentArtifact.id}"). Results may not align.`);
            }

            // 2. Check Mode (Lite vs Full) match - ImportManager also checks this conceptually but we do it explicitly here
            // We can infer mode from stats if not explicit
            const partnerMode = parsed.mode;
            const myMode = QuestionnaireEngine.mode || 'lite';

            if (partnerMode !== myMode) {
                warnings.push(`⚠️ Mode Mismatch: Partner did "${partnerMode}" but you did "${myMode}". Proceed with caution.`);
            }

            // 3. Stats Check (Unanswered questions)
            const answered = parsed.stats?.answered || 0;
            const total = parsed.stats?.total || parsed.questionCount || 0;

            if (answered < total) {
                // Not necessarily a warning, just info, but if it's very low...
                if (answered === 0) {
                    warnings.push(`⚠️ Partner file appears empty (0 answers).`);
                }
            }

            // Update UI
            if (content) content.style.display = 'none';
            if (info) info.style.display = 'flex'; // Use flex for column layout
            if (nameEl) nameEl.textContent = parsed.fileName;
            if (zone) zone.classList.add('has-file');

            // Populate fields
            if (nameInput) {
                // Default to parsed name, or "Partner" if empty/unknown
                nameInput.value = parsed.name && parsed.name !== 'Unknown' ? parsed.name : 'Partner';

                // Add listener to update partnerData.name when input changes
                nameInput.oninput = (e) => {
                    if (this.partnerData) {
                        this.partnerData.name = e.target.value;
                    }
                };
            }

            if (statsAnswered) statsAnswered.textContent = answered;
            if (statsTotal) statsTotal.textContent = total;

            // Show warnings if any
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
            alert(`Error reading file: ${error.message}`);
            this.clearPartnerFile();
        }
    },

    /**
     * Clear partner file.
     */
    clearPartnerFile() {
        this.partnerData = null;

        const zone = document.getElementById('upload-zone-partner');
        const input = document.getElementById('import-file-partner');
        const content = zone?.querySelector('.upload-zone-content');
        const info = zone?.querySelector('.upload-zone-info');
        const btn = document.getElementById('btn-generate-couple-prompt');

        // Specific fields
        const nameInput = document.getElementById('partner-name-input');
        const warningEl = document.getElementById('partner-warning');

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
     * Generate and copy the combined couple prompt.
     */
    async generateCombinedCouplePrompt() {
        if (!this.partnerData) return;

        try {
            // Ensure we have the latest name from input
            const nameInput = document.getElementById('partner-name-input');
            if (nameInput && nameInput.value) {
                this.partnerData.name = nameInput.value;
            }

            // Create "self" data structure similar to what ImportManager returns
            const selfData = {
                name: this.getParticipantName() || 'Me',
                mode: QuestionnaireEngine.mode || 'lite',
                formattedText: ImportManager.formatJSONResponses(QuestionnaireEngine.responses),
                format: 'json' // Simulated
            };

            const mode = QuestionnaireEngine.mode || 'lite';
            const prompt = DataLoader.getPrompt('couple', mode);

            // Generate text
            const promptText = ImportManager.buildCouplePrompt(
                selfData,
                this.partnerData,
                prompt
            );

            // Copy to clipboard
            await navigator.clipboard.writeText(promptText);

            // Toast feedback on button
            const btn = document.getElementById('btn-generate-couple-prompt');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied to Clipboard!';
            btn.classList.add('btn-success');

            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('btn-success');
            }, 3000);

        } catch (error) {
            console.error('Failed to generate couple prompt:', error);
            alert('Failed to generate prompt. Please try again.');
        }
    },

    /**
     * Copy results for couple's review.
     */
    async copyResultsForCouple() {
        const success = await ExportManager.copyResultsForCouple({ participantName: this.getParticipantName() });

        const btn = document.getElementById('btn-copy-results');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = success ? '✓ Results Copied!' : '✗ Failed';
            btn.classList.add(success ? 'success' : 'error');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('success', 'error');
            }, 2000);
        }
    },

    /**
     * Copy couple's AI prompt template.
     */
    async copyCouplePrompt() {
        const success = await ExportManager.copyCouplePrompt();

        const btn = document.getElementById('btn-copy-couple-prompt');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = success ? '✓ Prompt Copied!' : '✗ Failed';
            btn.classList.add(success ? 'success' : 'error');

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('success', 'error');
            }, 2000);
        }
    },

    /**
     * Update the upgrade section visibility and position based on completion mode.
     * Shows upgrade section prominently for Lite mode completers.
     */
    updateUpgradeSection() {
        const upgradeSection = document.getElementById('upgrade-section');
        if (!upgradeSection) return;

        const currentMode = QuestionnaireEngine.mode || 'lite';
        const completedModes = StorageManager.loadCompletedModes();

        // Show upgrade section if user completed in Lite mode but not Full
        if (currentMode === 'lite' && !completedModes.includes('full')) {
            upgradeSection.style.display = 'block';

            // Calculate additional questions
            const stats = QuestionnaireEngine.getStats();
            const fullQuestions = DataLoader.getQuestions('full');
            const liteQuestions = DataLoader.getQuestions('lite');
            const additionalCount = fullQuestions.length - liteQuestions.length;

            const countEl = document.getElementById('additional-count');
            if (countEl) {
                countEl.textContent = additionalCount;
            }

            // Move upgrade section to prominent position (after review card)
            const container = upgradeSection.parentElement;
            const reviewCard = document.querySelector('.review-card');
            if (container && reviewCard && reviewCard.nextSibling !== upgradeSection) {
                container.insertBefore(upgradeSection, reviewCard.nextSibling);
            }
        } else {
            upgradeSection.style.display = 'none';
        }
    },

    /**
     * Show success toast when AI prompt is copied.
     * @param {string} name - Participant name
     */
    showSuccessCopyToast(name) {
        if (typeof this.showToast === 'function') {
            this.showToast(`✓ Successfully copied AI prompt for ${name}!`, 'success', 4000);
        }
    }

};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppExport);
}
