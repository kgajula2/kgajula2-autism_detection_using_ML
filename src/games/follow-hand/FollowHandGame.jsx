import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '../../components/game/GameShell';
import { createGameSession, endGameSession, logRoundMetrics } from '../../services/db';
import { analyzeUserPerformance } from '../../services/ml';
import { getAuth } from 'firebase/auth';
import GameTutorial from '../../components/game/GameTutorial';
import { soundService } from '../../services/sound';

/**
 * Follow the Hand Game
 * Purpose: Joint Attention - Critical ASD screening marker (A5, A6)
 * 
 * Metrics tracked:
 * - pointToTapTime: Time from hand pointing to child tapping target
 * - followedGaze: Did child tap where hand pointed?
 * - missedPoints: Failed to follow gaze
 * - waveToPointDelay: Attention span measurement
 */

// Game configuration
const TARGETS = [
    { id: 'star', emoji: '⭐', position: 'left' },
    { id: 'ball', emoji: '⚽', position: 'right' },
    { id: 'flower', emoji: '🌸', position: 'left' },
    { id: 'sun', emoji: '☀️', position: 'right' },
    { id: 'heart', emoji: '❤️', position: 'left' },
];

const TOTAL_ROUNDS = 5;

export default function FollowHandGame() {
    const [gameState, setGameState] = useState('TUTORIAL');
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState('WAVE'); // WAVE, POINT, TAP
    const [currentTarget, setCurrentTarget] = useState(null);
    const [pointStartTime, setPointStartTime] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [showCorrect, setShowCorrect] = useState(false);
    const [showWrong, setShowWrong] = useState(false);
    const [distractor, setDistractor] = useState(null);

    // Metrics
    const metricsRef = useRef({
        tapTimes: [],
        correctFollows: 0,
        missedPoints: 0,
        waveToPointDelays: [],
        startTime: 0,
    });

    // Initialize game
    const startGame = async () => {
        const userId = getAuth().currentUser?.uid;
        if (userId) {
            try {
                const sid = await createGameSession(userId, 'follow-hand', {});
                setSessionId(sid);
            } catch (e) {
                console.error('Failed to create session:', e);
            }
        }

        metricsRef.current = {
            tapTimes: [],
            correctFollows: 0,
            missedPoints: 0,
            waveToPointDelays: [],
            startTime: Date.now(),
        };

        setRound(0);
        setScore(0);
        setGameState('ACTIVE');
        nextRound();
    };

    // Setup next round
    const nextRound = useCallback(() => {
        if (round >= TOTAL_ROUNDS) {
            finishGame();
            return;
        }

        const targetIndex = round % TARGETS.length;
        const target = TARGETS[targetIndex];

        // Create distractor on opposite side
        const distractorIndex = (targetIndex + 2) % TARGETS.length;
        const distractorItem = TARGETS[distractorIndex];
        setDistractor({
            ...distractorItem,
            position: target.position === 'left' ? 'right' : 'left'
        });

        setCurrentTarget(target);
        setRound(r => r + 1);
        setPhase('WAVE');

        // Wave animation, then point
        setTimeout(() => {
            setPhase('POINT');
            setPointStartTime(Date.now());
            metricsRef.current.waveToPointDelays.push(1500); // Fixed wave duration
        }, 1500);
    }, [round]);

    // Handle target tap
    const handleTap = (isCorrectTarget) => {
        if (phase !== 'POINT') return;

        const tapTime = Date.now() - pointStartTime;

        if (isCorrectTarget) {
            metricsRef.current.correctFollows++;
            metricsRef.current.tapTimes.push(tapTime);
            setScore(s => s + 10);
            setShowCorrect(true);
            soundService.play('success');

            if (sessionId) {
                logRoundMetrics(sessionId, {
                    game: 'follow-hand',
                    round,
                    tapTime,
                    followedGaze: true,
                    target: currentTarget.id,
                });
            }

            setTimeout(() => {
                setShowCorrect(false);
                nextRound();
            }, 800);
        } else {
            metricsRef.current.missedPoints++;
            setShowWrong(true);
            soundService.play('error');

            if (sessionId) {
                logRoundMetrics(sessionId, {
                    game: 'follow-hand',
                    round,
                    tapTime,
                    followedGaze: false,
                    target: currentTarget.id,
                });
            }

            setTimeout(() => {
                setShowWrong(false);
            }, 500);
        }
    };

    // Finish game
    const finishGame = async () => {
        setGameState('FINISHED');
        setIsAnalyzing(true);

        const metrics = metricsRef.current;
        const avgTapTime = metrics.tapTimes.length > 0
            ? metrics.tapTimes.reduce((a, b) => a + b, 0) / metrics.tapTimes.length
            : 0;
        const totalTime = (Date.now() - metrics.startTime) / 1000;
        const followRate = metrics.correctFollows / (metrics.correctFollows + metrics.missedPoints) || 0;

        const finalStats = {
            correctFollows: metrics.correctFollows,
            missedPoints: metrics.missedPoints,
            averageTapTime: Math.round(avgTapTime),
            followRate: Math.round(followRate * 100),
            totalTime: Math.round(totalTime),
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
                'follow-hand': {
                    score,
                    followRate,
                    avgTapTime,
                    missedPoints: metrics.missedPoints,
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
        <div className="flex items-center gap-6">
            <motion.span
                className="text-6xl"
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
            >
                👋
            </motion.span>
            <motion.span
                className="text-4xl"
                animate={{ x: [0, 20, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.5 }}
            >
                👉
            </motion.span>
            <motion.span
                className="text-5xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 1 }}
            >
                ⭐
            </motion.span>
        </div>
    );

    return (
        <GameShell
            title="👋 Follow the Hand"
            gameState={gameState}
            score={score}
            progress={(round / TOTAL_ROUNDS) * 100}
            headerColor="bg-gradient-to-r from-green-500 to-teal-500"
            onPlayAgain={() => {
                setGameState('TUTORIAL');
                setAnalysisResult(null);
            }}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            stats={[
                { label: 'Followed', value: metricsRef.current.correctFollows },
                { label: 'Missed', value: metricsRef.current.missedPoints },
                { label: 'Round', value: `${round}/${TOTAL_ROUNDS}` },
            ]}
        >
            {/* Tutorial */}
            {gameState === 'TUTORIAL' && (
                <GameTutorial
                    type="tap"
                    title="👋"
                    subtitle="Follow the hand!"
                    targetElement={tutorialElement}
                    onComplete={startGame}
                />
            )}

            {/* Game Area */}
            {gameState === 'ACTIVE' && currentTarget && (
                <div className="flex flex-col items-center justify-center h-[60vh] relative">
                    {/* Hand Character */}
                    <motion.div
                        className="absolute top-10 text-8xl"
                        animate={
                            phase === 'WAVE'
                                ? { rotate: [0, 30, -30, 30, -30, 0] }
                                : phase === 'POINT'
                                    ? {
                                        rotate: currentTarget.position === 'left' ? -45 : 45,
                                        x: currentTarget.position === 'left' ? -50 : 50
                                    }
                                    : {}
                        }
                        transition={{
                            duration: phase === 'WAVE' ? 1.5 : 0.5,
                            ease: "easeInOut"
                        }}
                    >
                        {phase === 'WAVE' ? '👋' : '👉'}
                    </motion.div>

                    {/* Pointing Line when pointing */}
                    {phase === 'POINT' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`absolute top-32 text-4xl ${currentTarget.position === 'left' ? 'left-20' : 'right-20'}`}
                        >
                            {currentTarget.position === 'left' ? '⬅️' : '➡️'}
                        </motion.div>
                    )}

                    {/* Targets Container */}
                    <div className="flex justify-between w-full px-8 mt-32">
                        {/* Left Target */}
                        <motion.button
                            onClick={() => handleTap(currentTarget.position === 'left')}
                            className={`w-28 h-28 rounded-3xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-xl flex items-center justify-center ${phase === 'POINT' && currentTarget.position === 'left' ? 'ring-4 ring-green-400 animate-pulse' : ''
                                }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={phase !== 'POINT'}
                        >
                            <span className="text-6xl">
                                {currentTarget.position === 'left' ? currentTarget.emoji : distractor?.emoji}
                            </span>
                        </motion.button>

                        {/* Right Target */}
                        <motion.button
                            onClick={() => handleTap(currentTarget.position === 'right')}
                            className={`w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-xl flex items-center justify-center ${phase === 'POINT' && currentTarget.position === 'right' ? 'ring-4 ring-green-400 animate-pulse' : ''
                                }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={phase !== 'POINT'}
                        >
                            <span className="text-6xl">
                                {currentTarget.position === 'right' ? currentTarget.emoji : distractor?.emoji}
                            </span>
                        </motion.button>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                        {showCorrect && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute text-8xl"
                            >
                                🎉
                            </motion.div>
                        )}
                        {showWrong && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, x: [-10, 10, -10, 10, 0] }}
                                exit={{ scale: 0 }}
                                className="absolute text-6xl"
                            >
                                ❌
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </GameShell>
    );
}
