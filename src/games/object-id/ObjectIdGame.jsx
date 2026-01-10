import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Title, SubTitle } from '../../components/ui/Typography';
import { GameShell } from '../../components/game/GameShell';
import { logRoundMetrics, createGameSession, endGameSession } from '../../services/db';
import { analyzeUserPerformance } from '../../services/ml';
import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { OBJECTS, OBJECT_ID_CONFIG } from '../../config/gameConfig';
import { shuffle } from '../../utils/utils';
import GameTutorial, { TutorialConfigs } from '../../components/game/GameTutorial';

const { MAX_ROUNDS, OPTIONS_COUNT } = OBJECT_ID_CONFIG;

export default function ObjectIdGame() {
    const { gameState, score, setGameState, incrementScore, resetGame } = useGameStore();
    const [target, setTarget] = useState(null);
    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [roundCount, setRoundCount] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [gameStats, setGameStats] = useState({ correct: 0, mistakes: 0 });
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);
    const startTimeRef = useRef(0);
    const roundStartTimeRef = useRef(0);  // Track per-round timing
    const roundTimingsRef = useRef([]);   // Store all round timings

    // Preload Images
    useEffect(() => {
        const preloadImages = async () => {
            const promises = OBJECTS.map(obj => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = obj.image;
                    img.onload = resolve;
                    img.onerror = reject;
                });
            });

            try {
                await Promise.all(promises);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to preload images", err);
                setIsLoading(false);
            }
        };
        preloadImages();
    }, []);

    const startRound = () => {
        setFeedback(null);

        if (roundCount >= MAX_ROUNDS) {
            handleGameOver();
            return;
        }

        const newTarget = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
        setTarget(newTarget);

        let pool = OBJECTS.filter(o => o.id !== newTarget.id);
        pool = shuffle(pool).slice(0, OPTIONS_COUNT - 1);
        const roundOptions = shuffle([...pool, newTarget]);
        setOptions(roundOptions);
        setRoundCount(prev => prev + 1);

        // Mark round start time
        roundStartTimeRef.current = Date.now();
    };

    const startGame = async () => {
        try {
            resetGame();
            setRoundCount(0);
            setGameStats({ correct: 0, mistakes: 0 });
            setAnalysisResult(null);
            setShowTutorial(true);
            startTimeRef.current = Date.now();
            roundTimingsRef.current = []; // Reset round timings

            const userId = getAuth().currentUser?.uid;
            if (userId) {
                const sid = await createGameSession(userId, 'object-id', { maxRounds: MAX_ROUNDS });
                setSessionId(sid);
            }

            setGameState('ACTIVE');
            // Delay first round slightly to ensure state is set
            setTimeout(() => startRound(), 100);
        } catch (error) {
            console.error("Failed to start game:", error);
            setGameState('ACTIVE');
            setTimeout(() => startRound(), 100);
        }
    };

    const handleGameOver = async () => {
        setGameState('COMPLETED');
        setIsAnalyzing(true);

        const duration = (Date.now() - startTimeRef.current) / 1000;
        const finalStats = {
            ...gameStats,
            score,
            duration,
            roundTimings: roundTimingsRef.current  // Include per-round timings
        };

        if (sessionId) {
            await endGameSession(sessionId, score, finalStats);
        }

        try {
            const gameData = {
                'object-id': { score, correct: gameStats.correct, wrong: gameStats.mistakes, duration }
            };
            const result = await analyzeUserPerformance(gameData);
            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSelect = (item) => {
        if (gameState !== 'ACTIVE' || feedback) return;

        const selectionTime = Date.now();
        const roundDuration = selectionTime - roundStartTimeRef.current;
        const isCorrect = item.id === target.id;

        // Store round timing data
        const roundData = {
            round: roundCount,
            target: target.id,
            selected: item.id,
            correct: isCorrect,
            roundStartTime: roundStartTimeRef.current,
            selectionTime: selectionTime,
            reactionTime: roundDuration, // Time to identify object (ms)
        };
        roundTimingsRef.current.push(roundData);

        if (isCorrect) {
            setFeedback({ id: item.id, type: 'success' });
            incrementScore(10);
            setGameStats(prev => ({ ...prev, correct: prev.correct + 1 }));

            // Log detailed round metrics to Firebase
            if (sessionId) {
                logRoundMetrics(sessionId, {
                    type: 'object_identification',
                    game: 'object-id',
                    round: roundCount,
                    roundLabel: `${roundCount}/${MAX_ROUNDS}`,
                    target: target.id,
                    selected: item.id,
                    correct: true,
                    roundStartTime: roundStartTimeRef.current,
                    selectionTime: selectionTime,
                    reactionTimeMs: roundDuration,
                    reactionTimeSec: (roundDuration / 1000).toFixed(2),
                    timestamp: selectionTime
                });
            }

            setTimeout(() => startRound(), 1000);
        } else {
            setFeedback({ id: item.id, type: 'error' });
            incrementScore(-5);
            setGameStats(prev => ({ ...prev, mistakes: prev.mistakes + 1 }));

            if (sessionId) {
                logRoundMetrics(sessionId, {
                    type: 'object_identification',
                    game: 'object-id',
                    round: roundCount,
                    roundLabel: `${roundCount}/${MAX_ROUNDS}`,
                    target: target.id,
                    selected: item.id,
                    correct: false,
                    roundStartTime: roundStartTimeRef.current,
                    selectionTime: selectionTime,
                    reactionTimeMs: roundDuration,
                    timestamp: selectionTime
                });
            }

            setTimeout(() => setFeedback(null), 500);
        }
    };

    const getStats = () => {
        const duration = startTimeRef.current
            ? ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
            : '0';

        // Calculate average reaction time
        const avgReaction = roundTimingsRef.current.length > 0
            ? Math.round(roundTimingsRef.current.reduce((sum, r) => sum + r.reactionTime, 0) / roundTimingsRef.current.length)
            : 0;

        return [
            { label: 'Correct', value: gameStats.correct },
            { label: 'Mistakes', value: gameStats.mistakes },
            { label: 'Avg Time', value: avgReaction > 0 ? `${(avgReaction / 1000).toFixed(1)}s` : '-' },
        ];
    };

    return (
        <GameShell
            title="Object ID"
            score={score}
            gameState={gameState}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            stats={getStats()}
            onPlayAgain={startGame}
            headerColor="bg-blue-600"
        >
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 gap-6">

                {/* Tutorial Overlay */}
                <AnimatePresence>
                    {gameState === 'ACTIVE' && showTutorial && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center">
                            <GameTutorial
                                {...TutorialConfigs.objectId}
                                onComplete={() => setShowTutorial(false)}
                            />
                        </div>
                    )}
                </AnimatePresence>

                {/* Target Display - Large & Prominent */}
                {gameState === 'ACTIVE' && target && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1 rounded-3xl shadow-xl transform hover:scale-105 transition-all">
                            <div className="bg-white px-10 py-8 rounded-[1.4rem] flex flex-col items-center gap-4">
                                {/* Visual Cue Only - No "FIND THIS" text */}
                                <img
                                    src={target.image}
                                    alt={target.label}
                                    className="w-40 h-40 object-contain drop-shadow-lg"
                                />
                                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                    {target.label}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-bold">Loading Cards...</p>
                    </div>
                )}

                {/* Idle State */}
                {!isLoading && gameState === 'IDLE' && (
                    <Card glass className="p-10 text-center max-w-lg mt-10 shadow-xl">
                        <Title>Object ID</Title>
                        <SubTitle className="mb-8">Find the matching picture!</SubTitle>
                        <div className="flex justify-center gap-4 mb-8">
                            <span className="text-6xl animate-bounce" style={{ animationDelay: '0s' }}>🍎</span>
                            <span className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>🚗</span>
                            <span className="text-6xl animate-bounce" style={{ animationDelay: '0.4s' }}>🐈</span>
                        </div>
                        <Button onClick={startGame} className="w-full text-xl py-4 shadow-lg">Start Game</Button>
                    </Card>
                )}

                {/* Active Game */}
                {gameState === 'ACTIVE' && (
                    <motion.div
                        layout
                        className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-2xl px-4"
                    >
                        <AnimatePresence mode='popLayout'>
                            {options.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layoutId={item.id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelect(item)}
                                    className={clsx(
                                        "relative rounded-3xl overflow-hidden aspect-square cursor-pointer shadow-lg hover:shadow-2xl transition-all bg-white border-b-8 border-gray-100",
                                        feedback?.id === item.id && feedback.type === 'error' && "ring-8 ring-red-400 border-red-400",
                                        feedback?.id === item.id && feedback.type === 'success' && "ring-8 ring-green-400 border-green-400"
                                    )}
                                >
                                    <div className="w-full h-full p-4 flex items-center justify-center">
                                        <img src={item.image} alt={item.label} className="w-full h-full object-contain" />
                                    </div>

                                    {feedback?.id === item.id && (
                                        <div className={clsx(
                                            "absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm",
                                            feedback.type === 'success' ? "text-green-400" : "text-red-400"
                                        )}>
                                            {feedback.type === 'success' ? <Check size={80} strokeWidth={4} /> : <X size={80} strokeWidth={4} />}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </GameShell>
    );
}
