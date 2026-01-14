// ./js/app/toast.js
/**
 * Toast notification module for the Ready for Us.
 * 
 * Displays temporary toast messages with icons for feedback.
 * Mixed into the main App object.
 * 
 * Usage: App.showToast('message', 'success', 3000) to show a toast.
 */

const AppToast = {
    /**
     * Show a toast notification.
     * @param {string} message - Message to display
     * @param {string} type - Type: 'info', 'success', 'skip', 'error'
     * @param {number} duration - Duration in ms (default 3000)
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            info: 'ℹ️',
            success: '✓',
            skip: '⏭',
            error: '⚠️'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Mix into App when loaded
if (typeof App !== 'undefined') {
    Object.assign(App, AppToast);
}
