 

class ErrorLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;

         
        if (typeof window !== 'undefined') {
            window.errorLogger = this;
        }
    }

     
    log(errorData) {
        const entry = {
            id: crypto.randomUUID?.() || Date.now().toString(),
            timestamp: new Date().toISOString(),
            userAgent: navigator?.userAgent || 'unknown',
            url: window?.location?.href || 'unknown',
            ...errorData,
        };

        this.logs.push(entry);

         
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

         
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Logger');
            console.error(entry);
            console.groupEnd();
        }

         
        this.persist();

        return entry;
    }

     
    error(message, details = {}) {
        return this.log({
            type: 'ERROR',
            message,
            ...details,
        });
    }

     
    warn(message, details = {}) {
        return this.log({
            type: 'WARNING',
            message,
            ...details,
        });
    }

     
    gameError(gameName, error, context = {}) {
        return this.log({
            type: 'GAME_ERROR',
            game: gameName,
            error: error?.message || String(error),
            stack: error?.stack,
            ...context,
        });
    }

     
    apiError(endpoint, error, context = {}) {
        return this.log({
            type: 'API_ERROR',
            endpoint,
            error: error?.message || String(error),
            status: error?.status,
            ...context,
        });
    }

     
    getLogs() {
        return [...this.logs];
    }

     
    getLogsByType(type) {
        return this.logs.filter(log => log.type === type);
    }

     
    clear() {
        this.logs = [];
        this.persist();
    }

     
    persist() {
        try {
            localStorage.setItem('neurostep_error_logs', JSON.stringify(this.logs));
        } catch (e) {
             
        }
    }

     
    load() {
        try {
            const stored = localStorage.getItem('neurostep_error_logs');
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (e) {
             
        }
    }

     
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

 
const errorLogger = new ErrorLogger();
errorLogger.load();

export default errorLogger;
export { ErrorLogger };
