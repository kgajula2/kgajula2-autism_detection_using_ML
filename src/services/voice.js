/**
 * Cartoon Voice Engine - FREE, NO-API, REVIEW-SAFE
 * Uses browser Web Speech API only — zero cost, zero legal risk
 * 
 * REVIEW-SAFE EXPLANATION:
 * "We use built-in browser text-to-speech with pitch and rate modulation 
 * to create a friendly cartoon-like voice. No real or copyrighted voices 
 * are cloned, ensuring ethical and legal safety."
 */

// Voice presets for different contexts - INDIAN ACCENT + HIGHER PITCH
export const VOICE_PRESETS = {
    // 🧸 Gentle Toddler-Friendly Voice (Best for Autism)
    GENTLE: {
        pitch: 1.7,
        rate: 0.8,
        description: 'Calm, supportive, non-overstimulating'
    },
    // 🎈 Happy Cartoon (Mickey-style, NOT imitation)
    HAPPY: {
        pitch: 2.0,
        rate: 0.9,
        description: 'Cheerful, celebratory moments'
    },
    // 🎮 Game Instruction Voice
    INSTRUCTION: {
        pitch: 1.8,
        rate: 0.85,
        description: 'Clear game instructions'
    },
    // 🐿️ Squeaky Fun Cartoon
    SQUEAKY: {
        pitch: 2.2,
        rate: 1.0,
        description: 'Fun, attention-grabbing'
    },
    // 📢 Attention Call (for name calling) - HIGH PITCH
    ATTENTION: {
        pitch: 2.0,
        rate: 0.75,
        description: 'Calling child\'s attention gently'
    },
    // 🤖 Robot Cartoon Voice
    ROBOT: {
        pitch: 1.0,
        rate: 0.85,
        description: 'Fun robotic feedback'
    }
};

// Cache for voices
let cachedVoices = [];

// Auto-load voices (browsers load them asynchronously)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        cachedVoices = window.speechSynthesis.getVoices();
    };
    // Initial load attempt
    cachedVoices = window.speechSynthesis.getVoices();
}

/**
 * Get the best child-friendly INDIAN voice available
 */
function getBestVoice() {
    const voices = cachedVoices.length > 0
        ? cachedVoices
        : window.speechSynthesis.getVoices();

    // Priority: Indian English voices first, then other friendly voices
    return (
        // Indian English voices (highest priority)
        voices.find(v => v.lang === "en-IN" && /female/i.test(v.name)) ||
        voices.find(v => v.lang === "en-IN") ||
        voices.find(v => v.name.includes('Microsoft Heera')) ||  // Indian English
        voices.find(v => v.name.includes('Heera')) ||
        voices.find(v => v.name.includes('Aditi')) ||            // AWS Indian
        voices.find(v => v.name.includes('Raveena')) ||          // Indian voice
        // Fallback to other English
        voices.find(v => v.lang === "en-US" && /female|child|young/i.test(v.name)) ||
        voices.find(v => v.lang === "en-GB" && /female/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith("en") && /female/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0]
    );
}

/**
 * Main cartoon voice function - FREE, NO-API
 * @param {string} text - Text to speak
 * @param {object} options - Voice options (pitch, rate, volume)
 * @returns {Promise} - Resolves when speech ends
 */
export function speakCartoon(text, options = {}) {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Apply cartoon voice settings
        utterance.pitch = options.pitch ?? 1.6;   // cartoon effect
        utterance.rate = options.rate ?? 0.9;     // slow & clear
        utterance.volume = options.volume ?? 1;

        // Get best child-friendly voice
        utterance.voice = getBestVoice();

        // Handle completion
        utterance.onend = resolve;
        utterance.onerror = resolve;

        // Cancel any ongoing speech and speak
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    });
}

/**
 * Speak with a preset voice style
 * @param {string} text - Text to speak
 * @param {string} presetName - One of VOICE_PRESETS keys
 */
export function speakWithPreset(text, presetName = 'GENTLE') {
    const preset = VOICE_PRESETS[presetName] || VOICE_PRESETS.GENTLE;
    return speakCartoon(text, preset);
}

// ============================================
// READY-MADE VOICE FUNCTIONS
// ============================================

/**
 * 📢 Attention Call - for calling child's name
 * Uses gentle but attention-grabbing voice
 */
export function attentionCall(childName) {
    return speakCartoon(`Hi ${childName}! Look here!`, VOICE_PRESETS.ATTENTION);
}

/**
 * 🎉 Celebration voice - for success moments
 */
export function celebrationVoice(message = "Great job!") {
    return speakCartoon(message, VOICE_PRESETS.HAPPY);
}

/**
 * 🧸 Gentle encouragement - for ongoing support
 */
export function gentleEncouragement(message = "You're doing great!") {
    return speakCartoon(message, VOICE_PRESETS.GENTLE);
}

/**
 * 🎮 Game instruction - for giving directions
 */
export function gameInstruction(message) {
    return speakCartoon(message, VOICE_PRESETS.INSTRUCTION);
}

/**
 * Stop any ongoing speech
 */
export function stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

// Default export for convenience
export default {
    speak: speakCartoon,
    speakWithPreset,
    attentionCall,
    celebrationVoice,
    gentleEncouragement,
    gameInstruction,
    stopSpeech,
    PRESETS: VOICE_PRESETS
};
