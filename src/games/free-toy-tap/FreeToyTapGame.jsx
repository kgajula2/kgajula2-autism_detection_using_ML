/**
 * Free Toy Tap Game - Exploration Game (No Goals)
 * 
 * This game captures behavioral signals without explicit objectives.
 * Child freely taps colorful moving toys while we measure:
 * - Object fixation entropy (how evenly distributed are taps)
 * - Repetition rate (consecutive taps on same toy)
 * - Switch frequency (how often child switches toys)
 * - Total engagement time
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { createGameSession, endGameSession } from '../../services/db';
import { FREE_TOY_TAP_TOYS, FREE_TOY_TAP_CONFIG, CELEBRATION_EMOJIS } from '../../config/gameConfig';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { analyzeUserPerformance } from '../../services/ml';
import { fetchUserGameStats } from '../../services/db';
import { soundService } from '../../services/sound';
import GameTutorial from '../../components/game/GameTutorial';

const { GAME_DURATION, TOY_COUNT, TOY_SIZE_MIN, TOY_SIZE_MAX, MOVEMENT_SPEED, BOUNCE_AMPLITUDE } = FREE_TOY_TAP_CONFIG;

export default function FreeToyTapGame() {
    const navigate = useNavigate();
    const { user } = useUserStore();

    // Game states
    const [gameState, setGameState] = useState('TUTORIAL'); // TUTORIAL, PLAYING, FINISHED
    const [toys, setToys] = useState([]);
    const [tapLog, setTapLog] = useState([]);
    const [sparkles, setSparkles] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [mlResult, setMlResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(Math.floor(GAME_DURATION / 1000));

    // Refs
    const gameAreaRef = useRef(null);
    const startTimeRef = useRef(null);
    const animationRef = useRef(null);
    const lastTapRef = useRef(null);
    const timerIntervalRef = useRef(null);

    // Initialize toys with random positions
    const initializeToys = useCallback(() => {
        const shuffled = [...FREE_TOY_TAP_TOYS].sort(() => Math.random() - 0.5);
        const selectedToys = shuffled.slice(0, TOY_COUNT);

        return selectedToys.map((toy, index) => ({
            ...toy,
            x: 50 + Math.random() * 200,
            y: 50 + Math.random() * 300,
            size: TOY_SIZE_MIN + Math.random() * (TOY_SIZE_MAX - TOY_SIZE_MIN),
            velocityX: (Math.random() - 0.5) * MOVEMENT_SPEED * 2,
            velocityY: (Math.random() - 0.5) * MOVEMENT_SPEED * 2,
            bounceOffset: Math.random() * Math.PI * 2,
            tapCount: 0,
            isFalling: false, // Track if toy is in falling animation
            originalY: null, // Store original Y before fall
        }));
    }, []);

    // Start the game
    const handleStartGame = useCallback(async () => {
        const newToys = initializeToys();
        setToys(newToys);
        setTapLog([]);
        setSparkles([]);
        setTimeRemaining(Math.floor(GAME_DURATION / 1000));
        startTimeRef.current = Date.now();
        lastTapRef.current = null;

        // Start Firebase session
        if (user?.uid) {
            const sid = await createGameSession(user.uid, 'free-toy-tap', {
                toyCount: TOY_COUNT,
                duration: GAME_DURATION
            });
            setSessionId(sid);
        }

        // Start countdown timer
        timerIntervalRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timerIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setGameState('PLAYING');
    }, [initializeToys, user]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        navigate('/home');
    }, [navigate]);

    // Calculate ML signals from tap log
    const calculateMLSignals = useCallback(() => {
        if (tapLog.length === 0) {
            return {
                objectFixationEntropy: 0,
                repetitionRate: 0,
                switchFrequency: 0,
                engagementTime: 0,
                totalTaps: 0,
                pauseCount: 0,
            };
        }

        // Count taps per toy
        const tapCounts = {};
        tapLog.forEach(tap => {
            tapCounts[tap.toyId] = (tapCounts[tap.toyId] || 0) + 1;
        });

        // Calculate entropy (higher = more evenly distributed)
        const totalTaps = tapLog.length;
        const probabilities = Object.values(tapCounts).map(c => c / totalTaps);
        const entropy = -probabilities.reduce((sum, p) => {
            return sum + (p > 0 ? p * Math.log2(p) : 0);
        }, 0);

        // Calculate repetition rate
        const consecutiveSame = tapLog.filter(t => t.consecutiveSame).length;
        const repetitionRate = totalTaps > 1 ? consecutiveSame / (totalTaps - 1) : 0;

        // Calculate switch frequency
        const switches = tapLog.filter((t, i) => i > 0 && t.toyId !== tapLog[i - 1].toyId).length;
        const switchFrequency = totalTaps > 1 ? switches / (totalTaps - 1) : 0;

        // Calculate engagement time (time between first and last tap excluding long pauses)
        let engagementTime = 0;
        let pauseCount = 0;
        for (let i = 1; i < tapLog.length; i++) {
            const gap = tapLog[i].timestamp - tapLog[i - 1].timestamp;
            if (gap < 5000) { // Less than 5 seconds = engaged
                engagementTime += gap;
            } else {
                pauseCount++;
            }
        }

        return {
            objectFixationEntropy: Math.round(entropy * 100) / 100,
            repetitionRate: Math.round(repetitionRate * 100) / 100,
            switchFrequency: Math.round(switchFrequency * 100) / 100,
            engagementTime: Math.round(engagementTime / 1000), // in seconds
            totalTaps,
            pauseCount,
            toyTapBreakdown: tapCounts, // Per-toy tap counts (e.g., { bear: 5, car: 3 })
        };
    }, [tapLog]);

    // Finish the game - MUST be defined before useEffect that references it
    const finishGame = useCallback(async () => {
        setGameState('FINISHED');

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }

        const durationMs = Date.now() - startTimeRef.current;
        const durationSec = durationMs / 1000; // Convert to seconds
        const signals = calculateMLSignals();
        const finalScore = signals.totalTaps;

        // End Firebase session with enhanced metrics
        if (sessionId) {
            await endGameSession(sessionId, finalScore, {
                duration: durationSec, // Duration in seconds
                // Store enhanced metrics for dashboard display
                objectFixationEntropy: signals.objectFixationEntropy,
                repetitionRate: signals.repetitionRate,
                switchFrequency: signals.switchFrequency,
                engagementTime: signals.engagementTime,
                totalTaps: signals.totalTaps,
                pauseCount: signals.pauseCount,
                toyTapBreakdown: signals.toyTapBreakdown, // Per-toy tap counts
                score: finalScore,
                tapLog: tapLog.slice(0, 100), // Store first 100 taps
            });
        }

        // Show result and run ML analysis
        setShowResultModal(true);
        setIsAnalyzing(true);

        try {
            if (user?.uid) {
                const { aggregated } = await fetchUserGameStats(user.uid);
                // Add current game data
                aggregated['free-toy-tap'] = {
                    ...signals,
                    score: signals.totalTaps,
                    count: (aggregated['free-toy-tap']?.count || 0) + 1,
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
    }, [calculateMLSignals, sessionId, tapLog, user]);

    // Animation loop for toy movement
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const animate = () => {
            const elapsed = Date.now() - startTimeRef.current;

            // Check if game should end
            if (elapsed >= GAME_DURATION) {
                finishGame();
                return;
            }

            setToys(prevToys => {
                if (!gameAreaRef.current) return prevToys;

                const bounds = gameAreaRef.current.getBoundingClientRect();
                const maxX = bounds.width - 100;
                const maxY = bounds.height - 100;

                return prevToys.map(toy => {
                    // Skip movement if toy is falling
                    if (toy.isFalling) {
                        return toy;
                    }

                    let newX = toy.x + toy.velocityX;
                    let newY = toy.y + toy.velocityY;
                    let newVelocityX = toy.velocityX;
                    let newVelocityY = toy.velocityY;

                    // Bounce off edges
                    if (newX < 20 || newX > maxX) {
                        newVelocityX = -newVelocityX;
                        newX = Math.max(20, Math.min(maxX, newX));
                    }
                    if (newY < 20 || newY > maxY) {
                        newVelocityY = -newVelocityY;
                        newY = Math.max(20, Math.min(maxY, newY));
                    }

                    // Add gentle bounce effect
                    const bounceY = Math.sin((elapsed / 1000) * 2 + toy.bounceOffset) * BOUNCE_AMPLITUDE;

                    return {
                        ...toy,
                        x: newX,
                        y: newY,
                        velocityX: newVelocityX,
                        velocityY: newVelocityY,
                        displayY: newY + bounceY,
                    };
                });
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [gameState, finishGame]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    // Handle toy tap with fall animation
    const handleToyTap = useCallback((toy, event) => {
        if (gameState !== 'PLAYING' || toy.isFalling) return;

        const now = Date.now();
        const rect = event.target.getBoundingClientRect();

        // Log the tap
        const tapEntry = {
            toyId: toy.id,
            timestamp: now - startTimeRef.current,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            consecutiveSame: lastTapRef.current === toy.id,
        };

        setTapLog(prev => [...prev, tapEntry]);
        lastTapRef.current = toy.id;

        // Update tap count and set falling state
        setToys(prev => prev.map(t =>
            t.id === toy.id
                ? { ...t, tapCount: t.tapCount + 1, isFalling: true, originalY: t.y }
                : t
        ));

        // Create sparkle effect
        const sparkleId = `sparkle-${now}`;
        setSparkles(prev => [...prev, {
            id: sparkleId,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            emoji: CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)]
        }]);

        // Play tap sound
        soundService.pop();

        // Remove sparkle after animation
        setTimeout(() => {
            setSparkles(prev => prev.filter(s => s.id !== sparkleId));
        }, 800);

        // Reset toy position after fall animation (1.2 seconds)
        setTimeout(() => {
            setToys(prev => prev.map(t =>
                t.id === toy.id
                    ? {
                        ...t,
                        isFalling: false,
                        y: t.originalY,
                        displayY: t.originalY,
                        // Give it new random velocity to make it interesting
                        velocityX: (Math.random() - 0.5) * MOVEMENT_SPEED * 2,
                        velocityY: (Math.random() - 0.5) * MOVEMENT_SPEED * 2,
                    }
                    : t
            ));
        }, 1200);
    }, [gameState]);

    // Get computed signals for display
    const signals = calculateMLSignals();

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Result Modal
    const ResultModal = () => {
        if (!showResultModal) return null;

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
                        <div className="text-6xl mb-4">🧸</div>
                        <h2 className="text-3xl font-black text-purple-600">Great Playing!</h2>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl">
                            <span className="font-medium text-gray-700">Total Taps</span>
                            <span className="text-2xl font-bold text-indigo-600">{signals.totalTaps}</span>
                        </div>
                        <div className="flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                            <span className="font-medium text-gray-700">Toys Explored</span>
                            <span className="text-2xl font-bold text-purple-600">
                                {new Set(tapLog.map(t => t.toyId)).size}
                            </span>
                        </div>
                        <div className="flex justify-between items-center bg-pink-50 p-3 rounded-xl">
                            <span className="font-medium text-gray-700">Play Time</span>
                            <span className="text-2xl font-bold text-pink-600">
                                {Math.round(GAME_DURATION / 1000)}s
                            </span>
                        </div>
                    </div>

                    {isAnalyzing && (
                        <div className="text-center text-gray-500 mb-4">
                            <div className="animate-spin inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />
                            Analyzing play patterns...
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                setShowResultModal(false);
                                setGameState('TUTORIAL');
                                setTapLog([]);
                            }}
                            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                        >
                            Play Again
                        </Button>
                        <Button
                            onClick={() => navigate('/home')}
                            variant="outline"
                            className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
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
                    title="🧸"
                    subtitle="Tap the toys!"
                    onComplete={handleStartGame}
                    targetElement={
                        <div className="flex gap-4">
                            <span className="text-6xl">🚗</span>
                            <span className="text-6xl">🎈</span>
                            <span className="text-6xl">⭐</span>
                        </div>
                    }
                />
            )}

            {/* Game Area */}
            {gameState === 'PLAYING' && (
                <div className="flex flex-col flex-1">
                    {/* Header with Back Button and Timer */}
                    <div className="flex justify-between items-center mb-4 px-4">
                        <Button
                            onClick={handleBack}
                            variant="outline"
                            className="flex items-center gap-2 bg-white/90 hover:bg-white shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back</span>
                        </Button>

                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg">
                            <Clock className="w-5 h-5" />
                            <span className="text-xl font-bold">{formatTime(timeRemaining)}</span>
                        </div>
                    </div>

                    {/* Game Play Area */}
                    <div
                        ref={gameAreaRef}
                        className="relative flex-1 min-h-[500px] bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-3xl overflow-hidden mx-4"
                    >
                        {/* Floating toys */}
                        <AnimatePresence>
                            {toys.map(toy => (
                                <motion.button
                                    key={toy.id}
                                    initial={{
                                        scale: 1,
                                        opacity: 1,
                                        x: toy.x,
                                        y: toy.y,
                                    }}
                                    animate={toy.isFalling ? {
                                        // Fall animation: drop down with spin
                                        y: (gameAreaRef.current?.getBoundingClientRect().height || 500) + 100,
                                        opacity: 0,
                                        rotate: 720,
                                        scale: 0.3,
                                    } : {
                                        scale: 1,
                                        opacity: 1,
                                        x: toy.x,
                                        y: toy.displayY || toy.y,
                                        rotate: 0,
                                    }}
                                    transition={toy.isFalling ? {
                                        duration: 1.0,
                                        ease: "easeIn",
                                    } : {
                                        type: 'tween',
                                        duration: 0.05,
                                    }}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 1.4 }}
                                    onClick={(e) => handleToyTap(toy, e)}
                                    className="absolute cursor-pointer select-none filter drop-shadow-lg hover:drop-shadow-2xl z-10"
                                    style={{
                                        fontSize: toy.size,
                                        left: 0,
                                        top: 0,
                                        pointerEvents: toy.isFalling ? 'none' : 'auto',
                                    }}
                                >
                                    {toy.emoji}
                                </motion.button>
                            ))}
                        </AnimatePresence>

                        {/* Sparkle effects */}
                        <AnimatePresence>
                            {sparkles.map(sparkle => (
                                <motion.div
                                    key={sparkle.id}
                                    initial={{ scale: 0, opacity: 1 }}
                                    animate={{ scale: 2, opacity: 0, y: -50 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="fixed text-4xl pointer-events-none z-50"
                                    style={{ left: sparkle.x - 20, top: sparkle.y - 20 }}
                                >
                                    {sparkle.emoji}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Progress bar at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/30">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-400 to-purple-400"
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: GAME_DURATION / 1000, ease: 'linear' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            <ResultModal />
        </div>
    );
}
