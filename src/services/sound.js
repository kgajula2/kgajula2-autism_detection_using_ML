// Sound effects service

class SoundService {
    constructor() {
        this.enabled = true;
        this.sounds = {};
        this.audioContext = null;

        // Load settings
        try {
            const settings = JSON.parse(localStorage.getItem('neurostep_settings') || '{}');
            this.enabled = settings.soundEnabled !== false;
        } catch (e) {
            console.warn('Could not load sound settings');
        }
    }

    // Generate sound using Web Audio API (no external files needed)
    generateBeep(frequency = 440, duration = 0.1, type = 'sine', volume = 0.3) {
        if (!this.enabled) return;

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }

    // Pre-defined sounds
    pop() {
        this.generateBeep(800, 0.05, 'sine', 0.2);
    }

    success() {
        this.generateBeep(523, 0.1, 'sine', 0.2);
        setTimeout(() => this.generateBeep(659, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.generateBeep(784, 0.15, 'sine', 0.2), 200);
    }

    error() {
        this.generateBeep(200, 0.15, 'sawtooth', 0.15);
    }

    click() {
        this.generateBeep(600, 0.03, 'sine', 0.1);
    }

    levelUp() {
        const notes = [523, 587, 659, 698, 784]; // C D E F G
        notes.forEach((freq, i) => {
            setTimeout(() => this.generateBeep(freq, 0.1, 'sine', 0.2), i * 80);
        });
    }

    gameOver() {
        this.generateBeep(400, 0.15, 'sine', 0.2);
        setTimeout(() => this.generateBeep(350, 0.15, 'sine', 0.2), 150);
        setTimeout(() => this.generateBeep(300, 0.3, 'sine', 0.2), 300);
    }

    achievement() {
        const notes = [523, 659, 784, 1047]; // Fanfare
        notes.forEach((freq, i) => {
            setTimeout(() => this.generateBeep(freq, 0.15, 'sine', 0.25), i * 100);
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Singleton instance
export const soundService = new SoundService();

// React hook for sounds
export function useSound() {
    return soundService;
}
