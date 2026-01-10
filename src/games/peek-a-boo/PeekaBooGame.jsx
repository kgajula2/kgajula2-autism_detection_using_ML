import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '../../components/game/GameShell';
import { createGameSession, endGameSession, logRoundMetrics } from '../../services/db';
import { analyzeUserPerformance } from '../../services/ml';
import { getAuth } from 'firebase/auth';
import GameTutorial from '../../components/game/GameTutorial';
import { soundService } from '../../services/sound';

/**
 * Peek-a-Boo Game
 * Purpose: Social engagement & anticipation (ASD markers: A9, A10)
 * 
 * Metrics tracked:
 * - anticipationTime: How quickly child responds after reveal
 * - engagementDuration: Time spent playing
 * - repeatEngagement: How many rounds initiated by child
 * - responseConsistency: Variation in response times
 */

// Game configuration
const FACES = ['😊', '😄', '🥳', '😁', '🤗'];
const HIDE_OBJECTS = ['🌈', '☁️', '🎈', '🌟', '🎁'];
const TOTAL_ROUNDS = 6;

export default function PeekaBooGame() {
    const [gameState, setGameState] = useState('TUTORIAL');
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState('HIDDEN'); // HIDDEN, PEEKING, REVEALED
    const [currentFace, setCurrentFace] = useState(FACES[0]);
    const [currentObject, setCurrentObject] = useState(HIDE_OBJECTS[0]);
    const [revealTime, setRevealTime] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Metrics
    const metricsRef = useRef({
        responseTimes: [],
        roundsCompleted: 0,
        totalEngagement: 0,
        startTime: 0,
    });

    const hideTimeoutRef = useRef(null);

    // Initialize game
    const startGame = async () => {
        const userId = getAuth().currentUser?.uid;
        if (userId) {
            try {
                const sid = await createGameSession(userId, 'peek-a-boo', {});
                setSessionId(sid);
            } catch (e) {
                console.error('Failed to create session:', e);
            }
        }

        metricsRef.current = {
            responseTimes: [],
            roundsCompleted: 0,
            totalEngagement: 0,
            startTime: Date.now(),
        };

        setRound(0);
        setScore(0);
        setGameState('ACTIVE');
        startPeekSequence();
    };

    // Start peek sequence
    const startPeekSequence = useCallback(() => {
        if (round >= TOTAL_ROUNDS) {
            finishGame();
            return;
        }

        // Random face and object
        setCurrentFace(FACES[round % FACES.length]);
        setCurrentObject(HIDE_OBJECTS[round % HIDE_OBJECTS.length]);
        setPhase('HIDDEN');

        // Auto-peek after delay (for toddlers who may not tap)
        hideTimeoutRef.current = setTimeout(() => {
            peekOut();
        }, 2000);
    }, [round]);

    // Child taps to make peek
    const handleTapHidden = () => {
        if (phase !== 'HIDDEN') return;

        clearTimeout(hideTimeoutRef.current);
        peekOut();
    };

    // Face peeks out
    const peekOut = () => {
        setPhase('PEEKING');
        soundService.play('pop');

        // Short peek, then full reveal
        setTimeout(() => {
            setPhase('REVEALED');
            setRevealTime(Date.now());
            soundService.play('success');
        }, 500);
    };

    // Child responds to revealed face
    const handleTapFace = () => {
        if (phase !== 'REVEALED') return;

        const responseTime = Date.now() - revealTime;
        metricsRef.current.responseTimes.push(responseTime);
        metricsRef.current.roundsCompleted++;

        setScore(s => s + 10);
        setShowCelebration(true);

        // Log metrics
        if (sessionId) {
            logRoundMetrics(sessionId, {
                game: 'peek-a-boo',
                round: round + 1,
                responseTime,
                face: currentFace,
            });
        }

        setTimeout(() => {
            setShowCelebration(false);
            setRound(r => r + 1);

            if (round + 1 >= TOTAL_ROUNDS) {
                finishGame();
            } else {
                startPeekSequence();
            }
        }, 1000);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    // Next round when round changes
    useEffect(() => {
        if (gameState === 'ACTIVE' && round > 0 && round < TOTAL_ROUNDS) {
            startPeekSequence();
        }
    }, [round, gameState]);

    // Finish game
    const finishGame = async () => {
        clearTimeout(hideTimeoutRef.current);
        setGameState('FINISHED');
        setIsAnalyzing(true);

        const metrics = metricsRef.current;
        const avgResponseTime = metrics.responseTimes.length > 0
            ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
            : 0;
        const totalTime = (Date.now() - metrics.startTime) / 1000;

        // Calculate consistency
        const variance = metrics.responseTimes.length > 0
            ? metrics.responseTimes.reduce((sum, t) => sum + Math.pow(t - avgResponseTime, 2), 0) / metrics.responseTimes.length
            : 999;
        const consistencyScore = Math.max(0, 100 - Math.sqrt(variance) / 10);

        const finalStats = {
            roundsCompleted: metrics.roundsCompleted,
            avgResponseTime: Math.round(avgResponseTime),
            consistencyScore: Math.round(consistencyScore),
            engagementDuration: Math.round(totalTime),
            totalInteractions: metrics.responseTimes.length,
        };

        if (sessionId) {
            try {
                await endGameSession(sessionId, score, finalStats);
            } catch (e) {
                console.error('Failed to end session:', e);
            }
        }

        try {
            const result = await analyzeUserPerformance({
                'peek-a-boo': {
                    score,
                    avgResponseTime,
                    consistencyScore,
                    roundsCompleted: metrics.roundsCompleted,
                    duration: totalTime,
                }
            });
            setAnalysisResult(result);
        } catch (e) {
            console.error('Analysis failed:', e);
        }

        setIsAnalyzing(false);
    };

    // Tutorial element
    const tutorialElement = (
        <div className="flex flex-col items-center gap-4">
            <motion.div
                className="relative w-24 h-24"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
            >
                <motion.div
                    className="absolute inset-0 flex items-center justify-center text-6xl"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    😊
                </motion.div>
                <motion.div
                    className="absolute inset-0 flex items-center justify-center text-6xl"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    🎈
                </motion.div>
            </motion.div>
        </div>
    );

    return (
        <GameShell
            title="👶 Peek-a-Boo"
            gameState={gameState}
            score={score}
            progress={(round / TOTAL_ROUNDS) * 100}
            headerColor="bg-gradient-to-r from-orange-400 to-yellow-500"
            onPlayAgain={() => {
                setGameState('TUTORIAL');
                setAnalysisResult(null);
            }}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            stats={[
                { label: 'Peeks', value: metricsRef.current.roundsCompleted },
                { label: 'Round', value: `${round}/${TOTAL_ROUNDS}` },
            ]}
        >
            {/* Tutorial */}
            {gameState === 'TUTORIAL' && (
                <GameTutorial
                    type="tap"
                    title="👀"
                    subtitle="Find the face!"
                    targetElement={tutorialElement}
                    onComplete={startGame}
                />
            )}

            {/* Game Area */}
            {gameState === 'ACTIVE' && (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    {/* Round indicator */}
                    <div className="flex gap-2 mb-8">
                        {[...Array(TOTAL_ROUNDS)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full ${i < round ? 'bg-yellow-400' : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Peek-a-Boo Character */}
                    <motion.button
                        onClick={phase === 'HIDDEN' ? handleTapHidden : handleTapFace}
                        className="relative w-48 h-48 rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 shadow-2xl flex items-center justify-center overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* Hide Object */}
                        <AnimatePresence mode="wait">
                            {phase === 'HIDDEN' && (
                                <motion.div
                                    key="hidden"
                                    initial={{ scale: 1 }}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="text-8xl"
                                >
                                    {currentObject}
                                </motion.div>
                            )}

                            {phase === 'PEEKING' && (
                                <motion.div
                                    key="peeking"
                                    initial={{ y: 100 }}
                                    animate={{ y: 50 }}
                                    className="text-8xl"
                                >
                                    {currentFace}
                                </motion.div>
                            )}

                            {phase === 'REVEALED' && (
                                <motion.div
                                    key="revealed"
                                    initial={{ y: 50, scale: 0.8 }}
                                    animate={{ y: 0, scale: 1, rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 0.3 }}
                                    className="text-8xl"
                                >
                                    {currentFace}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tap hint for hidden */}
                        {phase === 'HIDDEN' && (
                            <motion.div
                                className="absolute bottom-4 text-2xl"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                👆 Tap!
                            </motion.div>
                        )}
                    </motion.button>

                    {/* Peek-a-boo text */}
                    <AnimatePresence>
                        {phase === 'REVEALED' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-8 text-4xl font-bold text-orange-500"
                            >
                                Peek-a-Boo! 🎉
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Celebration */}
                    <AnimatePresence>
                        {showCelebration && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, rotate: 360 }}
                                exit={{ scale: 0 }}
                                className="absolute text-8xl"
                            >
                                🎊
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </GameShell>
    );
}
