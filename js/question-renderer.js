// ./js/question-renderer.js
/**
 * Question renderer module for the Slow Build Check-In questionnaire.
 * 
 * Renders different question types (single_select, multi_select, free_text, compound)
 * with appropriate form controls and styling.
 * 
 * Usage: Import and call QuestionRenderer.render(question, response) to generate HTML.
 */

const QuestionRenderer = {
  /**
   * Render a question card HTML.
   * @param {Object} question - Question object from data.
   * @param {Object} response - Current response for this question.
   * @param {Object} options - Rendering options (showExamples, questionNumber, totalQuestions).
   * @returns {string} HTML string for the question card.
   */
  render(question, response = {}, options = {}) {
    const { showExamples = true, questionNumber = 1, totalQuestions = 18, sectionTitle = '' } = options;
    const safeQuestionId = this.escapeHtml(question.id);
    const safeSectionTitle = this.escapeHtml(sectionTitle);
    const safeTitle = this.escapeHtml(question.title);
    const safePrompt = this.escapeHtml(question.prompt);

    return `
      <div class="question-card active" data-question-id="${safeQuestionId}">
        <div class="question-header">
          <div class="question-meta">
            <span class="question-number">Question ${questionNumber} of ${totalQuestions}</span>
            ${sectionTitle ? `<span class="question-section">${safeSectionTitle}</span>` : ''}
          </div>
          <h2 class="question-title">${safeTitle}</h2>
          <p class="question-prompt">${safePrompt}</p>
        </div>
        
        <div class="question-body">
          ${this.renderInput(question, response)}
        </div>
        
        ${showExamples && question.examples?.length ? this.renderExamples(question.examples) : ''}
      </div>
    `;
  },

  /**
   * Render the appropriate input type for a question.
   * @param {Object} question - Question object.
   * @param {Object} response - Current response.
   * @returns {string} HTML string for the input.
   */
  renderInput(question, response = {}) {
    switch (question.type) {
      case 'single_select':
        return this.renderSingleSelect(question, response);
      case 'multi_select':
        return this.renderMultiSelect(question, response);
      case 'free_text':
        return this.renderFreeText(question, response);
      case 'compound':
        return this.renderCompound(question, response);
      default:
        console.warn(`Unknown question type: ${question.type}`);
        return this.renderFreeText(question, response);
    }
  },

  /**
   * Escape text content for safe HTML rendering.
   * @param {*} value - Value to escape.
   * @returns {string}
   */
  escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Render single select (radio buttons).
   */
  renderSingleSelect(question, response) {
    const selectedValue = response.selected_value || '';
    const otherText = response.other_text || '';
    const safeQuestionId = this.escapeHtml(question.id);
    const safeOtherText = this.escapeHtml(otherText);

    return `
      <div class="question-options" role="radiogroup" aria-labelledby="q-${safeQuestionId}-label">
        ${question.options.map((option, index) => `
          <label class="radio-wrapper" style="animation-delay: ${index * 0.05}s">
            <input 
              type="radio" 
              class="radio-input" 
              id="q-${safeQuestionId}-${this.escapeHtml(option.value)}"
              name="q-${safeQuestionId}" 
              value="${this.escapeHtml(option.value)}"
              ${selectedValue === option.value ? 'checked' : ''}
              data-question-id="${safeQuestionId}"
            >
            <span class="radio-custom"></span>
            <span class="radio-label">${this.escapeHtml(option.label)}</span>
          </label>
        `).join('')}
        
        ${question.options.some(o => o.value === 'other') ? `
          <div class="other-input-wrapper ${selectedValue === 'other' ? 'visible' : ''}">
            <input 
              type="text" 
              class="input other-input" 
              id="q-${safeQuestionId}-other-text"
              name="q-${safeQuestionId}-other"
              placeholder="Please specify..."
              value="${safeOtherText}"
              data-question-id="${safeQuestionId}"
              data-field="other_text"
            >
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Render multi select (checkboxes).
   */
  renderMultiSelect(question, response) {
    const selectedValues = response.selected_values || [];
    const otherText = response.other_text || '';
    const safeQuestionId = this.escapeHtml(question.id);
    const safeOtherText = this.escapeHtml(otherText);

    return `
      <div class="question-options" role="group" aria-labelledby="q-${safeQuestionId}-label">
        ${question.options.map((option, index) => `
          <label class="checkbox-wrapper" style="animation-delay: ${index * 0.05}s">
            <input 
              type="checkbox" 
              class="checkbox-input" 
              id="q-${safeQuestionId}-${this.escapeHtml(option.value)}"
              name="q-${safeQuestionId}" 
              value="${this.escapeHtml(option.value)}"
              ${selectedValues.includes(option.value) ? 'checked' : ''}
              data-question-id="${safeQuestionId}"
            >
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">${this.escapeHtml(option.label)}</span>
          </label>
        `).join('')}
        
        ${question.options.some(o => o.value === 'other') ? `
          <div class="other-input-wrapper ${selectedValues.includes('other') ? 'visible' : ''}">
            <input 
              type="text" 
              class="input other-input" 
              id="q-${safeQuestionId}-other-text"
              name="q-${safeQuestionId}-other"
              placeholder="Please specify..."
              value="${safeOtherText}"
              data-question-id="${safeQuestionId}"
              data-field="other_text"
            >
          </div>
        ` : ''}
      </div>
      
      <div class="selection-count">
        <span class="count-text">${selectedValues.length} selected</span>
      </div>
    `;
  },

  /**
   * Render free text (textarea).
   */
  renderFreeText(question, response) {
    const text = response.text || '';
    const safeQuestionId = this.escapeHtml(question.id);

    return `
      <div class="free-text-wrapper">
        <textarea 
          class="input textarea" 
          id="q-${safeQuestionId}-text"
          name="q-${safeQuestionId}"
          placeholder="Share your thoughts..."
          data-question-id="${safeQuestionId}"
          data-field="text"
          rows="4"
        >${this.escapeHtml(text)}</textarea>
        <div class="char-hint">Take your time. There's no wrong answer.</div>
      </div>
    `;
  },

  /**
   * Render compound question (multiple fields).
   */
  renderCompound(question, response) {
    return `
      <div class="compound-fields">
        ${question.fields.map(field => this.renderCompoundField(field, question.id, response)).join('')}
      </div>
    `;
  },

  /**
   * Render a single field within a compound question.
   */
  renderCompoundField(field, questionId, response) {
    const value = response[field.key] ?? '';
    const safeQuestionId = this.escapeHtml(questionId);
    const safeFieldKey = this.escapeHtml(field.key);
    const safeFieldLabel = this.escapeHtml(field.label);

    // Check showWhen conditions for conditional field visibility
    const isVisible = this.evaluateShowWhen(field, response);
    const hiddenClass = isVisible ? '' : 'hidden';

    switch (field.type) {
      case 'single_select':
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${safeFieldKey}">
            <label class="input-label">${safeFieldLabel}</label>
            <div class="question-options compact">
              ${field.options.map(option => `
                <label class="radio-wrapper">
                  <input 
                    type="radio" 
                    class="radio-input" 
                    name="q-${safeQuestionId}-${safeFieldKey}" 
                    value="${this.escapeHtml(option.value)}"
                    ${value === option.value ? 'checked' : ''}
                    data-question-id="${safeQuestionId}"
                    data-field="${safeFieldKey}"
                  >
                  <span class="radio-custom"></span>
                  <span class="radio-label">${this.escapeHtml(option.label)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;

      case 'multi_select':
        const selectedValues = Array.isArray(value) ? value : [];
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${safeFieldKey}">
            <label class="input-label">${safeFieldLabel}</label>
            <div class="question-options compact">
              ${field.options.map(option => `
                <label class="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    class="checkbox-input" 
                    name="q-${safeQuestionId}-${safeFieldKey}" 
                    value="${this.escapeHtml(option.value)}"
                    ${selectedValues.includes(option.value) ? 'checked' : ''}
                    data-question-id="${safeQuestionId}"
                    data-field="${safeFieldKey}"
                  >
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-label">${this.escapeHtml(option.label)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;

      case 'number':
        const isInlineNumber = field.layout === 'inline';
        return `
          <div class="compound-field ${isInlineNumber ? 'inline-field' : ''} ${hiddenClass}" data-field-key="${safeFieldKey}">
            <label class="input-label">${safeFieldLabel}</label>
            <input 
              type="number" 
              class="input number-input" 
              value="${this.escapeHtml(value || '')}"
              min="${field.min || 0}"
              ${field.max ? `max="${field.max}"` : ''}
              placeholder="${this.escapeHtml(field.placeholder || '')}"
              data-question-id="${safeQuestionId}"
              data-field="${safeFieldKey}"
            >
          </div>
        `;

      case 'dropdown':
        const isInlineDropdown = field.layout === 'inline';
        return `
          <div class="compound-field ${isInlineDropdown ? 'inline-field' : ''} ${hiddenClass}" data-field-key="${safeFieldKey}">
            <label class="input-label">${safeFieldLabel}</label>
            <select 
              class="input dropdown-input" 
              data-question-id="${safeQuestionId}"
              data-field="${safeFieldKey}"
            >
              <option value="">Select...</option>
              ${field.options.map(option => `
                <option value="${this.escapeHtml(option.value)}" ${value === option.value ? 'selected' : ''}>
                  ${this.escapeHtml(option.label)}
                </option>
              `).join('')}
            </select>
          </div>
        `;

      case 'short_text':
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${safeFieldKey}">
            <label class="input-label">${safeFieldLabel}</label>
            <input 
              type="text" 
              class="input" 
              value="${this.escapeHtml(value)}"
              placeholder="${this.escapeHtml(field.placeholder || 'Type here...')}"
              data-question-id="${safeQuestionId}"
              data-field="${safeFieldKey}"
            >
          </div>
        `;

      case 'free_text':
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${safeFieldKey}">
            <label class="input-label">${safeFieldLabel}</label>
            <textarea 
              class="input textarea" 
              placeholder="${this.escapeHtml(field.placeholder || 'Share your thoughts...')}"
              data-question-id="${safeQuestionId}"
              data-field="${safeFieldKey}"
              rows="3"
            >${this.escapeHtml(value)}</textarea>
          </div>
        `;

      case 'ranked_select':
        // Unified draggable card list: each option is a card with checkbox + rank badge
        const rankedValues = Array.isArray(value) ? value : [];

        // Sort options: selected items first (in rank order), then unselected
        const selectedOptions = rankedValues
          .map(val => field.options.find(opt => opt.value === val))
          .filter(Boolean);
        const unselectedOptions = field.options.filter(opt => !rankedValues.includes(opt.value));
        const sortedOptions = [...selectedOptions, ...unselectedOptions];

        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${safeFieldKey}">
            <label class="input-label">${safeFieldLabel}</label>
            <p class="ranked-instructions">Check to select, then drag (or long-press on mobile) to reorder your priorities. Top = most important.</p>
            <div class="ranked-cards-list" data-question-id="${safeQuestionId}" data-field="${safeFieldKey}">
              ${sortedOptions.map(option => {
          const isSelected = rankedValues.includes(option.value);
          const rank = isSelected ? rankedValues.indexOf(option.value) + 1 : null;
          return `
                  <div class="ranked-card ${isSelected ? 'ranked-card--selected' : ''}" 
                       data-value="${this.escapeHtml(option.value)}" 
                       draggable="${isSelected}">
                    <label class="ranked-card-checkbox">
                      <input 
                        type="checkbox" 
                        class="checkbox-input ranked-checkbox" 
                        value="${this.escapeHtml(option.value)}"
                        ${isSelected ? 'checked' : ''}
                        data-question-id="${safeQuestionId}"
                        data-field="${safeFieldKey}"
                      >
                      <span class="checkbox-custom"></span>
                    </label>
                    ${isSelected ? `<span class="ranked-card-rank">${rank}</span>` : ''}
                    <span class="ranked-card-label">${this.escapeHtml(option.label)}</span>
                    ${isSelected ? `<span class="ranked-card-handle" title="Drag to reorder">⠿</span>` : ''}
                  </div>
                `;
        }).join('')}
            </div>
          </div>
        `;

      default:
        return '';
    }
  },

  /**
   * Evaluate showWhen condition for a field.
   * @param {Object} field - Field definition with optional showWhen property.
   * @param {Object} response - Current response object.
   * @returns {boolean} True if field should be visible.
   */
  evaluateShowWhen(field, response) {
    // If no showWhen condition, always visible
    if (!field.showWhen) return true;

    const condition = field.showWhen;
    const targetFieldValue = response[condition.field];

    // Handle "equals" condition (single value match)
    if (condition.equals !== undefined) {
      return targetFieldValue === condition.equals;
    }

    // Handle "in" condition (match any in array)
    if (condition.in !== undefined && Array.isArray(condition.in)) {
      return condition.in.includes(targetFieldValue);
    }

    // Handle "includes" condition (for multi-select, check if array includes value)
    if (condition.includes !== undefined) {
      if (Array.isArray(targetFieldValue)) {
        return targetFieldValue.includes(condition.includes);
      }
      // Support single-select fields that use includes for parity with multi-select.
      if (typeof targetFieldValue === 'string') {
        return targetFieldValue === condition.includes;
      }
      return false;
    }

    // Default to visible if condition format is unknown
    return true;
  },

  /**
   * Render example responses.
   */
  renderExamples(examples) {
    return `
      <div class="examples-block">
        <div class="examples-title">💡 Example responses:</div>
        <ul class="examples-list">
          ${examples.map(ex => `<li>${this.escapeHtml(ex)}</li>`).join('')}
        </ul>
      </div>
    `;
  },

  /**
   * Render a mini review card for the review page.
   * @param {Object} question - Question object.
   * @param {Object} response - Response object.
   * @param {string} status - Answer status ('answered', 'skipped', 'unanswered').
   * @param {Object} options - Additional options like needsReview.
   */
  renderReviewCard(question, response, status = 'unanswered', options = {}) {
    const needsReview = options.needsReview || false;
    const safeQuestionId = this.escapeHtml(question.id);
    const safeTitle = this.escapeHtml(question.title);
    const safeAnswer = this.escapeHtml(this.formatAnswer(question, response));

    // Override icon and class if question needs import review
    let statusIcon, statusClass;
    if (needsReview && status === 'answered') {
      statusIcon = '⚠️';
      statusClass = 'review-card--warning';
    } else {
      const statusIcons = {
        answered: '✓',
        skipped: '⏭',
        unanswered: '○'
      };
      const statusClasses = {
        answered: 'review-card--answered',
        skipped: 'review-card--skipped',
        unanswered: 'review-card--unanswered'
      };
      statusIcon = statusIcons[status];
      statusClass = statusClasses[status];
    }

    return `
      <div class="review-card ${statusClass}" data-question-id="${safeQuestionId}">
        <div class="review-card-header">
          <span class="review-card-number">Q${question.order}</span>
          <span class="review-card-status" aria-label="${needsReview ? 'needs review' : status}">${statusIcon}</span>
        </div>
        <div class="review-card-title">${safeTitle}</div>
        ${status === 'answered' ? `
          <div class="review-card-answer">${safeAnswer}</div>
        ` : ''}
        ${needsReview ? '<div class="review-card-warning">Import may need verification</div>' : ''}
      </div>
    `;
  },

  /**
   * Format an answer for display in review.
   */
  formatAnswer(question, response) {
    if (!response) return '';

    switch (question.type) {
      case 'single_select':
        const option = (question.options || []).find(o => o.value === response.selected_value);
        return option ? option.label : response.selected_value || '';

      case 'multi_select':
        const labels = (response.selected_values || []).map(v => {
          const opt = (question.options || []).find(o => o.value === v);
          return opt ? opt.label : v;
        });
        return labels.join(', ');

      case 'free_text':
        const text = response.text || '';
        return text.length > 60 ? text.substring(0, 60) + '...' : text;

      case 'compound':
        return 'Multiple fields answered';

      default:
        return '';
    }
  }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestionRenderer;
}
