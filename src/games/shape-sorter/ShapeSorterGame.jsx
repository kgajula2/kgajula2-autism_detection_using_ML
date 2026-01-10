import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameShell } from '../../components/game/GameShell';
import { createGameSession, endGameSession, logRoundMetrics } from '../../services/db';
import { analyzeUserPerformance } from '../../services/ml';
import { getAuth } from 'firebase/auth';
import GameTutorial from '../../components/game/GameTutorial';
import { soundService } from '../../services/sound';

/**
 * Shape Sorter Game
 * Purpose: Pattern recognition & fine motor skills (ASD markers: A3, A4)
 * 
 * Metrics tracked:
 * - dragDuration: Time taken to drag shape
 * - accuracy: Correct matches / total attempts
 * - averageMatchTime: Average time per successful match
 * - persistence: Retries after failure
 */

// Game configuration
const SHAPES = [
    { id: 'circle', emoji: '🔴', color: 'from-red-400 to-red-600', holeColor: 'border-red-400' },
    { id: 'square', emoji: '🟦', color: 'from-blue-400 to-blue-600', holeColor: 'border-blue-400' },
    { id: 'triangle', emoji: '🔺', color: 'from-yellow-400 to-yellow-600', holeColor: 'border-yellow-400' },
];

const TOTAL_ROUNDS = 5;

