 

 
export const VOICE_PRESETS = {
     
    GENTLE: {
        pitch: 1.7,
        rate: 0.8,
        description: 'Calm, supportive, non-overstimulating'
    },
     
    HAPPY: {
        pitch: 2.0,
        rate: 0.9,
        description: 'Cheerful, celebratory moments'
    },
     
    INSTRUCTION: {
        pitch: 1.8,
        rate: 0.85,
        description: 'Clear game instructions'
    },
     
    SQUEAKY: {
        pitch: 2.2,
        rate: 1.0,
        description: 'Fun, attention-grabbing'
    },
     
    ATTENTION: {
        pitch: 2.0,
        rate: 0.75,
        description: 'Calling child\'s attention gently'
    },
     
    ROBOT: {
        pitch: 1.0,
        rate: 0.85,
        description: 'Fun robotic feedback'
    }
};

 
let cachedVoices = [];

 
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        cachedVoices = window.speechSynthesis.getVoices();
    };
     
    cachedVoices = window.speechSynthesis.getVoices();
}

 
function getBestVoice() {
    const voices = cachedVoices.length > 0
        ? cachedVoices
        : window.speechSynthesis.getVoices();

     
    return (
         
        voices.find(v => v.lang === "en-IN" && /female/i.test(v.name)) ||
        voices.find(v => v.lang === "en-IN") ||
        voices.find(v => v.name.includes('Microsoft Heera')) ||   
        voices.find(v => v.name.includes('Heera')) ||
        voices.find(v => v.name.includes('Aditi')) ||             
        voices.find(v => v.name.includes('Raveena')) ||           
         
        voices.find(v => v.lang === "en-US" && /female|child|young/i.test(v.name)) ||
        voices.find(v => v.lang === "en-GB" && /female/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith("en") && /female/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0]
    );
}

 
export function speakCartoon(text, options = {}) {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

         
        utterance.pitch = options.pitch ?? 1.6;    
        utterance.rate = options.rate ?? 0.9;      
        utterance.volume = options.volume ?? 1;

         
        utterance.voice = getBestVoice();

         
        utterance.onend = resolve;
        utterance.onerror = resolve;

         
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    });
}

 
export function speakWithPreset(text, presetName = 'GENTLE') {
    const preset = VOICE_PRESETS[presetName] || VOICE_PRESETS.GENTLE;
    return speakCartoon(text, preset);
}

 
 
 

 
export function attentionCall(childName) {
    return speakCartoon(`Hi ${childName}! Look here!`, VOICE_PRESETS.ATTENTION);
}

 
export function celebrationVoice(message = "Great job!") {
    return speakCartoon(message, VOICE_PRESETS.HAPPY);
}

 
export function gentleEncouragement(message = "You're doing great!") {
    return speakCartoon(message, VOICE_PRESETS.GENTLE);
}

 
export function gameInstruction(message) {
    return speakCartoon(message, VOICE_PRESETS.INSTRUCTION);
}

 
export function stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

 
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
