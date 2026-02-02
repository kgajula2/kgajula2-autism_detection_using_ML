import { useSettings } from '../contexts/SettingsContext';

 
export function useToddlerMode() {
    const { settings, toggleSetting } = useSettings();
    const isEnabled = settings.toddlerMode ?? true;

     
    const config = {
         
        routineSteps: isEnabled ? 3 : 5,
        bubbleSize: isEnabled ? 60 : 40,
        holdTimeRequired: isEnabled ? 1500 : 2000,

         
        showTextLabels: !isEnabled,
        showTutorials: isEnabled,
        largeEmojis: isEnabled,

         
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
