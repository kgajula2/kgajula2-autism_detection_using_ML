/**
 * Shape Switch Game - Resistance to Change
 * 
 * This game measures cognitive flexibility and adaptation to rule changes.
 * Child taps glowing shapes for rewards. After 5 successful taps,
 * the rule silently changes (different shape glows).
 * 
 * ML Signals Captured:
 * - confusion_duration: Time to first correct tap after switch
 * - wrong_taps_after_switch: Perseveration count
 * - adaptation_speed: Rounds to adapt
 * - distress_indicators: Stopped tapping or rapid frustrated taps
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useGameSession } from '../../hooks/useGameSession';
import { SHAPE_SWITCH_SHAPES, SHAPE_SWITCH_CONFIG, CELEBRATION_EMOJIS } from '../../config/gameConfig';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { analyzeUserPerformance } from '../../services/ml';
import { fetchUserGameStats } from '../../services/db';
import { soundService } from '../../services/sound';
import GameTutorial from '../../components/game/GameTutorial';

const { TAPS_BEFORE_SWITCH, TOTAL_SWITCHES, GLOW_PULSE_SPEED, REWARD_DURATION } = SHAPE_SWITCH_CONFIG;

// Helper function for sound effects
const playSound = (type) => {
    if (type === 'success') {
        soundService.success();
    } else if (type === 'error') {
        soundService.error();
    }
};

// Shape SVG components
const ShapeCircle = ({ color, isGlowing, size = 120 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
            {isGlowing && (
                <filter id="glow-circle" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            )}
        </defs>
        <circle
            cx="50" cy="50" r="40"
            fill={color}
            filter={isGlowing ? "url(#glow-circle)" : undefined}
            stroke="white"
            strokeWidth="4"
        />
    </svg>
);

const ShapeSquare = ({ color, isGlowing, size = 120 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
            {isGlowing && (
                <filter id="glow-square" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            )}
        </defs>
        <rect
            x="15" y="15" width="70" height="70" rx="8"
            fill={color}
            filter={isGlowing ? "url(#glow-square)" : undefined}
            stroke="white"
            strokeWidth="4"
        />
    </svg>
);

const ShapeTriangle = ({ color, isGlowing, size = 120 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100">
        <defs>
            {isGlowing && (
                <filter id="glow-triangle" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            )}
        </defs>
        <polygon
            points="50,10 90,85 10,85"
            fill={color}
            filter={isGlowing ? "url(#glow-triangle)" : undefined}
            stroke="white"
            strokeWidth="4"
        />
    </svg>
);

const SHAPE_COMPONENTS = {
    circle: ShapeCircle,
    square: ShapeSquare,
    triangle: ShapeTriangle,
};

export default function ShapeSwitchGame() {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { startSession, endSession } = useGameSession();

    // Game states
    const [gameState, setGameState] = useState('TUTORIAL'); // TUTORIAL, PLAYING, FINISHED
    const [shapes, setShapes] = useState([]);
    const [targetShapeId, setTargetShapeId] = useState(null);
    const [correctTaps, setCorrectTaps] = useState(0);
    const [switchCount, setSwitchCount] = useState(0);
    const [rounds, setRounds] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [mlResult, setMlResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Tracking refs
    const startTimeRef = useRef(null);
    const switchTimeRef = useRef(null);
    const currentRoundRef = useRef({
        targetShape: null,
        taps: 0,
        correct: 0,
        switchedFrom: null,
        wrongTapsAfterSwitch: 0,
        confusionDuration: null,
        firstCorrectAfterSwitch: false,
    });

    // Initialize shapes
    const initializeGame = useCallback(() => {
        const shuffled = [...SHAPE_SWITCH_SHAPES].sort(() => Math.random() - 0.5);
        setShapes(shuffled);

        // Set first target
        const firstTarget = shuffled[0].id;
        setTargetShapeId(firstTarget);
        currentRoundRef.current = {
            targetShape: firstTarget,
            taps: 0,
            correct: 0,
            switchedFrom: null,
            wrongTapsAfterSwitch: 0,
            confusionDuration: null,
            firstCorrectAfterSwitch: false,
        };

        return shuffled;
    }, []);

    // Start game
    const handleStartGame = useCallback(async () => {
        initializeGame();
        setCorrectTaps(0);
        setSwitchCount(0);
        setRounds([]);
        startTimeRef.current = Date.now();
        switchTimeRef.current = null;

        if (user?.uid) {
            const sid = await startSession(user.uid, 'shape-switch', {
                totalSwitches: TOTAL_SWITCHES,
                tapsBeforeSwitch: TAPS_BEFORE_SWITCH,
            });
            setSessionId(sid);
        }

        setGameState('PLAYING');
    }, [initializeGame, startSession, user]);

    // Switch to new target
    const switchTarget = useCallback(() => {
        const currentRound = { ...currentRoundRef.current };
        setRounds(prev => [...prev, currentRound]);

        // Find a new target (different from current)
        const currentTarget = targetShapeId;
        const otherShapes = shapes.filter(s => s.id !== currentTarget);
        const newTarget = otherShapes[Math.floor(Math.random() * otherShapes.length)].id;

        setTargetShapeId(newTarget);
        setSwitchCount(prev => prev + 1);
        setCorrectTaps(0);
        switchTimeRef.current = Date.now();

        // Reset round tracking
        currentRoundRef.current = {
            targetShape: newTarget,
            taps: 0,
            correct: 0,
            switchedFrom: currentTarget,
            wrongTapsAfterSwitch: 0,
            confusionDuration: null,
            firstCorrectAfterSwitch: false,
        };
    }, [shapes, targetShapeId]);

    // Finish game - MUST be defined before handleShapeTap that references it
    const finishGame = useCallback(async () => {
        // Save final round
        const currentRound = { ...currentRoundRef.current };
        const allRounds = [...rounds, currentRound];

        setGameState('FINISHED');

        // Calculate stats
        const switchRounds = allRounds.filter(r => r.switchedFrom !== null);
        const avgConfusion = switchRounds.length > 0
            ? switchRounds.reduce((sum, r) => sum + (r.confusionDuration || 0), 0) / switchRounds.length
            : 0;
        const totalWrongAfterSwitch = switchRounds.reduce((sum, r) => sum + r.wrongTapsAfterSwitch, 0);

        const stats = {
            rounds: allRounds,
            avgConfusionDuration: Math.round(avgConfusion),
            totalWrongAfterSwitch,
            totalSwitches: switchCount,
            adaptationSpeed: switchRounds.filter(r => r.confusionDuration && r.confusionDuration < 3000).length,
            duration: (Date.now() - startTimeRef.current) / 1000,
        };

        // End session
        if (sessionId) {
            await endSession(sessionId, correctTaps, stats);
        }

        setShowResultModal(true);
        setIsAnalyzing(true);

        try {
            if (user?.uid) {
                const { aggregated } = await fetchUserGameStats(user.uid);
                aggregated['shape-switch'] = {
                    ...stats,
                    score: correctTaps,
                    count: (aggregated['shape-switch']?.count || 0) + 1,
                };

                const result = await analyzeUserPerformance(aggregated, {
                    age: user.age || 5,
                });
                setMlResult(result);
            }
        } catch (error) {
            console.error('ML analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [rounds, switchCount, correctTaps, sessionId, endSession, user]);

    // Handle shape tap
    const handleShapeTap = useCallback((shapeId) => {
        if (gameState !== 'PLAYING') return;

        const now = Date.now();
        const isCorrect = shapeId === targetShapeId;

        // Update round tracking
        currentRoundRef.current.taps += 1;

        if (isCorrect) {
            currentRoundRef.current.correct += 1;
            setCorrectTaps(prev => prev + 1);

            // Check if this is first correct after switch
            if (switchTimeRef.current && !currentRoundRef.current.firstCorrectAfterSwitch) {
                currentRoundRef.current.confusionDuration = now - switchTimeRef.current;
                currentRoundRef.current.firstCorrectAfterSwitch = true;
            }

            // Show reward
            setShowReward(true);
            playSound('success');
            setTimeout(() => setShowReward(false), REWARD_DURATION);

            // Check if time to switch
            if (correctTaps + 1 >= TAPS_BEFORE_SWITCH) {
                if (switchCount < TOTAL_SWITCHES) {
                    setTimeout(() => switchTarget(), 500);
                } else {
                    // Game complete
                    setTimeout(() => finishGame(), 500);
                }
            }
        } else {
            // Wrong tap
            playSound('error');

            // Track wrong taps after switch
            if (switchTimeRef.current && !currentRoundRef.current.firstCorrectAfterSwitch) {
                currentRoundRef.current.wrongTapsAfterSwitch += 1;
            }
        }
    }, [gameState, targetShapeId, correctTaps, switchCount, switchTarget]);

    // Result Modal
    const ResultModal = () => {
        if (!showResultModal) return null;

        const switchRounds = rounds.filter(r => r.switchedFrom !== null);
        const avgConfusion = switchRounds.length > 0
            ? Math.round(switchRounds.reduce((sum, r) => sum + (r.confusionDuration || 0), 0) / switchRounds.length / 1000 * 10) / 10
            : 0;

        return createPortal(
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            >
                <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                >
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">🔷</div>
                        <h2 className="text-3xl font-black text-teal-600">Great Work!</h2>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center bg-teal-50 p-3 rounded-xl">
                            <span className="font-medium text-gray-700">Shapes Matched</span>
                            <span className="text-2xl font-bold text-teal-600">{correctTaps}</span>
                        </div>
                        <div className="flex justify-between items-center bg-cyan-50 p-3 rounded-xl">
                            <span className="font-medium text-gray-700">Rule Changes</span>
                            <span className="text-2xl font-bold text-cyan-600">{switchCount}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl">
                            <span className="font-medium text-gray-700">Avg Adapt Time</span>
                            <span className="text-2xl font-bold text-blue-600">{avgConfusion}s</span>
                        </div>
                    </div>

                    {isAnalyzing && (
                        <div className="text-center text-gray-500 mb-4">
                            <div className="animate-spin inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mr-2" />
                            Analyzing flexibility...
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                setShowResultModal(false);
                                setGameState('TUTORIAL');
                                setRounds([]);
                            }}
                            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                        >
                            Play Again
                        </Button>
                        <Button
                            onClick={() => navigate('/home')}
                            variant="outline"
                            className="flex-1"
                        >
                            Back to Games
                        </Button>
                    </div>
                </motion.div>
            </motion.div>,
            document.body
        );
    };

    return (
        <div className="min-h-[80vh] flex flex-col">
            {/* Tutorial */}
            {gameState === 'TUTORIAL' && (
                <GameTutorial
                    type="tap"
                    title="🔷"
                    subtitle="Tap the glow!"
                    onComplete={handleStartGame}
                    targetElement={
                        <div className="flex gap-6">
                            <div className="w-16 h-16 rounded-full bg-red-400 opacity-50" />
                            <div className="w-16 h-16 bg-blue-400 rounded-lg ring-4 ring-yellow-400 animate-pulse" />
                            <div className="w-0 h-0 border-l-8 border-r-8 border-b-[16px] border-transparent border-b-green-400 opacity-50" />
                        </div>
                    }
                />
            )}

            {/* Game Area */}
            {gameState === 'PLAYING' && (
                <div className="flex flex-col flex-1">
                    {/* Back Button Header */}
                    <div className="flex justify-between items-center mb-4 px-4">
                        <Button
                            onClick={() => navigate('/home')}
                            variant="outline"
                            className="flex items-center gap-2 bg-white/90 hover:bg-white shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </Button>
                        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-full shadow-lg">
                            <span className="text-lg font-bold">Round {switchCount + 1} / {TOTAL_SWITCHES + 1}</span>
                        </div>
                    </div>

                    {/* Game Play Area */}
                    <div className="relative flex-1 min-h-[500px] bg-gradient-to-br from-teal-100 via-cyan-50 to-blue-100 rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-8 p-8 mx-4">

                        {/* Progress indicator */}
                        <div className="absolute top-4 left-4 right-4 flex gap-2">
                            {Array.from({ length: TAPS_BEFORE_SWITCH }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 flex-1 rounded-full transition-all ${i < correctTaps ? 'bg-teal-500' : 'bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Shapes */}
                        <div className="flex gap-8 flex-wrap justify-center">
                            {shapes.map(shape => {
                                const ShapeComponent = SHAPE_COMPONENTS[shape.id];
                                const isGlowing = shape.id === targetShapeId;

                                return (
                                    <motion.button
                                        key={shape.id}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        animate={isGlowing ? {
                                            scale: [1, 1.1, 1],
                                            transition: { repeat: Infinity, duration: 1 }
                                        } : {}}
                                        onClick={() => handleShapeTap(shape.id)}
                                        className="cursor-pointer focus:outline-none"
                                    >
                                        <ShapeComponent
                                            color={shape.color}
                                            isGlowing={isGlowing}
                                            size={140}
                                        />
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Reward effect */}
                        <AnimatePresence>
                            {showReward && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1.5, opacity: 1 }}
                                    exit={{ scale: 2, opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                    <div className="text-8xl">
                                        {CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)]}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Switch counter */}
                        <div className="absolute bottom-4 right-4 bg-white/80 px-4 py-2 rounded-full text-sm font-medium text-gray-600">
                            Round {switchCount + 1} of {TOTAL_SWITCHES + 1}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            <ResultModal />
        </div>
    );
}
