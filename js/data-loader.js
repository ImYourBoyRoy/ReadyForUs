// ./js/data-loader.js
/**
 * Data loader module for the Slow Build Check-In questionnaire.
 * 
 * Fetches and parses questionnaire JSON files, providing dynamic question counts
 * and structured access to questions, sections, and manifests.
 * Supports multi-phase architecture with dynamic data paths.
 * 
 * Usage: Import and call DataLoader.loadPhases() then DataLoader.load() to initialize.
 */

const DataLoader = {
  config: null,
  data: null,
  manifest: null,
  prompts: null,
  phases: null,
  currentPhase: null,

  // Cache version for cache busting
  CACHE_VERSION: '2.3.3',

  /**
   * Load site-wide configuration.
   * @returns {Promise<Object>} The site configuration.
   */
  async loadConfig() {
    try {
      const res = await fetch(`./data/config.json?v=${this.CACHE_VERSION}`);
      if (!res.ok) {
        throw new Error('Failed to load site configuration');
      }
      this.config = await res.json();
      return this.config;
    } catch (error) {
      console.error('DataLoader config error:', error);
      // Use fallback defaults if config fails to load
      this.config = {
        site: { name: 'Ready for Us', icon: '💜' },
        dashboard: { title: 'Ready for Us', icon: '💜' },
        navigation: { title: 'Ready for Us', logo: '💜' }
      };
      return this.config;
    }
  },

  /**
   * Get site-wide configuration.
   * @returns {Object} Site configuration object.
   */
  getConfig() {
    return this.config || {};
  },

  /**
   * Get dashboard-specific configuration.
   * @returns {Object} Dashboard configuration.
   */
  getDashboardConfig() {
    return this.config?.dashboard || {};
  },

  /**
   * Get navigation configuration.
   * @returns {Object} Navigation configuration.
   */
  getNavigationConfig() {
    return this.config?.navigation || {};
  },


  /**
   * Load the phases manifest.
   * @returns {Promise<Object>} The phases manifest.
   */
  async loadPhases() {
    try {
      const res = await fetch(`./data/phases.json?v=${this.CACHE_VERSION}`);
      if (!res.ok) {
        throw new Error('Failed to load phases manifest');
      }
      this.phases = await res.json();
      return this.phases;
    } catch (error) {
      console.error('DataLoader phases error:', error);
      throw error;
    }
  },

  /**
   * Get available phases.
   * @returns {Array} Array of phase objects.
   */
  getPhases() {
    return this.phases?.phases || [];
  },

  /**
   * Get the default phase ID.
   * @returns {string} Default phase ID.
   */
  getDefaultPhaseId() {
    return this.phases?.default_phase || 'phase_1';
  },

  /**
   * Set the current phase by ID.
   * @param {string} phaseId - Phase ID to set as current.
   */
  setCurrentPhase(phaseId) {
    const phase = this.phases?.phases?.find(p => p.id === phaseId);
    if (phase) {
      this.currentPhase = phase;
    } else {
      console.warn(`Phase ${phaseId} not found, using default`);
      this.currentPhase = this.phases?.phases?.[0] || null;
    }
  },

  /**
   * Get the current phase.
   * @returns {Object|null} Current phase object.
   */
  getCurrentPhase() {
    return this.currentPhase;
  },

  /**
   * Get the current phase ID.
   * @returns {string|null} Current phase ID string.
   */
  getCurrentPhaseId() {
    return this.currentPhase?.id || null;
  },

  /**
   * Load all questionnaire data from JSON files for current phase.
   * @returns {Promise<Object>} The loaded questionnaire data.
   */
  async load() {
    try {
      const basePath = this.currentPhase?.data_path || 'data';
      const [manifestRes, questionsRes, promptsRes] = await Promise.all([
        fetch(`./${basePath}/manifest.json?v=${this.CACHE_VERSION}`),
        fetch(`./${basePath}/questions.json?v=${this.CACHE_VERSION}`),
        fetch(`./${basePath}/prompts.json?v=${this.CACHE_VERSION}`)
      ]);

      if (!manifestRes.ok || !questionsRes.ok || !promptsRes.ok) {
        throw new Error('Failed to load questionnaire data');
      }

      this.manifest = await manifestRes.json();
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
   * @returns {Object} Artifact metadata from manifest.json.
   */
  getArtifact() {
    return this.manifest?.artifact || {};
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
   * @returns {Object} Intro data from manifest.json.
   */
  getIntro() {
    return this.manifest?.intro || {};
  },

  /**
   * Get privacy preface for AI prompts.
   * @returns {Object} Privacy preface from manifest.json.
   */
  getPrivacyPreface() {
    return this.manifest?.privacy_preface || {};
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
