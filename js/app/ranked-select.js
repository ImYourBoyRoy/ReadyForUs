// ./js/app/ranked-select.js
/**
 * Ranked Select module for the Ready for Us.
 * 
 * Manages drag-and-drop ranking functionality for ranked_select question types.
 * Handles checkbox selection, reordering, and visual feedback.
 * Mixed into the main App object.
 * 
 * Usage: App.setupRankedSelectHandlers(question) after rendering a question.
 */

const AppRankedSelect = {
    /**
     * Get max selections allowed for a ranked_select field.
     * @param {Object} field - Ranked field definition.
     * @returns {number|null} Max allowed selections, or null if unlimited.
     */
    getRankedSelectionLimit(field) {
        if (!field) return null;
        return field.max ?? field.validation?.max_selected ?? null;
    },

    /**
     * Set up ranked-select drag-and-drop handlers for a question.
     * @param {Object} question - Question definition.
     */
    setupRankedSelectHandlers(question) {
        if (question.type !== 'compound' || !question.fields) return;

        const container = document.getElementById('question-container');

        question.fields.forEach(field => {
            if (field.type !== 'ranked_select') return;

            const cardsList = container.querySelector(`.ranked-cards-list[data-field="${field.key}"]`);
            if (!cardsList) return;

            const questionId = cardsList.dataset.questionId;
            const fieldKey = cardsList.dataset.field;

            // Build option lookup
            const optionMap = {};
            field.options.forEach(opt => { optionMap[opt.value] = opt.label; });

            // --- Checkbox change: Add/remove from ranking and re-render ---
            cardsList.querySelectorAll('.ranked-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const value = e.target.value;
                    let response = QuestionnaireEngine.getResponse(questionId);
                    if (!response[fieldKey]) response[fieldKey] = [];
                    const selectionLimit = this.getRankedSelectionLimit(field);

                    if (e.target.checked) {
                        const hasLimit = Number.isInteger(selectionLimit) && selectionLimit > 0;
                        const alreadySelected = response[fieldKey].includes(value);
                        if (hasLimit && !alreadySelected && response[fieldKey].length >= selectionLimit) {
                            e.target.checked = false;
                            this.showToast?.(`Select up to ${selectionLimit} items to rank.`, 'info', 2200);
                            return;
                        }

                        // Add to ranking (at end)
                        if (!response[fieldKey].includes(value)) {
                            response[fieldKey].push(value);
                        }
                    } else {
                        // Remove from ranking
                        response[fieldKey] = response[fieldKey].filter(v => v !== value);
                    }

                    QuestionnaireEngine.saveResponse(questionId, response);

                    // Re-render entire card list
                    this.rerenderRankedCards(cardsList, field, response[fieldKey], questionId, fieldKey);
                    this.updateNavigationButtons();
                    this.updateProgress();
                });
            });

            // Support card-body tap-to-toggle on first render as well.
            this.attachRankedCardClickHandlers(cardsList);

            // Set up unified handlers
            this.setupUnifiedRankedHandlers(cardsList, questionId, fieldKey, field);
        });
    },

    /**
     * Re-render the ranked cards list after selection/order changes.
     */
    rerenderRankedCards(cardsList, field, rankedValues, questionId, fieldKey) {
        // Sort: selected first (in rank order), then unselected
        const selectedOptions = rankedValues
            .map(val => field.options.find(opt => opt.value === val))
            .filter(Boolean);
        const unselectedOptions = field.options.filter(opt => !rankedValues.includes(opt.value));
        const sortedOptions = [...selectedOptions, ...unselectedOptions];

        cardsList.innerHTML = sortedOptions.map(option => {
            const isSelected = rankedValues.includes(option.value);
            const rank = isSelected ? rankedValues.indexOf(option.value) + 1 : null;
            // Note: draggable="false" to prevent native HTML5 DnD interference
            return `
                <div class="ranked-card ${isSelected ? 'ranked-card--selected' : ''}" 
                     data-value="${option.value}"
                     draggable="false">
                    <label class="ranked-card-checkbox">
                        <input 
                            type="checkbox" 
                            class="checkbox-input ranked-checkbox" 
                            value="${option.value}"
                            ${isSelected ? 'checked' : ''}
                            data-question-id="${questionId}"
                            data-field="${fieldKey}"
                        >
                        <span class="checkbox-custom"></span>
                    </label>
                    ${isSelected ? `<span class="ranked-card-rank">${rank}</span>` : ''}
                    <span class="ranked-card-label">${option.label}</span>
                    ${isSelected ? `<span class="ranked-card-handle" title="Drag to reorder">⠿</span>` : ''}
                </div>
            `;
        }).join('');

        // Re-attach event handlers
        cardsList.querySelectorAll('.ranked-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const value = e.target.value;
                let response = QuestionnaireEngine.getResponse(questionId);
                if (!response[fieldKey]) response[fieldKey] = [];
                const selectionLimit = this.getRankedSelectionLimit(field);

                if (e.target.checked) {
                    const hasLimit = Number.isInteger(selectionLimit) && selectionLimit > 0;
                    const alreadySelected = response[fieldKey].includes(value);
                    if (hasLimit && !alreadySelected && response[fieldKey].length >= selectionLimit) {
                        e.target.checked = false;
                        this.showToast?.(`Select up to ${selectionLimit} items to rank.`, 'info', 2200);
                        return;
                    }

                    if (!response[fieldKey].includes(value)) {
                        response[fieldKey].push(value);
                    }
                } else {
                    response[fieldKey] = response[fieldKey].filter(v => v !== value);
                }

                QuestionnaireEngine.saveResponse(questionId, response);
                this.rerenderRankedCards(cardsList, field, response[fieldKey], questionId, fieldKey);
                this.updateNavigationButtons();
                this.updateProgress();
            });
        });

        this.attachRankedCardClickHandlers(cardsList);

        this.setupUnifiedRankedHandlers(cardsList, questionId, fieldKey, field);
    },

    /**
     * Attach card-level click handlers so tapping card bodies toggles checkboxes.
     * @param {HTMLElement} cardsList - Ranked cards list element.
     */
    attachRankedCardClickHandlers(cardsList) {
        cardsList.querySelectorAll('.ranked-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Ignore if this click was part of a drag operation
                if (card.dataset.ignoreClick) {
                    delete card.dataset.ignoreClick;
                    return;
                }

                // Don't toggle if clicking the checkbox label area (handled by checkbox change)
                if (e.target.closest('.ranked-card-checkbox')) return;

                // Don't toggle if clicking the handle
                if (e.target.closest('.ranked-card-handle')) return;

                const checkbox = card.querySelector('.ranked-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
    },

    /**
     * unified drag-and-drop handler using Pointer Events.
     * Works for both Mouse (Desktop) and Touch (Mobile).
     * 
     * Interactions:
     * - Handle: Immediate drag (Mouse & Touch)
     * - Body: Immediate drag (Mouse), Long-press drag (Touch)
     */
    setupUnifiedRankedHandlers(cardsList, questionId, fieldKey, field) {
        const cards = cardsList.querySelectorAll('.ranked-card--selected');

        let draggedCard = null;
        let clone = null;
        let placeholder = null;
        let dragStartX = 0;
        let dragStartY = 0;
        let pointerId = null;
        let isDragging = false;
        let longPressTimer = null;
        let hasMoved = false; // To prevent click after drag

        // Helper: Remove placeholder & clone
        const cleanup = () => {
            if (placeholder) {
                placeholder.remove();
                placeholder = null;
            }
            if (clone) {
                clone.remove();
                clone = null;
            }
            if (draggedCard) {
                draggedCard.classList.remove('dragging');
                draggedCard.style.opacity = '';
                // Release pointer capture if we hold it
                try {
                    if (pointerId !== null) draggedCard.releasePointerCapture(pointerId);
                } catch (e) { }
            }
            draggedCard = null;
            pointerId = null;
            isDragging = false;
            hasMoved = false;

            // Remove global listeners
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.removeEventListener('pointercancel', onPointerCancel);
        };

        // 1. Initiate Drag Logic
        const initiateDrag = (e, card) => {
            isDragging = true;
            draggedCard = card;
            pointerId = e.pointerId;
            hasMoved = false; // Reset

            try {
                card.setPointerCapture(e.pointerId);
            } catch (err) {
                console.warn('Failed to capture pointer', err);
            }

            // Haptic feedback (silently fail if blocked)
            try {
                if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) {
                    navigator.vibrate(50);
                }
            } catch (err) { }

            // Visuals
            card.classList.add('dragging');
            card.style.opacity = '0.3';

            // Create clone for visual follow
            const rect = card.getBoundingClientRect();
            clone = card.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.top = `${rect.top}px`;
            clone.style.left = `${rect.left}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.zIndex = '9999';
            clone.style.pointerEvents = 'none'; // click-through
            clone.style.opacity = '0.95';
            clone.style.boxShadow = 'var(--shadow-xl)';
            clone.style.transform = 'scale(1.02)';
            document.body.appendChild(clone);

            // Offset for smooth drag
            dragStartX = e.clientX - rect.left;
            dragStartY = e.clientY - rect.top;

            // Global listeners
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            document.addEventListener('pointercancel', onPointerCancel);
        };

        // 2. Pointer Move
        const onPointerMove = (e) => {
            if (!isDragging || !clone) return;

            e.preventDefault(); // Stop scrolling/selection
            hasMoved = true;
            draggedCard.dataset.ignoreClick = "true";

            // Move clone
            const x = e.clientX - dragStartX;
            const y = e.clientY - dragStartY;
            clone.style.top = `${y}px`;
            clone.style.left = `${x}px`;

            // Find drop target
            // Temporarily hide clone to see what's underneath
            clone.style.display = 'none';
            const targetElement = document.elementFromPoint(e.clientX, e.clientY);
            clone.style.display = '';

            if (!targetElement) return;

            const targetCard = targetElement.closest('.ranked-card');

            // If strictly over the list but not a card, handle edge cases? 
            // For now, only reorder if over another card in the same list.
            if (targetCard && targetCard !== draggedCard && cardsList.contains(targetCard)) {

                const rect = targetCard.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const insertBefore = e.clientY < midpoint;

                // Optimization: Don't recreate placeholder if position hasn't changed
                const currentPlaceholder = cardsList.querySelector('.ranked-drop-placeholder');
                if (currentPlaceholder) {
                    const isBefore = currentPlaceholder.nextSibling === targetCard;
                    const isAfter = currentPlaceholder.previousSibling === targetCard;
                    // If we are strictly already in the right spot (ignoring the dragged card itself which is hidden/moved)
                    // ... implementation detail: placeholder logic can be tricky.
                    // simpler: remove old, add new.
                }

                if (placeholder) placeholder.remove();

                placeholder = document.createElement('div');
                placeholder.className = 'ranked-drop-placeholder';
                placeholder.dataset.targetValue = targetCard.dataset.value;
                placeholder.dataset.insertBefore = insertBefore;

                if (insertBefore) {
                    targetCard.parentNode.insertBefore(placeholder, targetCard);
                } else {
                    targetCard.parentNode.insertBefore(placeholder, targetCard.nextSibling);
                }
            }
        };

        // 3. Pointer Up (Drop)
        const onPointerUp = (e) => {
            if (!isDragging) {
                cleanup();
                return;
            }

            try {
                if (placeholder && placeholder.dataset.targetValue) {
                    // Execute Reorder
                    const targetValue = placeholder.dataset.targetValue;
                    const insertBefore = placeholder.dataset.insertBefore === 'true';

                    let response = QuestionnaireEngine.getResponse(questionId);
                    const rankedValues = [...(response[fieldKey] || [])];
                    const draggedValue = draggedCard.dataset.value;

                    // Remove dragged item
                    const oldIdx = rankedValues.indexOf(draggedValue);
                    if (oldIdx > -1) rankedValues.splice(oldIdx, 1);

                    // Insert at new position
                    let newIdx = rankedValues.indexOf(targetValue);
                    if (newIdx === -1) {
                        // Fallback
                        newIdx = rankedValues.length;
                    } else if (!insertBefore) {
                        newIdx += 1;
                    }

                    rankedValues.splice(newIdx, 0, draggedValue);

                    // Save response
                    response[fieldKey] = rankedValues;
                    QuestionnaireEngine.saveResponse(questionId, response);

                    // Defer re-render to allow cleanup to finish and event to propagate
                    setTimeout(() => {
                        App.rerenderRankedCards(cardsList, field, response[fieldKey], questionId, fieldKey);
                        App.updateNavigationButtons();
                        App.updateProgress();
                    }, 0);

                } else {
                    // Cancelled / No drop target
                }
            } catch (err) {
                console.error('Ranked drag error:', err);
            } finally {
                cleanup();
            }
        };

        // 4. Pointer Cancel
        const onPointerCancel = (e) => {
            cleanup();
        };


        // Register Listeners on Cards
        cards.forEach(card => {
            card.addEventListener('pointerdown', (e) => {
                // Only left mouse button or touch
                if (e.pointerType === 'mouse' && e.button !== 0) return;

                // Stop event from bubbling if we handle it
                // But we need to be careful not to kill checkbox clicks if we aren't dragging.
                const isHandle = e.target.closest('.ranked-card-handle');
                const isCheckbox = e.target.closest('.ranked-card-checkbox');

                if (isCheckbox) return; // Let checkbox work normally

                if (isHandle) {
                    e.preventDefault(); // Prevent text selection etc
                    initiateDrag(e, card);
                } else {
                    // Body Drag
                    if (e.pointerType === 'mouse') {
                        // Mouse: Drag immediately
                        e.preventDefault();
                        initiateDrag(e, card);
                    } else {
                        // Touch: Long press required for body drag (to allow scrolling)
                        // Don't preventDefault yet, let scroll happen
                        longPressTimer = setTimeout(() => {
                            // If we haven't canceled yet, start drag
                            initiateDrag(e, card);
                        }, 300); // 300ms long press

                        // Monitor for move to cancel timer if scrolling starts
                        const cancelTimer = () => {
                            clearTimeout(longPressTimer);
                            card.removeEventListener('pointermove', checkMove);
                            card.removeEventListener('pointerup', cancelTimer);
                            card.removeEventListener('pointercancel', cancelTimer);
                        };

                        const checkMove = (ev) => {
                            if (Math.abs(ev.clientX - e.clientX) > 10 || Math.abs(ev.clientY - e.clientY) > 10) {
                                cancelTimer(); // Moved too much, it's a scroll
                            }
                        };

                        card.addEventListener('pointermove', checkMove);
                        card.addEventListener('pointerup', cancelTimer);
                        card.addEventListener('pointercancel', cancelTimer);
                    }
                }
            });
        });
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppRankedSelect);
}