export default function ShapeSorterGame() {
    const [gameState, setGameState] = useState('TUTORIAL'); // TUTORIAL, ACTIVE, FINISHED
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [currentShape, setCurrentShape] = useState(null);
    const [targetHole, setTargetHole] = useState(null);
    const [dragStartTime, setDragStartTime] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [shapePosition, setShapePosition] = useState({ x: 0, y: 0 });
    const [showSuccess, setShowSuccess] = useState(false);
    const [showWrong, setShowWrong] = useState(false);

    // Metrics
    const metricsRef = useRef({
        dragTimes: [],
        correctMatches: 0,
        wrongAttempts: 0,
        retries: 0,
        startTime: 0,
    });

    const containerRef = useRef(null);

    // Initialize game
    const startGame = async () => {
        const userId = getAuth().currentUser?.uid;
        if (userId) {
            try {
                const sid = await createGameSession(userId, 'shape-sorter', {});
                setSessionId(sid);
            } catch (e) {
                console.error('Failed to create session:', e);
            }
        }

        metricsRef.current = {
            dragTimes: [],
            correctMatches: 0,
            wrongAttempts: 0,
            retries: 0,
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

        // Pick random shape (only 2 for toddlers)
        const availableShapes = SHAPES.slice(0, 2);
        const shape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
        setCurrentShape(shape);
        setTargetHole(shape);
        setShapePosition({ x: 0, y: 0 });
        setRound(r => r + 1);
    }, [round]);

    // Handle drag start
    const handleDragStart = () => {
        setIsDragging(true);
        setDragStartTime(Date.now());
        soundService.play('pop');
    };

    // Handle drag
    const handleDrag = (e, info) => {
        setShapePosition({ x: info.offset.x, y: info.offset.y });
    };

    // Handle drop
    const handleDragEnd = (e, info) => {
        setIsDragging(false);
        const dragDuration = Date.now() - dragStartTime;

        // Check if dropped on correct hole
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const dropX = info.point.x;
        const dropY = info.point.y;

        // Find target hole position (center of screen, bottom area)
        const holeY = containerRect.top + containerRect.height * 0.7;
        const holeX = containerRect.left + containerRect.width / 2;

        const distance = Math.sqrt(Math.pow(dropX - holeX, 2) + Math.pow(dropY - holeY, 2));
        const isCorrect = distance < 100 && currentShape.id === targetHole.id;

        if (isCorrect) {
            // Success!
            metricsRef.current.correctMatches++;
            metricsRef.current.dragTimes.push(dragDuration);
            setScore(s => s + 10);
            setShowSuccess(true);
            soundService.play('success');

            // Log metrics
            if (sessionId) {
                logRoundMetrics(sessionId, {
                    game: 'shape-sorter',
                    round,
                    dragDuration,
                    correct: true,
                    shape: currentShape.id,
                });
            }

            setTimeout(() => {
                setShowSuccess(false);
                nextRound();
            }, 800);
        } else {
            // Wrong drop
            metricsRef.current.wrongAttempts++;
            metricsRef.current.retries++;
            setShowWrong(true);
            soundService.play('error');

            setTimeout(() => {
                setShowWrong(false);
                setShapePosition({ x: 0, y: 0 });
            }, 500);
        }
    };

    // Finish game and analyze
    const finishGame = async () => {
        setGameState('FINISHED');
        setIsAnalyzing(true);

        const metrics = metricsRef.current;
        const avgDragTime = metrics.dragTimes.length > 0
            ? metrics.dragTimes.reduce((a, b) => a + b, 0) / metrics.dragTimes.length
            : 0;
        const totalTime = (Date.now() - metrics.startTime) / 1000;
        const accuracy = metrics.correctMatches / (metrics.correctMatches + metrics.wrongAttempts) || 0;

        const finalStats = {
            correctMatches: metrics.correctMatches,
            wrongAttempts: metrics.wrongAttempts,
            averageDragTime: Math.round(avgDragTime),
            accuracy: Math.round(accuracy * 100),
            persistence: metrics.retries,
            totalTime: Math.round(totalTime),
        };

        // End session
        if (sessionId) {
            try {
                await endGameSession(sessionId, score, finalStats);
            } catch (e) {
                console.error('Failed to end session:', e);
            }
        }

        // ML Analysis
        try {
            const result = await analyzeUserPerformance({
                'shape-sorter': {
                    score,
                    accuracy,
                    avgDragTime,
                    wrongAttempts: metrics.wrongAttempts,
                    persistence: metrics.retries,
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
                className="text-6xl"
                animate={{ x: [0, 50, 50], y: [0, 50, 50] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                🔴
            </motion.div>
            <motion.div
                className="w-20 h-20 border-4 border-dashed border-red-400 rounded-xl flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
            >
                <span className="text-2xl">⭕</span>
            </motion.div>
        </div>
    );

    return (
        <GameShell
            title="🔵 Shape Sorter"
            gameState={gameState}
            score={score}
            progress={(round / TOTAL_ROUNDS) * 100}
            headerColor="bg-gradient-to-r from-blue-500 to-purple-500"
            onPlayAgain={() => {
                setGameState('TUTORIAL');
                setAnalysisResult(null);
            }}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            stats={[
                { label: 'Matches', value: metricsRef.current.correctMatches },
                { label: 'Accuracy', value: `${Math.round((metricsRef.current.correctMatches / (metricsRef.current.correctMatches + metricsRef.current.wrongAttempts || 1)) * 100)}%` },
                { label: 'Round', value: `${round}/${TOTAL_ROUNDS}` },
            ]}
        >
            {/* Tutorial */}
            {gameState === 'TUTORIAL' && (
                <GameTutorial
                    type="drag"
                    title="🔵"
                    subtitle="Drag to hole!"
                    targetElement={tutorialElement}
                    onComplete={startGame}
                />
            )}

            {/* Game Area */}
            {gameState === 'ACTIVE' && currentShape && (
                <div
                    ref={containerRef}
                    className="flex flex-col items-center justify-between h-[60vh] py-8"
                >
                    {/* Draggable Shape */}
                    <motion.div
                        drag
                        dragConstraints={{ left: -200, right: 200, top: -100, bottom: 300 }}
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        animate={showSuccess ? { scale: [1, 1.3, 0] } : showWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
                        className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${currentShape.color} shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing z-20`}
                        whileDrag={{ scale: 1.1, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                        style={{ x: shapePosition.x, y: shapePosition.y }}
                    >
                        <span className="text-6xl drop-shadow-lg">{currentShape.emoji}</span>
                    </motion.div>

                    {/* Arrow indicator */}
                    <motion.div
                        className="text-5xl"
                        animate={{ y: [0, 20, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    >
                        ⬇️
                    </motion.div>

                    {/* Target Hole */}
                    <motion.div
                        className={`w-36 h-36 border-8 border-dashed ${targetHole.holeColor} rounded-3xl flex items-center justify-center bg-white/30 backdrop-blur-sm`}
                        animate={isDragging ? { scale: [1, 1.1, 1], borderWidth: ['8px', '12px', '8px'] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <span className="text-5xl opacity-50">{targetHole.emoji}</span>
                    </motion.div>

                    {/* Success Burst */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 2, opacity: [1, 0] }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <span className="text-8xl">🎉</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </GameShell>
    );
}
