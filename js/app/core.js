// ./js/app/core.js
/**
 * Core App object for the Ready for Us.
 * 
 * Defines the base App object with all state properties.
 * This module MUST be loaded first, before any other js/app/ modules.
 * Other modules extend this object using Object.assign(App, {...}).
 * 
 * Usage: Load this script first in index.html, then all other modules.
 */

const App = {
    // ==================== STATE ====================
    // Views cache
    views: {
        dashboard: null,
        welcome: null,
        questionnaire: null,
        review: null,
        complete: null,
        comparison: null
    },
    currentView: 'dashboard',
    participantName: '',

    // Bookmarks (question IDs)
    bookmarkedQuestions: [],

    // Import review tracking
    importNeedsReview: [],
    importWarnings: {},

    // Import modal state (used by import-modal.js)
    importedFiles: {
        a: null,
        b: null,
        continue: null
    },
    importMode: 'continue',

    // Initialization guard
    _initialized: false
};
