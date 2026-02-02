 

 
 
 
export const COLORS = [
    { name: 'red', bg: 'bg-red-500', hex: '#ef4444' },
    { name: 'blue', bg: 'bg-blue-500', hex: '#3b82f6' },
    { name: 'green', bg: 'bg-green-500', hex: '#22c55e' },
    { name: 'yellow', bg: 'bg-yellow-400', hex: '#facc15' },
    { name: 'purple', bg: 'bg-purple-500', hex: '#a855f7' },
];

export const COLOR_FOCUS_CONFIG = {
    GAME_DURATION: 30,  
    SPAWN_RATE: 1000,  
    BUBBLE_SIZE_MIN: 90,
    BUBBLE_SIZE_MAX: 140,
    BUBBLE_SPEED_BASE: 0.5,
    BUBBLE_SPEED_VARIANCE: 1,
    SPEED_INCREASE_PER_ROUND: 0.2,
};

 
 
 
import { Smile, Meh, AlertCircle, Sun, Moon, Star, Bath, Bed, Book, Shirt, Backpack, Bus } from 'lucide-react';

export const EMOTION_TARGETS = [
    { id: 'smile', label: 'Smile!', icon: Smile, color: 'text-yellow-500' },
    { id: 'surprise', label: 'Look Surprised!', icon: AlertCircle, color: 'text-blue-500' },
    { id: 'neutral', label: 'Stay Neutral', icon: Meh, color: 'text-gray-500' }
];

 
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
    HOLD_TIME_REQUIRED: 2000,  
};

 
 
 
 
import { Sparkles, Utensils, Droplets, Smile as SmileIcon, Hand } from 'lucide-react';

export const ROUTINES = [
    {
        id: 'brushing',
        title: '🦷 Brushing Teeth',
        emoji: '🦷',
        steps: [
            { id: 'r1-s1', emoji: '🪥', image: '/images/routines/brush_paste.png', label: 'Apply Paste', color: 'bg-blue-200', iconName: 'Hand' },
            { id: 'r1-s2', emoji: '😁', image: '/images/routines/brush_brush.png', label: 'Brush Teeth', color: 'bg-blue-400', iconName: 'Smile' },
            { id: 'r1-s3', emoji: '🚿', image: '/images/routines/brush_rinse.png', label: 'Rinse Mouth', color: 'bg-blue-500', iconName: 'Droplets' },
        ]
    },
    {
        id: 'eating',
        title: '🍳 Eating Breakfast',
        emoji: '🍳',
        steps: [
            { id: 'r2-s1', emoji: '🧼', image: '/images/routines/eat_wash.png', label: 'Wash Hands', color: 'bg-green-200', iconName: 'Droplets' },
            { id: 'r2-s2', emoji: '🍽️', image: '/images/routines/eat_eat.png', label: 'Eat Food', color: 'bg-green-400', iconName: 'Utensils' },
            { id: 'r2-s3', emoji: '✨', image: '/images/routines/eat_clean.png', label: 'Clean Up', color: 'bg-green-500', iconName: 'Sparkles' },
        ]
    },
    {
        id: 'bedtime',
        title: '🌙 Going to Bed',
        emoji: '🌙',
        steps: [
            { id: 'r3-s1', emoji: '🛁', image: '/images/routines/bed_bath.png', label: 'Take Bath', color: 'bg-purple-200', iconName: 'Bath' },
            { id: 'r3-s2', emoji: '📖', image: '/images/routines/bed_read.png', label: 'Read Book', color: 'bg-purple-400', iconName: 'Book' },
            { id: 'r3-s3', emoji: '🛏️', image: '/images/routines/bed_sleep.png', label: 'Go to Sleep', color: 'bg-purple-500', iconName: 'Bed' },
        ]
    },
    {
        id: 'school',
        title: '🎒 Going to School',
        emoji: '🎒',
        steps: [
            { id: 'r4-s1', emoji: '👕', image: '/images/routines/school_dress.png', label: 'Get Dressed', color: 'bg-orange-300', iconName: 'Shirt' },
            { id: 'r4-s2', emoji: '🎒', image: '/images/routines/school_backpack.png', label: 'Grab Backpack', color: 'bg-orange-400', iconName: 'Backpack' },
            { id: 'r4-s3', emoji: '🚌', image: '/images/routines/school_bus.png', label: 'Catch Bus', color: 'bg-orange-500', iconName: 'Bus' },
        ]
    },
];

 
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

 
 
 
export const OBJECTS = [
    { id: 'apple', label: 'Apple', image: '/images/apple.png' },
    { id: 'banana', label: 'Banana', image: '/images/banana.png' },
    { id: 'cat', label: 'Cat', image: '/images/cat.png' },
    { id: 'dog', label: 'Dog', image: '/images/dog.png' },
    { id: 'car', label: 'Car', image: '/images/car.png' },
];

