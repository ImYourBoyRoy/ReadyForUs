// ./js/app/accessibility.js
/**
 * Accessibility module for the Ready for Us.
 * 
 * Provides screen reader announcements via ARIA live regions.
 * Mixed into the main App object.
 * 
 * Usage: App.announce('message') to announce to screen readers.
 */

const AppAccessibility = {
    /**
     * Announce a message for screen readers.
     * @param {string} message - Message to announce
     */
    announce(message) {
        const region = document.getElementById('sr-announcements');
        if (region) {
            region.textContent = message;
            // Clear after announcement is read
            setTimeout(() => {
                region.textContent = '';
            }, 1000);
        }
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppAccessibility);
}
