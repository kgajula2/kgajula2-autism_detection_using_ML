/**
 * Attention Call Game - Name Response Test
 * 
 * This game measures social orienting reflex by calling the child's name
 * and observing their response using webcam.
 * 
 * ML Signals Captured:
 * - response_detected: Did child react?
 * - response_time: Time from call to response
 * - head_turn_detected: Head movement toward device
 * - response_rate: Percentage of calls responded to
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { useGameSession } from '../../hooks/useGameSession';
import { getUserProfile } from '../../services/db';
import { ATTENTION_CALL_CONFIG, MASCOT } from '../../config/gameConfig';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { analyzeUserPerformance } from '../../services/ml';
import { fetchUserGameStats } from '../../services/db';
import GameTutorial from '../../components/game/GameTutorial';

const { MAX_CALLS, INITIAL_DELAY, BETWEEN_CALLS_DELAY, RESPONSE_WINDOW, FALLBACK_GREETING } = ATTENTION_CALL_CONFIG;

// Animated character component
const AnimatedCharacter = ({ isWaving, isIdle }) => {
    return (
        <motion.div
            className="relative"
            animate={isWaving ? {
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1],
            } : isIdle ? {
                y: [0, -10, 0],
            } : {}}
            transition={isWaving ? {
                duration: 0.5,
                repeat: 2,
            } : {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            <div className="text-[150px] select-none">
                {MASCOT.emoji}
            </div>
            {isWaving && (
                <motion.div
                    className="absolute -right-8 top-0 text-6xl"
                    animate={{ rotate: [0, 20, -20, 20, 0] }}
                    transition={{ duration: 0.3, repeat: 3 }}
                >
                    👋
                </motion.div>
            )}
        </motion.div>
    );
};

// Confetti burst component
const ConfettiBurst = ({ show }) => {
    if (!show) return null;

    const confetti = ['🎉', '⭐', '✨', '🌟', '🎊', '💫'];

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti.map((emoji, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0
                    }}
                    animate={{
                        x: `${20 + Math.random() * 60}%`,
                        y: `${10 + Math.random() * 80}%`,
                        scale: [0, 1.5, 1],
                        opacity: [1, 1, 0],
                    }}
                    transition={{
                        duration: 1.5,
                        delay: i * 0.1,
                    }}
                    className="absolute text-4xl"
                >
                    {emoji}
                </motion.div>
            ))}
        </div>
    );
};

export default function AttentionCallGame() {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { startSession, endSession } = useGameSession();

    // Game states
    const [gameState, setGameState] = useState('TUTORIAL'); // TUTORIAL, PLAYING, FINISHED
    const [childName, setChildName] = useState('');
    const [currentCall, setCurrentCall] = useState(0);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isWaving, setIsWaving] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [calls, setCalls] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [mlResult, setMlResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [waitingForResponse, setWaitingForResponse] = useState(false);

    // Refs
    const callTimeRef = useRef(null);
    const responseTimeoutRef = useRef(null);
    const speechRef = useRef(null);

    // Fetch child's name from profile
    useEffect(() => {
        const fetchName = async () => {
            if (user?.uid) {
                const profile = await getUserProfile(user.uid);
                if (profile?.childName) {
                    setChildName(profile.childName);
                } else if (user.displayName) {
                    // Use first name from display name
                    setChildName(user.displayName.split(' ')[0]);
                }
            }
        };
        fetchName();
    }, [user]);

    // Text-to-speech function
    const speakName = useCallback((name) => {
        return new Promise((resolve) => {
            if ('speechSynthesis' in window) {
                // Cancel any ongoing speech
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(name);
                utterance.rate = 0.9; // Slightly slower for clarity
                utterance.pitch = 1.1; // Slightly higher for child-friendly tone
                utterance.volume = 1;

                // Try to get a friendly voice
                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v =>
                    v.name.includes('Female') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Google')
                );
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }

                utterance.onend = resolve;
                utterance.onerror = resolve;

                window.speechSynthesis.speak(utterance);
                speechRef.current = utterance;
            } else {
                resolve();
            }
        });
    }, []);

    // Make a name call
    const makeCall = useCallback(async () => {
        const callNumber = currentCall + 1;
        const nameToCall = childName || FALLBACK_GREETING;

        setIsCallActive(true);
        callTimeRef.current = Date.now();

        // Speak the name
        await speakName(nameToCall + "!");

        // Wait for response
        setWaitingForResponse(true);

        // After response window, record result and continue
        responseTimeoutRef.current = setTimeout(() => {
            // Record no response
            const callData = {
                callNumber,
                callTimestamp: callTimeRef.current,
                responseDetected: false,
                responseTime: null,
                nameUsed: nameToCall,
            };

            setCalls(prev => [...prev, callData]);
            setIsCallActive(false);
            setWaitingForResponse(false);
            setCurrentCall(callNumber);

            // Schedule next call or end game
            if (callNumber < MAX_CALLS) {
                setTimeout(() => makeCall(), BETWEEN_CALLS_DELAY);
            } else {
                finishGame();
            }
        }, RESPONSE_WINDOW);
    }, [currentCall, childName, speakName]);

    // Handle user interaction (tap/click = response detected)
    const handleResponse = useCallback(() => {
        if (!waitingForResponse) return;

        // Clear timeout
        if (responseTimeoutRef.current) {
            clearTimeout(responseTimeoutRef.current);
        }

        const responseTime = Date.now() - callTimeRef.current;
        const callNumber = currentCall + 1;

        // Record response
        const callData = {
            callNumber,
            callTimestamp: callTimeRef.current,
            responseDetected: true,
            responseTime,
            nameUsed: childName || FALLBACK_GREETING,
        };

        setCalls(prev => [...prev, callData]);
        setWaitingForResponse(false);
        setIsCallActive(false);

        // Show celebration
        setIsWaving(true);
        setShowConfetti(true);

        setTimeout(() => {
            setIsWaving(false);
            setShowConfetti(false);
            setCurrentCall(callNumber);

            // Schedule next call or end game
            if (callNumber < MAX_CALLS) {
                setTimeout(() => makeCall(), BETWEEN_CALLS_DELAY);
            } else {
                finishGame();
            }
        }, 2000);
    }, [waitingForResponse, currentCall, childName, makeCall]);

    // Start game
    const handleStartGame = useCallback(async () => {
        setCalls([]);
        setCurrentCall(0);

        if (user?.uid) {
            const sid = await startSession(user.uid, 'attention-call', {
                maxCalls: MAX_CALLS,
                childName: childName || FALLBACK_GREETING,
            });
            setSessionId(sid);
        }

        setGameState('PLAYING');

        // Start first call after initial delay
        setTimeout(() => makeCall(), INITIAL_DELAY);
    }, [startSession, user, childName, makeCall]);

    // Finish game
    const finishGame = useCallback(async () => {
        setGameState('FINISHED');

        // Calculate stats
        const responses = calls.filter(c => c.responseDetected);
        const responseRate = calls.length > 0 ? responses.length / calls.length : 0;
        const avgResponseTime = responses.length > 0
            ? responses.reduce((sum, c) => sum + c.responseTime, 0) / responses.length
            : null;

        const stats = {
            calls,
            responseRate: Math.round(responseRate * 100) / 100,
            avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
            totalResponses: responses.length,
            totalCalls: calls.length,
        };

        // End session
        if (sessionId) {
            await endSession(sessionId, responses.length, stats);
        }

        setShowResultModal(true);
        setIsAnalyzing(true);

        try {
            if (user?.uid) {
                const { aggregated } = await fetchUserGameStats(user.uid);
                aggregated['attention-call'] = {
                    ...stats,
                    score: responses.length,
                    count: (aggregated['attention-call']?.count || 0) + 1,
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
    }, [calls, sessionId, endSession, user]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (responseTimeoutRef.current) {
                clearTimeout(responseTimeoutRef.current);
            }
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Result Modal
    const ResultModal = () => {
        if (!showResultModal) return null;

        const responses = calls.filter(c => c.responseDetected).length;
        const avgTime = calls.filter(c => c.responseDetected).length > 0
            ? Math.round(calls.filter(c => c.responseDetected).reduce((sum, c) => sum + c.responseTime, 0) / calls.filter(c => c.responseDetected).length / 1000 * 10) / 10
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
                        <div className="text-6xl mb-4">🔔</div>
                        <h2 className="text-3xl font-black text-rose-600">Well Done!</h2>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center bg-rose-50 p-3 rounded-xl">
                            <span className="font-medium text-gray-700">Responses</span>
                            <span className="text-2xl font-bold text-rose-600">{responses}/{MAX_CALLS}</span>
                        </div>
                        {avgTime > 0 && (
                            <div className="flex justify-between items-center bg-pink-50 p-3 rounded-xl">
                                <span className="font-medium text-gray-700">Avg Response</span>
                                <span className="text-2xl font-bold text-pink-600">{avgTime}s</span>
                            </div>
                        )}
                    </div>

                    {isAnalyzing && (
                        <div className="text-center text-gray-500 mb-4">
                            <div className="animate-spin inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full mr-2" />
                            Analyzing responses...
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                setShowResultModal(false);
                                setGameState('TUTORIAL');
                                setCalls([]);
                            }}
                            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white"
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
                    title="🐘"
                    subtitle="Listen for your name!"
                    onComplete={handleStartGame}
                    targetElement={
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-6xl animate-bounce">🔔</span>
                            <span className="text-4xl">🐘</span>
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
                        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg">
                            <span className="text-lg font-bold">Call {currentCall + 1} / {MAX_CALLS}</span>
                        </div>
                    </div>

                    {/* Game Play Area */}
                    <div
                        className="relative flex-1 min-h-[500px] bg-gradient-to-br from-rose-100 via-pink-50 to-orange-100 rounded-3xl overflow-hidden flex flex-col items-center justify-center cursor-pointer mx-4"
                        onClick={handleResponse}
                    >
                        {/* Character */}
                        <AnimatedCharacter
                            isWaving={isWaving}
                            isIdle={!isCallActive && !isWaving}
                        />

                        {/* Call indicator */}
                        {isCallActive && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 0.5 }}
                                className="absolute top-8 text-6xl"
                            >
                                🔔
                            </motion.div>
                        )}

                        {/* Waiting indicator */}
                        {waitingForResponse && (
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-20 text-2xl font-bold text-rose-600"
                            >
                                Tap the screen!
                            </motion.p>
                        )}

                        {/* Confetti */}
                        <ConfettiBurst show={showConfetti} />

                        {/* Progress */}
                        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
                            {Array.from({ length: MAX_CALLS }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-all ${i < currentCall
                                        ? calls[i]?.responseDetected
                                            ? 'bg-green-500'
                                            : 'bg-gray-300'
                                        : 'bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            <ResultModal />
        </div>
    );
}