export const OBJECT_ID_CONFIG = {
    MAX_ROUNDS: 5,
    OPTIONS_COUNT: 5,  
};

 
 
 
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
    GAME_DURATION: 75000,  
    TOY_COUNT: 6,  
    TOY_SIZE_MIN: 80,
    TOY_SIZE_MAX: 120,
    MOVEMENT_SPEED: 0.5,  
    BOUNCE_AMPLITUDE: 20,  
};

 
 
 
export const SHAPE_SWITCH_SHAPES = [
    { id: 'circle', name: 'Circle', color: '#ef4444' },
    { id: 'square', name: 'Square', color: '#3b82f6' },
    { id: 'triangle', name: 'Triangle', color: '#22c55e' },
];

export const SHAPE_SWITCH_CONFIG = {
    TAPS_BEFORE_SWITCH: 3,  
    TOTAL_SWITCHES: 2,  
    GLOW_PULSE_SPEED: 1000,  
    REWARD_DURATION: 500,  
};

 
 
 
export const ATTENTION_CALL_CONFIG = {
    MAX_CALLS: 5,                     
    INITIAL_DELAY: 2000,              
    BETWEEN_CALLS_DELAY: 2500,        
    RESPONSE_WINDOW: 3500,            
    FALLBACK_GREETING: "friend",      
    SPEECH_PITCH: 1.5,                
    SPEECH_RATE: 0.75,                
    SPEECH_VOLUME: 0.85,              
    GAZE_THRESHOLD: 0.3,              
    MOVEMENT_THRESHOLD: 0.03,         
    GREETING_PREFIX: "Hi",            
};

 
 
 
 
 
export const ML_FEATURE_MAPPING = {
    'color-focus': {
         
        features: ['A1', 'A7'],
        thresholds: {
            lowScore: 50,       
            highErrors: 5,      
        },
    },
    'routine-sequencer': {
         
        features: ['A2'],
        thresholds: {
            highMistakes: 3,    
        },
    },
    'emotion-mirror': {
         
        features: ['A5', 'A6'],
        thresholds: {
            lowScore: 40,       
        },
    },
    'object-id': {
         
        features: ['A9', 'A10'],
        thresholds: {
            highCorrect: 8,
            lowWrong: 2,
            highWrong: 5,
        },
    },
    'free-toy-tap': {
         
        features: ['A3', 'A4'],
        thresholds: {
            lowEntropy: 1.0,        
            highRepetition: 0.5,   
            lowSwitchFreq: 0.15,   
        },
    },
    'shape-switch': {
         
        features: ['A8'],
        thresholds: {
            highConfusion: 5000,    
            highPerseveration: 3,   
        },
    },
    'attention-call': {
         
        features: ['A1', 'A5'],
        thresholds: {
            lowResponseRate: 0.33,  
            highLatency: 3000,      
        },
    },
};

 
 
 
 
export const MASCOT = {
    name: 'Ellie',
    emoji: '🐘',
    waving: '🐘👋',
    celebrate: '🎉',
    thinking: '🤔',
    happy: '😊',
};

export const CELEBRATION_EMOJIS = ['🎉', '⭐', '🌟', '✨', '🎊', '🏆', '🥳'];

