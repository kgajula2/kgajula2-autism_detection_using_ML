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
// Uses native emojis (universally supported, no loading required)
// ============================================================================
import { Sparkles, Utensils, Droplets, Smile as SmileIcon, Hand } from 'lucide-react';

export const ROUTINES = [
    {
        id: 'brushing',
        title: '🦷 Brushing Teeth',
        emoji: '🦷',
        steps: [
            { id: 'r1-s1', emoji: '🪥', color: 'bg-blue-200', iconName: 'Hand' },
            { id: 'r1-s2', emoji: '😁', color: 'bg-blue-400', iconName: 'Smile' },
            { id: 'r1-s3', emoji: '🚿', color: 'bg-blue-500', iconName: 'Droplets' },
        ]
    },
    {
        id: 'eating',
        title: '🍳 Eating Breakfast',
        emoji: '🍳',
        steps: [
            { id: 'r2-s1', emoji: '🧼', color: 'bg-green-200', iconName: 'Droplets' },
            { id: 'r2-s2', emoji: '🍽️', color: 'bg-green-400', iconName: 'Utensils' },
            { id: 'r2-s3', emoji: '✨', color: 'bg-green-500', iconName: 'Sparkles' },
        ]
    },
    {
        id: 'bedtime',
        title: '🌙 Going to Bed',
        emoji: '🌙',
        steps: [
            { id: 'r3-s1', emoji: '🛁', color: 'bg-purple-200', iconName: 'Bath' },
            { id: 'r3-s2', emoji: '📖', color: 'bg-purple-400', iconName: 'Book' },
            { id: 'r3-s3', emoji: '🛏️', color: 'bg-purple-500', iconName: 'Bed' },
        ]
    },
    {
        id: 'school',
        title: '🎒 Going to School',
        emoji: '🎒',
        steps: [
            { id: 'r4-s1', emoji: '👕', color: 'bg-orange-300', iconName: 'Shirt' },
            { id: 'r4-s2', emoji: '🎒', color: 'bg-orange-400', iconName: 'Backpack' },
            { id: 'r4-s3', emoji: '🚌', color: 'bg-orange-500', iconName: 'Bus' },
        ]
    },
    {
        id: 'handwash',
        title: '🧴 Washing Hands',
        emoji: '🧴',
        steps: [
            { id: 'r5-s1', emoji: '💧', color: 'bg-cyan-200', iconName: 'Droplets' },
            { id: 'r5-s2', emoji: '🧼', color: 'bg-cyan-300', iconName: 'Sparkles' },
            { id: 'r5-s3', emoji: '👏', color: 'bg-cyan-400', iconName: 'Hand' },
        ]
    },
    {
        id: 'playtime',
        title: '🎮 Playtime',
        emoji: '🎮',
        steps: [
            { id: 'r6-s1', emoji: '🧸', color: 'bg-pink-300', iconName: 'Smile' },
            { id: 'r6-s2', emoji: '🎨', color: 'bg-pink-400', iconName: 'Sparkles' },
            { id: 'r6-s3', emoji: '🧹', color: 'bg-pink-500', iconName: 'Hand' },
        ]
    },
    {
        id: 'snacktime',
        title: '🍎 Snack Time',
        emoji: '🍎',
        steps: [
            { id: 'r7-s1', emoji: '🧼', color: 'bg-red-200', iconName: 'Droplets' },
            { id: 'r7-s2', emoji: '🍎', color: 'bg-red-300', iconName: 'Utensils' },
            { id: 'r7-s3', emoji: '✨', color: 'bg-red-500', iconName: 'Sparkles' },
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
// FREE TOY TAP GAME (Exploration - No Goals)
// ============================================================================
export const FREE_TOY_TAP_TOYS = [
    { id: 'car', emoji: '🚗', color: '#ef4444' },
    { id: 'balloon', emoji: '🎈', color: '#f97316' },
    { id: 'star', emoji: '⭐', color: '#eab308' },
    { id: 'bear', emoji: '🐻', color: '#84cc16' },
    { id: 'rainbow', emoji: '🌈', color: '#22c55e' },
    { id: 'bow', emoji: '🎀', color: '#ec4899' },
    { id: 'rocket', emoji: '🚀', color: '#8b5cf6' },
    { id: 'gift', emoji: '🎁', color: '#3b82f6' },
];

export const FREE_TOY_TAP_CONFIG = {
    GAME_DURATION: 75000, // 75 seconds (hidden from child)
    TOY_COUNT: 6, // Number of toys on screen
    TOY_SIZE_MIN: 80,
    TOY_SIZE_MAX: 120,
    MOVEMENT_SPEED: 0.5, // pixels per frame
    BOUNCE_AMPLITUDE: 20, // vertical bounce pixels
};

// ============================================================================
// SHAPE SWITCH GAME (Resistance to Change)
// ============================================================================
export const SHAPE_SWITCH_SHAPES = [
    { id: 'circle', name: 'Circle', color: '#ef4444' },
    { id: 'square', name: 'Square', color: '#3b82f6' },
    { id: 'triangle', name: 'Triangle', color: '#22c55e' },
];

export const SHAPE_SWITCH_CONFIG = {
    TAPS_BEFORE_SWITCH: 3, // Successful taps before rule changes (reduced from 5)
    TOTAL_SWITCHES: 2, // Number of rule changes (reduced from 3, makes 3 rounds total)
    GLOW_PULSE_SPEED: 1000, // ms for glow animation
    REWARD_DURATION: 500, // ms for sparkle effect
};

// ============================================================================
// ATTENTION CALL GAME (Name Response)
// ============================================================================
export const ATTENTION_CALL_CONFIG = {
    MAX_CALLS: 5,                    // Maximum name calls before ending
    INITIAL_DELAY: 2000,             // 2 seconds before first call
    BETWEEN_CALLS_DELAY: 2000,       // 2 seconds between calls
    RESPONSE_WINDOW: 3000,           // 3 seconds to detect response after call
    FALLBACK_GREETING: "Hey there",  // If name not available
    SPEECH_PITCH: 1.3,               // Higher pitch for child-friendly tone
    SPEECH_RATE: 0.85,               // Slightly slower for clarity
    GAZE_THRESHOLD: 0.3,             // Iris offset threshold - more lenient (was 0.15)
    MOVEMENT_THRESHOLD: 0.03,        // Head position change threshold
    GREETING_PREFIX: "Hey, hi",      // Prefix before name
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
    'free-toy-tap': {
        // Repetitive Behavior & Restricted Interests
        features: ['A3', 'A4'],
        thresholds: {
            lowEntropy: 1.0,       // Below = object fixation
            highRepetition: 0.5,  // Above = repetitive behavior
            lowSwitchFreq: 0.15,  // Below = restricted exploration
        },
    },
    'shape-switch': {
        // Resistance to Change / Cognitive Flexibility
        features: ['A8'],
        thresholds: {
            highConfusion: 5000,   // ms to adapt after switch
            highPerseveration: 3,  // wrong taps after switch
        },
    },
    'attention-call': {
        // Social Attention & Name Response
        features: ['A1', 'A5'],
        thresholds: {
            lowResponseRate: 0.33, // Less than 1/3 responses
            highLatency: 3000,     // ms to respond
        },
    },
};

// ============================================================================
// KID-FRIENDLY MASCOT & UI ELEMENTS
// Using native emojis for universal compatibility
// ============================================================================
export const MASCOT = {
    name: 'Ellie',
    emoji: '🐘',
    waving: '🐘👋',
    celebrate: '🎉',
    thinking: '🤔',
    happy: '😊',
};

export const CELEBRATION_EMOJIS = ['🎉', '⭐', '🌟', '✨', '🎊', '🏆', '🥳'];

