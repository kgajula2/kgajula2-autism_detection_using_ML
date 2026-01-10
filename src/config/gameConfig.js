/**
 * Game Configuration - Centralized constants for all games
 * This file externalizes hardcoded values for easier tuning and maintenance.
 */

// ============================================================================
// COLOR FOCUS GAME
// ============================================================================
export const COLORS = [
    { name: 'red', bg: 'bg-red-500', hex: '#ef4444' },
    { name: 'blue', bg: 'bg-blue-500', hex: '#3b82f6' },
    { name: 'green', bg: 'bg-green-500', hex: '#22c55e' },
    { name: 'yellow', bg: 'bg-yellow-400', hex: '#facc15' },
    { name: 'purple', bg: 'bg-purple-500', hex: '#a855f7' },
];

export const COLOR_FOCUS_CONFIG = {
    GAME_DURATION: 30, // seconds
    SPAWN_RATE: 1000, // ms between spawns
    BUBBLE_SIZE_MIN: 90,
    BUBBLE_SIZE_MAX: 140,
    BUBBLE_SPEED_BASE: 0.5,
    BUBBLE_SPEED_VARIANCE: 1,
    SPEED_INCREASE_PER_ROUND: 0.2,
};

// ============================================================================
// EMOTION MIRROR GAME
// ============================================================================
import { Smile, Meh, AlertCircle, Sun, Moon, Star, Bath, Bed, Book, Shirt, Backpack, Bus } from 'lucide-react';

export const EMOTION_TARGETS = [
    { id: 'smile', label: 'Smile!', icon: Smile, color: 'text-yellow-500' },
    { id: 'surprise', label: 'Look Surprised!', icon: AlertCircle, color: 'text-blue-500' },
    { id: 'neutral', label: 'Stay Neutral', icon: Meh, color: 'text-gray-500' }
];

// Child-tuned thresholds for expression detection (relaxed by ~25-30% from adult norms)
export const EXPRESSION_THRESHOLDS = {
    surprise: {
        mouthOpen: 0.055,
        browLift: 0.035,
    },
    smile: {
        smileCurve: 0.010,
        mouthWidth: 0.32,
        cheekWidth: 0.85,
    },
    neutral: {
        mouthWidth: 0.35,
        mouthOpen: 0.04,
        smileCurve: 0.012,
    },
};

export const EMOTION_MIRROR_CONFIG = {
    MAX_ROUNDS: 5,
    HOLD_TIME_REQUIRED: 2000, // ms to hold expression
};

// ============================================================================
// ROUTINE SEQUENCER GAME
// Uses emoji GIFs from CDN for universal understanding (no text needed)
// ============================================================================
import { Sparkles, Utensils, Droplets, Smile as SmileIcon, Hand } from 'lucide-react';

