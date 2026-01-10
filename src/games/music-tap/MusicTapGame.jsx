import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '../../components/game/GameShell';
import { createGameSession, endGameSession, logRoundMetrics } from '../../services/db';
import { analyzeUserPerformance } from '../../services/ml';
import { getAuth } from 'firebase/auth';
import GameTutorial from '../../components/game/GameTutorial';
import { soundService } from '../../services/sound';

/**
 * Music & Tap Game
 * Purpose: Rhythm recognition & sensory processing (ASD markers: A7, A8)
 * 
 * Metrics tracked:
 * - beatAccuracy: How close to beat were taps
 * - timingDeviation: Average offset from beat
 * - consistencyScore: Regularity of taps
 * - responseTime: Time from beat to tap
 */

// Beat patterns (simpler for toddlers)
const BEAT_INTERVAL = 1000; // 1 second between beats
const TOTAL_BEATS = 10;
const ACCEPTABLE_OFFSET = 400; // ms tolerance for "on beat"

export default function MusicTapGame() {
    const [gameState, setGameState] = useState('TUTORIAL');
    const [currentBeat, setCurrentBeat] = useState(0);
    const [score, setScore] = useState(0);
    const [isPulsing, setIsPulsing] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [showTapFeedback, setShowTapFeedback] = useState(false);
    const [lastTapQuality, setLastTapQuality] = useState(''); // 'perfect', 'good', 'miss'
    const [tapCount, setTapCount] = useState(0);

    // Metrics
    const metricsRef = useRef({
        beatTimes: [],
        tapTimes: [],
        deviations: [],
        onBeatTaps: 0,
        offBeatTaps: 0,
        startTime: 0,
    });

    const beatIntervalRef = useRef(null);
    const lastBeatTimeRef = useRef(0);

    // Initialize game
    const startGame = async () => {
        const userId = getAuth().currentUser?.uid;
        if (userId) {
            try {
                const sid = await createGameSession(userId, 'music-tap', {});
                setSessionId(sid);
            } catch (e) {
                console.error('Failed to create session:', e);
            }
        }

        metricsRef.current = {
            beatTimes: [],
            tapTimes: [],
            deviations: [],
            onBeatTaps: 0,
            offBeatTaps: 0,
            startTime: Date.now(),
        };

        setCurrentBeat(0);
        setScore(0);
        setTapCount(0);
        setGameState('ACTIVE');

        // Start beat loop
        playBeat();
        beatIntervalRef.current = setInterval(playBeat, BEAT_INTERVAL);
    };

    // Play beat
    const playBeat = () => {
        setCurrentBeat(prev => {
            if (prev >= TOTAL_BEATS) {
                clearInterval(beatIntervalRef.current);
                finishGame();
                return prev;
            }
            return prev + 1;
        });

        lastBeatTimeRef.current = Date.now();
        metricsRef.current.beatTimes.push(Date.now());

        // Visual pulse
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 200);

        // Audio beat (if supported)
        soundService.play('pop');
    };

    // Handle user tap
    const handleTap = () => {
        if (gameState !== 'ACTIVE') return;

        const tapTime = Date.now();
        const lastBeat = lastBeatTimeRef.current;
        const deviation = Math.abs(tapTime - lastBeat);

        metricsRef.current.tapTimes.push(tapTime);
        metricsRef.current.deviations.push(deviation);
        setTapCount(t => t + 1);

        // Evaluate tap timing
        let quality;
        if (deviation < 150) {
            quality = 'perfect';
            metricsRef.current.onBeatTaps++;
            setScore(s => s + 10);
        } else if (deviation < ACCEPTABLE_OFFSET) {
            quality = 'good';
            metricsRef.current.onBeatTaps++;
            setScore(s => s + 5);
        } else {
            quality = 'miss';
            metricsRef.current.offBeatTaps++;
        }

        setLastTapQuality(quality);
        setShowTapFeedback(true);
        setTimeout(() => setShowTapFeedback(false), 300);

        // Log metrics
        if (sessionId) {
            logRoundMetrics(sessionId, {
                game: 'music-tap',
                beat: currentBeat,
                deviation,
                quality,
                tapTime,
            });
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (beatIntervalRef.current) {
                clearInterval(beatIntervalRef.current);
            }
        };
    }, []);

    // Finish game
    const finishGame = async () => {
        clearInterval(beatIntervalRef.current);
        setGameState('FINISHED');
        setIsAnalyzing(true);

        const metrics = metricsRef.current;
        const avgDeviation = metrics.deviations.length > 0
            ? metrics.deviations.reduce((a, b) => a + b, 0) / metrics.deviations.length
            : 999;
        const totalTime = (Date.now() - metrics.startTime) / 1000;
        const beatAccuracy = metrics.onBeatTaps / (metrics.onBeatTaps + metrics.offBeatTaps) || 0;

        // Calculate consistency (standard deviation of deviations)
        const variance = metrics.deviations.length > 0
            ? metrics.deviations.reduce((sum, d) => sum + Math.pow(d - avgDeviation, 2), 0) / metrics.deviations.length
            : 999;
        const consistencyScore = Math.max(0, 100 - Math.sqrt(variance) / 5);

        const finalStats = {
            totalTaps: metrics.tapTimes.length,
            onBeatTaps: metrics.onBeatTaps,
            offBeatTaps: metrics.offBeatTaps,
            avgDeviation: Math.round(avgDeviation),
            beatAccuracy: Math.round(beatAccuracy * 100),
            consistencyScore: Math.round(consistencyScore),
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
                'music-tap': {
                    score,
                    beatAccuracy,
                    avgDeviation,
                    consistencyScore,
                    totalTaps: metrics.tapTimes.length,
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
                className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.span
                className="text-4xl"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
            >
                🎵
            </motion.span>
        </div>
    );

    return (
        <GameShell
            title="🎵 Music & Tap"
            gameState={gameState}
            score={score}
            progress={(currentBeat / TOTAL_BEATS) * 100}
            headerColor="bg-gradient-to-r from-pink-500 to-purple-500"
            onPlayAgain={() => {
                setGameState('TUTORIAL');
                setAnalysisResult(null);
            }}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            stats={[
                { label: 'Taps', value: tapCount },
                { label: 'On Beat', value: metricsRef.current.onBeatTaps },
                { label: 'Beat', value: `${currentBeat}/${TOTAL_BEATS}` },
            ]}
        >
            {/* Tutorial */}
            {gameState === 'TUTORIAL' && (
                <GameTutorial
                    type="tap"
                    title="🎵"
                    subtitle="Tap the beat!"
                    targetElement={tutorialElement}
                    onComplete={startGame}
                />
            )}

            {/* Game Area */}
            {gameState === 'ACTIVE' && (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    {/* Beat Indicator */}
                    <div className="text-4xl mb-8 flex gap-2">
                        {[...Array(TOTAL_BEATS)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={`w-4 h-4 rounded-full ${i < currentBeat ? 'bg-purple-500' : 'bg-gray-300'
                                    }`}
                                animate={i === currentBeat - 1 ? { scale: [1, 1.5, 1] } : {}}
                            />
                        ))}
                    </div>

                    {/* Big Tap Button */}
                    <motion.button
                        onClick={handleTap}
                        className={`w-48 h-48 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 shadow-2xl flex items-center justify-center text-white text-6xl ${isPulsing ? 'ring-8 ring-yellow-400' : ''
                            }`}
                        animate={isPulsing ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.2 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        🎵
                    </motion.button>

                    {/* Tap Feedback */}
                    <AnimatePresence>
                        {showTapFeedback && (
                            <motion.div
                                initial={{ y: 0, opacity: 1 }}
                                animate={{ y: -50, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute text-4xl mt-64"
                            >
                                {lastTapQuality === 'perfect' && '⭐ Perfect!'}
                                {lastTapQuality === 'good' && '👍 Good!'}
                                {lastTapQuality === 'miss' && '🎯 Try again!'}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Visual Pulse Ring */}
                    <AnimatePresence>
                        {isPulsing && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 1 }}
                                animate={{ scale: 2, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute w-48 h-48 rounded-full border-4 border-purple-400"
                            />
                        )}
                    </AnimatePresence>
                </div>
            )}
        </GameShell>
    );
}
