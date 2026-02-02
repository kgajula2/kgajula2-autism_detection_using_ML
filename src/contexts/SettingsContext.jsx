import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const defaultSettings = {
     
    darkMode: false,

     
    soundEnabled: true,
    musicEnabled: false,

     
    fontSize: 'medium',  
    highContrast: false,
    reducedMotion: false,

     
    language: 'en',

     
    difficulty: 'medium',  
    showHints: true,
    toddlerMode: true,  

     
    dailyReminder: false,

     
    shareData: false,
};

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('neurostep_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

     
    useEffect(() => {
        localStorage.setItem('neurostep_settings', JSON.stringify(settings));
    }, [settings]);

     
    useEffect(() => {
        document.documentElement.classList.toggle('dark', settings.darkMode);
    }, [settings.darkMode]);

     
    useEffect(() => {
        const sizes = { small: '14px', medium: '16px', large: '18px' };
        document.documentElement.style.fontSize = sizes[settings.fontSize] || '16px';
    }, [settings.fontSize]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, toggleSetting, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
}

export default SettingsContext;
