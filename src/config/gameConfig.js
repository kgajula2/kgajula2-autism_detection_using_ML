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
import { Smile, Meh, AlertCircle } from 'lucide-react';

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
// ============================================================================
import { Sparkles, Utensils, Droplets, Smile as SmileIcon, Hand } from 'lucide-react';

export const ROUTINES = [
    {
        id: 'brushing',
        title: 'Brushing Teeth',
        steps: [
            { id: 'r1-s1', label: 'Get Toothbrush', color: 'bg-blue-200', iconName: 'Hand' },
            { id: 'r1-s2', label: 'Add Toothpaste', color: 'bg-blue-300', iconName: 'Sparkles' },
            { id: 'r1-s3', label: 'Brush Teeth', color: 'bg-blue-400', iconName: 'Smile' },
            { id: 'r1-s4', label: 'Rinse Mouth', color: 'bg-blue-500', iconName: 'Droplets' },
        ]
    },
    {
        id: 'eating',
        title: 'Eating Breakfast',
        steps: [
            { id: 'r2-s1', label: 'Wash Hands', color: 'bg-green-200', iconName: 'Droplets' },
            { id: 'r2-s2', label: 'Sit at Table', color: 'bg-green-300', iconName: 'Hand' },
            { id: 'r2-s3', label: 'Eat Food', color: 'bg-green-400', iconName: 'Utensils' },
            { id: 'r2-s4', label: 'Clean Dishes', color: 'bg-green-500', iconName: 'Sparkles' },
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
