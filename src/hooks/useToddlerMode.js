import { useSettings } from '../contexts/SettingsContext';

/**
 * Custom hook for toddler mode (3-5 year old) settings.
 * Provides easy access to child-friendly configuration.
 * 
 * @returns {Object} Toddler mode state and configuration
 */
export function useToddlerMode() {
    const { settings, toggleSetting } = useSettings();
    const isEnabled = settings.toddlerMode ?? true;

    // Toddler mode specific configurations
    const config = {
        // Game difficulty
        routineSteps: isEnabled ? 3 : 5,
        bubbleSize: isEnabled ? 60 : 40,
        holdTimeRequired: isEnabled ? 1500 : 2000,

        // UI settings
        showTextLabels: !isEnabled,
        showTutorials: isEnabled,
        largeEmojis: isEnabled,

        // Timing
        feedbackDuration: isEnabled ? 800 : 500,
        transitionSpeed: isEnabled ? 'slow' : 'normal',
    };

    const toggle = () => toggleSetting('toddlerMode');

    return {
        isEnabled,
        config,
        toggle,
    };
}

export default useToddlerMode;
