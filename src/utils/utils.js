/**
 * Utility Functions
 */

/**
 * Generate a cryptographically strong unique ID
 * Falls back to a UUID-like string if crypto.randomUUID is not available
 */
export const generateUniqueId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Format duration in seconds to mm:ss or ss format
 */
export const formatDuration = (seconds) => {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};
