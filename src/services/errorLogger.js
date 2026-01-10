/**
 * Centralized Error Logger Service
 * Provides consistent error logging across the application.
 */

class ErrorLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;

        // Attach to window for global access
        if (typeof window !== 'undefined') {
            window.errorLogger = this;
        }
    }

    /**
     * Log an error
     * @param {Object} errorData - Error information
     */
    log(errorData) {
        const entry = {
            id: crypto.randomUUID?.() || Date.now().toString(),
            timestamp: new Date().toISOString(),
            userAgent: navigator?.userAgent || 'unknown',
            url: window?.location?.href || 'unknown',
            ...errorData,
        };

        this.logs.push(entry);

        // Keep logs under limit
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Console log in development
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Logger');
            console.error(entry);
            console.groupEnd();
        }

        // Store in localStorage for persistence
        this.persist();

        return entry;
    }

    /**
     * Log a general error
     */
    error(message, details = {}) {
        return this.log({
            type: 'ERROR',
            message,
            ...details,
        });
    }

    /**
     * Log a warning
     */
    warn(message, details = {}) {
        return this.log({
            type: 'WARNING',
            message,
            ...details,
        });
    }

    /**
     * Log game-specific error
     */
    gameError(gameName, error, context = {}) {
        return this.log({
            type: 'GAME_ERROR',
            game: gameName,
            error: error?.message || String(error),
            stack: error?.stack,
            ...context,
        });
    }

    /**
     * Log API/network error
     */
    apiError(endpoint, error, context = {}) {
        return this.log({
            type: 'API_ERROR',
            endpoint,
            error: error?.message || String(error),
            status: error?.status,
            ...context,
        });
    }

    /**
     * Get all logged errors
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Get logs by type
     */
    getLogsByType(type) {
        return this.logs.filter(log => log.type === type);
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        this.persist();
    }

    /**
     * Persist logs to localStorage
     */
    persist() {
        try {
            localStorage.setItem('neurostep_error_logs', JSON.stringify(this.logs));
        } catch (e) {
            // Storage full or unavailable
        }
    }

    /**
     * Load logs from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem('neurostep_error_logs');
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (e) {
            // Parse error
        }
    }

    /**
     * Export logs as JSON file
     */
    export() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neurostep-errors-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Create singleton instance
const errorLogger = new ErrorLogger();
errorLogger.load();

export default errorLogger;
export { ErrorLogger };
