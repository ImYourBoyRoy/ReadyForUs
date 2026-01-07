// ./js/data-loader.js
/**
 * Data loader module for the Slow Build Check-In questionnaire.
 * 
 * Fetches and parses questionnaire JSON files, providing dynamic question counts
 * and structured access to questions, sections, and manifests.
 * 
 * Usage: Import and call DataLoader.load() to initialize.
 */

const DataLoader = {
  data: null,
  prompts: null,

  /**
   * Load all questionnaire data from JSON files.
   * @returns {Promise<Object>} The loaded questionnaire data.
   */
  async load() {
    try {
      const [questionsRes, promptsRes] = await Promise.all([
        fetch('./data/questions.json'),
        fetch('./data/prompts.json')
      ]);

      if (!questionsRes.ok || !promptsRes.ok) {
        throw new Error('Failed to load questionnaire data');
      }

      this.data = await questionsRes.json();
      this.prompts = await promptsRes.json();

      return this.data;
    } catch (error) {
      console.error('DataLoader error:', error);
      throw error;
    }
  },

  /**
   * Get the artifact metadata (title, subtitle, purpose, etc.).
   * @returns {Object} Artifact metadata.
   */
  getArtifact() {
    return this.data?.artifact || {};
  },

  /**
   * Get all sections with their questions.
   * @returns {Array} Array of section objects with questions.
   */
  getSections() {
    if (!this.data) return [];

    return this.data.sections.map(section => ({
      ...section,
      questions: section.question_ids.map(id => this.data.questions[id])
    }));
  },

  /**
   * Get questions for a specific mode (full or lite).
   * @param {string} mode - 'full' or 'lite'
   * @returns {Array} Array of question objects.
   */
  getQuestions(mode = 'full') {
    if (!this.data) return [];

    // Support new manifests structure (plural) and legacy manifest (singular)
    const manifests = this.data.manifests || {};
    const legacyManifest = this.data.manifest;

    // Get question IDs for the requested mode
    let questionIds;
    if (manifests[mode]) {
      questionIds = manifests[mode].question_ids;
    } else if (mode === 'lite' && legacyManifest) {
      questionIds = legacyManifest.question_ids;
    }

    if (questionIds) {
      return questionIds.map(id => this.data.questions[id]).filter(Boolean);
    }

    // Full mode fallback: all questions in order
    return Object.values(this.data.questions).sort((a, b) => a.order - b.order);
  },

  /**
   * Get a single question by ID.
   * @param {string} id - Question ID (e.g., 'q01')
   * @returns {Object|null} Question object or null.
   */
  getQuestion(id) {
    return this.data?.questions[id] || null;
  },

  /**
   * Get the total question count for a mode.
   * @param {string} mode - 'full' or 'lite'
   * @returns {number} Number of questions.
   */
  getQuestionCount(mode = 'full') {
    if (!this.data) return 0;

    // Support new manifests structure (plural) and legacy manifest (singular)
    const manifests = this.data.manifests || {};
    const legacyManifest = this.data.manifest;

    if (manifests[mode]) {
      return manifests[mode].question_ids.length;
    } else if (mode === 'lite' && legacyManifest) {
      return legacyManifest.question_ids.length;
    }

    return Object.keys(this.data.questions).length;
  },

  /**
   * Get the manifest data (timebox, post-activity, etc.).
   * @returns {Object} Manifest data.
   */
  getManifest(mode = 'lite') {
    const manifests = this.data?.manifests || {};
    return manifests[mode] || this.data?.manifest || {};
  },

  /**
   * Get intro instructions and keep-in-mind items.
   * @returns {Object} Intro data with instructions and keep_in_mind.
   */
  getIntro() {
    return this.data?.intro || {};
  },

  /**
   * Get UI hints for rendering.
   * @returns {Object} UI hints configuration.
   */
  getUIHints() {
    return this.data?.ui_hints || {};
  },

  /**
   * Get the section for a given question ID.
   * @param {string} questionId - Question ID.
   * @returns {Object|null} Section object or null.
   */
  getSectionForQuestion(questionId) {
    if (!this.data) return null;

    const question = this.data.questions[questionId];
    if (!question) return null;

    return this.data.sections.find(s => s.id === question.section_id) || null;
  },

  /**
   * Get AI prompt templates.
   * @param {string} type - 'individual' or 'couple'
   * @param {string} mode - 'lite' or 'full'
   * @returns {Object|null} Prompt template or null.
   */
  getPrompt(type, mode = 'lite') {
    // Construct the prompt key based on type and mode
    const promptKey = `${type}_reflection_${mode}`;
    return this.prompts?.prompts?.[promptKey] || null;
  }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataLoader;
}
