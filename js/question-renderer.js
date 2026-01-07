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

    return `
      <div class="question-card active" data-question-id="${question.id}">
        <div class="question-header">
          <div class="question-meta">
            <span class="question-number">Question ${questionNumber} of ${totalQuestions}</span>
            ${sectionTitle ? `<span class="question-section">${sectionTitle}</span>` : ''}
          </div>
          <h2 class="question-title">${question.title}</h2>
          <p class="question-prompt">${question.prompt}</p>
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
   * Render single select (radio buttons).
   */
  renderSingleSelect(question, response) {
    const selectedValue = response.selected_value || '';
    const otherText = response.other_text || '';

    return `
      <div class="question-options" role="radiogroup" aria-labelledby="q-${question.id}-label">
        ${question.options.map((option, index) => `
          <label class="radio-wrapper" style="animation-delay: ${index * 0.05}s">
            <input 
              type="radio" 
              class="radio-input" 
              id="q-${question.id}-${option.value}"
              name="q-${question.id}" 
              value="${option.value}"
              ${selectedValue === option.value ? 'checked' : ''}
              data-question-id="${question.id}"
            >
            <span class="radio-custom"></span>
            <span class="radio-label">${option.label}</span>
          </label>
        `).join('')}
        
        ${question.options.some(o => o.value === 'other') ? `
          <div class="other-input-wrapper ${selectedValue === 'other' ? 'visible' : ''}">
            <input 
              type="text" 
              class="input other-input" 
              id="q-${question.id}-other-text"
              name="q-${question.id}-other"
              placeholder="Please specify..."
              value="${otherText}"
              data-question-id="${question.id}"
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

    return `
      <div class="question-options" role="group" aria-labelledby="q-${question.id}-label">
        ${question.options.map((option, index) => `
          <label class="checkbox-wrapper" style="animation-delay: ${index * 0.05}s">
            <input 
              type="checkbox" 
              class="checkbox-input" 
              id="q-${question.id}-${option.value}"
              name="q-${question.id}" 
              value="${option.value}"
              ${selectedValues.includes(option.value) ? 'checked' : ''}
              data-question-id="${question.id}"
            >
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">${option.label}</span>
          </label>
        `).join('')}
        
        ${question.options.some(o => o.value === 'other') ? `
          <div class="other-input-wrapper ${selectedValues.includes('other') ? 'visible' : ''}">
            <input 
              type="text" 
              class="input other-input" 
              id="q-${question.id}-other-text"
              name="q-${question.id}-other"
              placeholder="Please specify..."
              value="${otherText}"
              data-question-id="${question.id}"
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

    return `
      <div class="free-text-wrapper">
        <textarea 
          class="input textarea" 
          id="q-${question.id}-text"
          name="q-${question.id}"
          placeholder="Share your thoughts..."
          data-question-id="${question.id}"
          data-field="text"
          rows="4"
        >${text}</textarea>
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
    const value = response[field.key] || '';

    // Check showWhen conditions for conditional field visibility
    const isVisible = this.evaluateShowWhen(field, response);
    const hiddenClass = isVisible ? '' : 'hidden';

    switch (field.type) {
      case 'single_select':
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${field.key}">
            <label class="input-label">${field.label}</label>
            <div class="question-options compact">
              ${field.options.map(option => `
                <label class="radio-wrapper">
                  <input 
                    type="radio" 
                    class="radio-input" 
                    name="q-${questionId}-${field.key}" 
                    value="${option.value}"
                    ${value === option.value ? 'checked' : ''}
                    data-question-id="${questionId}"
                    data-field="${field.key}"
                  >
                  <span class="radio-custom"></span>
                  <span class="radio-label">${option.label}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;

      case 'multi_select':
        const selectedValues = Array.isArray(value) ? value : [];
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${field.key}">
            <label class="input-label">${field.label}</label>
            <div class="question-options compact">
              ${field.options.map(option => `
                <label class="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    class="checkbox-input" 
                    name="q-${questionId}-${field.key}" 
                    value="${option.value}"
                    ${selectedValues.includes(option.value) ? 'checked' : ''}
                    data-question-id="${questionId}"
                    data-field="${field.key}"
                  >
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-label">${option.label}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `;

      case 'number':
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${field.key}">
            <label class="input-label">${field.label}</label>
            <input 
              type="number" 
              class="input number-input" 
              value="${value || ''}"
              min="${field.min || 0}"
              ${field.max ? `max="${field.max}"` : ''}
              placeholder="${field.placeholder || ''}"
              data-question-id="${questionId}"
              data-field="${field.key}"
            >
          </div>
        `;

      case 'short_text':
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${field.key}">
            <label class="input-label">${field.label}</label>
            <input 
              type="text" 
              class="input" 
              value="${value}"
              placeholder="${field.placeholder || 'Type here...'}"
              data-question-id="${questionId}"
              data-field="${field.key}"
            >
          </div>
        `;

      case 'free_text':
        return `
          <div class="compound-field ${hiddenClass}" data-field-key="${field.key}">
            <label class="input-label">${field.label}</label>
            <textarea 
              class="input textarea" 
              placeholder="${field.placeholder || 'Share your thoughts...'}"
              data-question-id="${questionId}"
              data-field="${field.key}"
              rows="3"
            >${value}</textarea>
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
    if (condition.includes !== undefined && Array.isArray(targetFieldValue)) {
      return targetFieldValue.includes(condition.includes);
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
          ${examples.map(ex => `<li>${ex}</li>`).join('')}
        </ul>
      </div>
    `;
  },

  /**
   * Render a mini review card for the review page.
   */
  renderReviewCard(question, response, status = 'unanswered') {
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

    return `
      <div class="review-card ${statusClasses[status]}" data-question-id="${question.id}">
        <div class="review-card-header">
          <span class="review-card-number">Q${question.order}</span>
          <span class="review-card-status" aria-label="${status}">${statusIcons[status]}</span>
        </div>
        <div class="review-card-title">${question.title}</div>
        ${status === 'answered' ? `
          <div class="review-card-answer">${this.formatAnswer(question, response)}</div>
        ` : ''}
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
        const option = question.options.find(o => o.value === response.selected_value);
        return option ? option.label : response.selected_value || '';

      case 'multi_select':
        const labels = (response.selected_values || []).map(v => {
          const opt = question.options.find(o => o.value === v);
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
