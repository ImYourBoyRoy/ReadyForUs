// ./js/app/bookmarks.js
/**
 * Bookmarks module for the Ready for Us.
 * 
 * Manages bookmarking questions for later review.
 * Mixed into the main App object.
 * 
 * Usage: App.toggleBookmark('q01') to toggle bookmark on a question.
 */

const AppBookmarks = {
    /**
     * Toggle bookmark for a question.
     * @param {string} questionId - Question ID to bookmark/unbookmark
     */
    toggleBookmark(questionId) {
        const index = this.bookmarkedQuestions.indexOf(questionId);

        if (index > -1) {
            this.bookmarkedQuestions.splice(index, 1);
            this.showToast('Bookmark removed', 'info', 2000);
        } else {
            this.bookmarkedQuestions.push(questionId);
            this.showToast('Question bookmarked for later', 'success', 2000);
        }

        // Save to storage
        StorageManager.setBookmarks(this.bookmarkedQuestions);

        // Update bookmark button in current view
        this.updateBookmarkUI(questionId);
        this.updateBookmarkCount();
    },

    /**
     * Check if a question is bookmarked.
     * @param {string} questionId - Question ID
     * @returns {boolean}
     */
    isBookmarked(questionId) {
        return this.bookmarkedQuestions.includes(questionId);
    },

    /**
     * Update bookmark UI for a specific question.
     * @param {string} questionId - Question ID
     */
    updateBookmarkUI(questionId) {
        const btn = document.querySelector(`[data-bookmark-id="${questionId}"]`);
        if (btn) {
            const isBookmarked = this.isBookmarked(questionId);
            btn.classList.toggle('bookmarked', isBookmarked);
            btn.setAttribute('aria-pressed', isBookmarked);
            btn.innerHTML = isBookmarked ? '⭐' : '☆';
        }
    },

    /**
     * Update the bookmark count display.
     */
    updateBookmarkCount() {
        const countEl = document.getElementById('bookmarked-count');
        const btn = document.getElementById('btn-show-bookmarked');

        if (countEl) {
            countEl.textContent = this.bookmarkedQuestions.length;
        }

        if (btn) {
            btn.style.display = this.bookmarkedQuestions.length > 0 ? 'inline-flex' : 'none';
        }
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppBookmarks);
}
