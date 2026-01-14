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

                    if (e.target.checked) {
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

            // Set up drag handlers for selected cards
            this.setupRankedCardDragHandlers(cardsList, questionId, fieldKey, field);
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
            return `
                <div class="ranked-card ${isSelected ? 'ranked-card--selected' : ''}" 
                     data-value="${option.value}" 
                     draggable="${isSelected}">
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

                if (e.target.checked) {
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

        // Click anywhere on card to toggle selection (except on checkbox itself)
        cardsList.querySelectorAll('.ranked-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't toggle if clicking the checkbox label area (handled by checkbox change)
                if (e.target.closest('.ranked-card-checkbox')) return;

                const checkbox = card.querySelector('.ranked-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        this.setupRankedCardDragHandlers(cardsList, questionId, fieldKey, field);
    },

    /**
     * Set up drag handlers for ranked cards.
     */
    setupRankedCardDragHandlers(cardsList, questionId, fieldKey, field) {
        const cards = cardsList.querySelectorAll('.ranked-card--selected');
        let draggedCard = null;
        let placeholder = null;

        // Remove any existing placeholder
        const removePlaceholder = () => {
            cardsList.querySelectorAll('.ranked-drop-placeholder').forEach(p => p.remove());
            placeholder = null;
        };

        cards.forEach(card => {
            // Drag start
            card.addEventListener('dragstart', (e) => {
                draggedCard = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.value);

                // Add slight delay to show dragging state
                setTimeout(() => {
                    card.style.opacity = '0.5';
                }, 0);
            });

            // Drag end
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                card.style.opacity = '';
                draggedCard = null;
                removePlaceholder();
                cardsList.querySelectorAll('.ranked-card').forEach(c => c.classList.remove('drag-over'));
            });

            // Drag over - show placeholder
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!draggedCard || draggedCard === card || !card.classList.contains('ranked-card--selected')) return;

                // Determine if we're in the top or bottom half of the card
                const rect = card.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                const insertBefore = e.clientY < midpoint;

                // Remove any existing placeholder
                removePlaceholder();

                // Create and insert placeholder
                placeholder = document.createElement('div');
                placeholder.className = 'ranked-drop-placeholder';

                if (insertBefore) {
                    card.parentNode.insertBefore(placeholder, card);
                } else {
                    card.parentNode.insertBefore(placeholder, card.nextSibling);
                }

                // Store insert position for drop
                card.dataset.insertBefore = insertBefore;
            });

            // Drag leave
            card.addEventListener('dragleave', (e) => {
                // Only remove if leaving the card entirely
                const rect = card.getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX > rect.right ||
                    e.clientY < rect.top || e.clientY > rect.bottom) {
                    card.classList.remove('drag-over');
                }
            });

            // Drop
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                removePlaceholder();

                if (!draggedCard || draggedCard === card) return;
                if (!card.classList.contains('ranked-card--selected')) return;

                // Get current response
                let response = QuestionnaireEngine.getResponse(questionId);
                const rankedValues = [...(response[fieldKey] || [])];

                // Calculate new order based on drop position
                const draggedValue = draggedCard.dataset.value;
                const dropValue = card.dataset.value;
                const draggedIdx = rankedValues.indexOf(draggedValue);
                let dropIdx = rankedValues.indexOf(dropValue);

                // Adjust for insert position (before/after)
                const rect = card.getBoundingClientRect();
                const insertBefore = e.clientY < rect.top + rect.height / 2;

                // Remove dragged value
                rankedValues.splice(draggedIdx, 1);

                // Recalculate drop index after removal
                dropIdx = rankedValues.indexOf(dropValue);
                const insertIdx = insertBefore ? dropIdx : dropIdx + 1;

                rankedValues.splice(insertIdx, 0, draggedValue);

                response[fieldKey] = rankedValues;
                QuestionnaireEngine.saveResponse(questionId, response);

                // Re-render with new order
                this.rerenderRankedCards(cardsList, field, rankedValues, questionId, fieldKey);
                this.updateNavigationButtons();
                this.updateProgress();
            });
        });

        // Allow dropping on list itself (for edge cases)
        cardsList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        cardsList.addEventListener('dragleave', () => {
            removePlaceholder();
        });
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppRankedSelect);
}