export const ROUTINES = [
    {
        id: 'brushing',
        title: '🦷 Brushing Teeth',
        emoji: '🦷',
        steps: [
            { id: 'r1-s1', label: '🪥', emoji: '🪥', color: 'bg-blue-200', iconName: 'Hand', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1faa5/512.gif' },
            { id: 'r1-s2', label: '💧', emoji: '💧', color: 'bg-blue-300', iconName: 'Sparkles', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a7/512.gif' },
            { id: 'r1-s3', label: '😁', emoji: '😁', color: 'bg-blue-400', iconName: 'Smile', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f601/512.gif' },
            { id: 'r1-s4', label: '🚿', emoji: '🚿', color: 'bg-blue-500', iconName: 'Droplets', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f6bf/512.gif' },
        ]
    },
    {
        id: 'eating',
        title: '🍳 Eating Breakfast',
        emoji: '🍳',
        steps: [
            { id: 'r2-s1', label: '🧼', emoji: '🧼', color: 'bg-green-200', iconName: 'Droplets', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9fc/512.gif' },
            { id: 'r2-s2', label: '🪑', emoji: '🪑', color: 'bg-green-300', iconName: 'Hand', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fa91/512.gif' },
            { id: 'r2-s3', label: '🍽️', emoji: '🍽️', color: 'bg-green-400', iconName: 'Utensils', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f37d_fe0f/512.gif' },
            { id: 'r2-s4', label: '✨', emoji: '✨', color: 'bg-green-500', iconName: 'Sparkles', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif' },
        ]
    },
    {
        id: 'bedtime',
        title: '🌙 Going to Bed',
        emoji: '🌙',
        steps: [
            { id: 'r3-s1', label: '🛁', emoji: '🛁', color: 'bg-purple-200', iconName: 'Bath', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f6c1/512.gif' },
            { id: 'r3-s2', label: '👕', emoji: '👕', color: 'bg-purple-300', iconName: 'Shirt', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f455/512.gif' },
            { id: 'r3-s3', label: '📖', emoji: '📖', color: 'bg-purple-400', iconName: 'Book', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4d6/512.gif' },
            { id: 'r3-s4', label: '🛏️', emoji: '🛏️', color: 'bg-purple-500', iconName: 'Bed', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f6cf_fe0f/512.gif' },
        ]
    },
    {
        id: 'school',
        title: '🎒 Going to School',
        emoji: '🎒',
        steps: [
            { id: 'r4-s1', label: '🌅', emoji: '🌅', color: 'bg-orange-200', iconName: 'Sun', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f305/512.gif' },
            { id: 'r4-s2', label: '👕', emoji: '👕', color: 'bg-orange-300', iconName: 'Shirt', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f455/512.gif' },
            { id: 'r4-s3', label: '🎒', emoji: '🎒', color: 'bg-orange-400', iconName: 'Backpack', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f392/512.gif' },
            { id: 'r4-s4', label: '🚌', emoji: '🚌', color: 'bg-orange-500', iconName: 'Bus', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f68c/512.gif' },
        ]
    },
    {
        id: 'handwash',
        title: '🧴 Washing Hands',
        emoji: '🧴',
        steps: [
            { id: 'r5-s1', label: '💧', emoji: '💧', color: 'bg-cyan-200', iconName: 'Droplets', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a7/512.gif' },
            { id: 'r5-s2', label: '🧼', emoji: '🧼', color: 'bg-cyan-300', iconName: 'Sparkles', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9fc/512.gif' },
            { id: 'r5-s3', label: '👏', emoji: '👏', color: 'bg-cyan-400', iconName: 'Hand', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif' },
            { id: 'r5-s4', label: '🧻', emoji: '🧻', color: 'bg-cyan-500', iconName: 'Sparkles', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9fb/512.gif' },
        ]
    },
    {
        id: 'playtime',
        title: '🎮 Playtime',
        emoji: '🎮',
        steps: [
            { id: 'r6-s1', label: '📺', emoji: '📺', color: 'bg-pink-200', iconName: 'Star', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4fa/512.gif' },
            { id: 'r6-s2', label: '🧸', emoji: '🧸', color: 'bg-pink-300', iconName: 'Smile', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9f8/512.gif' },
            { id: 'r6-s3', label: '🎨', emoji: '🎨', color: 'bg-pink-400', iconName: 'Sparkles', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3a8/512.gif' },
            { id: 'r6-s4', label: '🧹', emoji: '🧹', color: 'bg-pink-500', iconName: 'Hand', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9f9/512.gif' },
        ]
    },
    {
        id: 'snacktime',
        title: '🍎 Snack Time',
        emoji: '🍎',
        steps: [
            { id: 'r7-s1', label: '🧼', emoji: '🧼', color: 'bg-red-200', iconName: 'Droplets', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9fc/512.gif' },
            { id: 'r7-s2', label: '🍎', emoji: '🍎', color: 'bg-red-300', iconName: 'Utensils', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f34e/512.gif' },
            { id: 'r7-s3', label: '🥛', emoji: '🥛', color: 'bg-red-400', iconName: 'Sparkles', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f95b/512.gif' },
            { id: 'r7-s4', label: '✨', emoji: '✨', color: 'bg-red-500', iconName: 'Hand', gif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif' },
        ]
    }
];

// Icon resolver (since we can't store JSX in config)
export const ROUTINE_ICONS = {
    Hand: Hand,
    Sparkles: Sparkles,
    Smile: SmileIcon,
    Droplets: Droplets,
    Utensils: Utensils,
    Bath: Bath,
    Bed: Bed,
    Book: Book,
    Shirt: Shirt,
    Backpack: Backpack,
    Bus: Bus,
    Sun: Sun,
    Moon: Moon,
    Star: Star,
};

// ============================================================================
// OBJECT ID GAME
// ============================================================================
export const OBJECTS = [
    { id: 'apple', label: 'Apple', image: '/images/apple.png' },
    { id: 'banana', label: 'Banana', image: '/images/banana.png' },
    { id: 'cat', label: 'Cat', image: '/images/cat.png' },
    { id: 'dog', label: 'Dog', image: '/images/dog.png' },
    { id: 'car', label: 'Car', image: '/images/car.png' },
];

export const OBJECT_ID_CONFIG = {
    MAX_ROUNDS: 5,
    OPTIONS_COUNT: 5, // Total options shown per round (including correct one)
};

// ============================================================================
// ML FEATURE MAPPING
// Game metrics -> AQ-10 style behavioral features
// This mapping is used by ml.js to convert game performance into model inputs
// ============================================================================
export const ML_FEATURE_MAPPING = {
    'color-focus': {
        // Attention & Impulse Control
        features: ['A1', 'A7'],
        thresholds: {
            lowScore: 50,      // Below this -> attention issues (A1)
            highErrors: 5,     // Above this -> impulse issues (A7)
        },
    },
    'routine-sequencer': {
        // Planning & Structure
        features: ['A2'],
        thresholds: {
            highMistakes: 3,   // Above this -> sequencing difficulty (A2)
        },
    },
    'emotion-mirror': {
        // Social/Emotional Recognition
        features: ['A5', 'A6'],
        thresholds: {
            lowScore: 40,      // Below this -> social recognition issues
        },
    },
    'object-id': {
        // Visual Discrimination
        features: ['A9', 'A10'],
        thresholds: {
            highCorrect: 8,
            lowWrong: 2,
            highWrong: 5,
        },
    },
};

// ============================================================================
// KID-FRIENDLY MASCOT & UI ELEMENTS
// ============================================================================
export const MASCOT = {
    name: 'Ellie',
    character: '🐘',
    wavingGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f418/512.gif',
    celebrateGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif',
    thinkingGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif',
    happyGif: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60a/512.gif',
};

export const CELEBRATION_EMOJIS = ['🎉', '⭐', '🌟', '✨', '🎊', '🏆', '🥳'];
