import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useGameLoop } from '../../hooks/useGameLoop';
import { Button } from '../../components/ui/Button';
import { Title } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { GameShell } from '../../components/game/GameShell';
import { clsx } from 'clsx';
import { logRoundMetrics, createGameSession, endGameSession } from '../../services/db';
import { analyzeUserPerformance } from '../../services/ml';
import { getAuth } from 'firebase/auth';
import { generateUniqueId } from '../../utils/utils';
import { COLORS, COLOR_FOCUS_CONFIG } from '../../config/gameConfig';
import { soundService } from '../../services/sound';
import GameTutorial, { TutorialConfigs } from '../../components/game/GameTutorial';

const { GAME_DURATION, SPAWN_RATE, BUBBLE_SIZE_MIN, BUBBLE_SIZE_MAX, BUBBLE_SPEED_BASE, BUBBLE_SPEED_VARIANCE, SPEED_INCREASE_PER_ROUND } = COLOR_FOCUS_CONFIG;

export default function ColorFocusGame() {
    const {
        gameState, score, round,
        setGameState, incrementScore, resetGame
    } = useGameStore();

    const [bubbles, setBubbles] = useState([]);
    const [targetColor, setTargetColor] = useState(COLORS[0]);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [mistakes, setMistakes] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);

    // Child-friendly constraints
    const MIN_BUBBLE_SIZE = 60; // Increased from 35/50 for small fingers

    const lastSpawnRef = useRef(0);
    const containerRef = useRef(null);
    const latenciesRef = useRef([]);
    const bubblePopDataRef = useRef([]); // Store all bubble pop details for dashboard

    // Timer Effect
    useEffect(() => {
        let interval;
        if (gameState === 'ACTIVE' && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        finishGame();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, timeLeft]);

    // Game Loop
    useGameLoop((deltaTime) => {
        if (gameState !== 'ACTIVE') return;

        const now = performance.now();

        // Spawn Bubbles
        if (now - lastSpawnRef.current > SPAWN_RATE) {
            spawnBubble();
            lastSpawnRef.current = now;
        }

        // Move Bubbles
        setBubbles(prev => prev.map(b => ({
            ...b,
            y: b.y - (b.speed * deltaTime * 60)
        })).filter(b => b.y > -50));
    }, [targetColor, gameState]);

    const spawnBubble = () => {
        if (!containerRef.current) return;
        const { width } = containerRef.current.getBoundingClientRect();

        const id = generateUniqueId();
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        // Use larger minimum size for child friendliness
        const size = Math.random() * (BUBBLE_SIZE_MAX - MIN_BUBBLE_SIZE) + MIN_BUBBLE_SIZE;
        const x = Math.random() * (width - size);
        const speed = Math.random() * BUBBLE_SPEED_VARIANCE + BUBBLE_SPEED_BASE + (round * SPEED_INCREASE_PER_ROUND);

        setBubbles(prev => [...prev, { id, x, y: 600, size, color, speed, spawnTime: Date.now() }]);
    };

    const handlePop = (id, colorName, spawnTime) => {
        if (gameState !== 'ACTIVE') return;

        const popTime = Date.now();
        const lifespan = popTime - spawnTime; // Time from spawn to pop in ms

        setBubbles(prev => {
            const exists = prev.find(b => b.id === id);
            if (!exists) return prev;
            return prev.filter(b => b.id !== id);
        });

        const isCorrect = colorName === targetColor.name;

        // Log detailed bubble lifespan data to Firebase
        if (sessionId) {
            logRoundMetrics(sessionId, {
                type: 'bubble_interaction',
                game: 'color-focus',
                bubbleId: id,
                action: 'pop',
                targetColor: targetColor.name,
                poppedColor: colorName,
                correct: isCorrect,
                // Detailed timestamp tracking
                birthTime: spawnTime,      // When bubble spawned
                deathTime: popTime,        // When bubble was popped
                lifespan: lifespan,        // Time alive (ms)
                reactionTime: lifespan,    // Alias for clarity
                timestamp: popTime
            });
        }

        // Store detailed bubble data for dashboard (ALL pops, not just correct)
        bubblePopDataRef.current.push({
            bubbleId: id,
            correct: isCorrect,
            reactionTime: lifespan,
            targetColor: targetColor.name,
            poppedColor: colorName,
            timestamp: popTime
        });

        if (isCorrect) {
            incrementScore(10);
            latenciesRef.current.push(lifespan);
            soundService.pop(); // Play pop sound
        } else {
            incrementScore(-5);
            setMistakes(m => m + 1);
            soundService.error(); // Play error sound
        }
    };

    const startGame = async () => {
        resetGame();
        latenciesRef.current = [];
        bubblePopDataRef.current = []; // Reset bubble data
        setBubbles([]);
        setTimeLeft(GAME_DURATION);
        setMistakes(0);
        setAnalysisResult(null);
        setGameState('ACTIVE');
        setTargetColor(COLORS[Math.floor(Math.random() * COLORS.length)]);

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.error("No user logged in - session will not be saved");
            return;
        }

        try {
            const sid = await createGameSession(user.uid, 'color-focus', { duration: GAME_DURATION });
            setSessionId(sid);
        } catch (e) {
            console.error("Failed to start session", e);
        }
    };

    const finishGame = async () => {
        setGameState('COMPLETED');
        setIsAnalyzing(true);

        const avgLatency = latenciesRef.current.length > 0
            ? latenciesRef.current.reduce((a, b) => a + b, 0) / latenciesRef.current.length
            : 0;

        const gameData = {
            'color-focus': {
                score,
                errors: mistakes,
                duration: GAME_DURATION - timeLeft,
                avgLatency
            }
        };

        try {
            const result = await analyzeUserPerformance(gameData);
            setAnalysisResult(result);

            if (sessionId) {
                await endGameSession(sessionId, score, {
                    mistakes,
                    duration: GAME_DURATION - timeLeft,
                    avgLatency,
                    riskScore: result.riskScore,
                    aiInsights: result.aiInsights,
                    gameRisks: result.gameRisks,
                    // Include bubble lifespan data for dashboard
                    roundTimings: bubblePopDataRef.current,
                    bubblesPoppedCorrectly: latenciesRef.current.length,
                    allLatencies: latenciesRef.current
                });
            }
        } catch (e) {
            console.error("Analysis Failed", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Calculate stats for the modal
    const getStats = () => {
        const avgLatency = latenciesRef.current.length > 0
            ? Math.round(latenciesRef.current.reduce((a, b) => a + b, 0) / latenciesRef.current.length)
            : 0;

        const accuracy = score > 0 ? (score / (score + (mistakes * 5) || 1) * 10).toFixed(1) : '0';

        return [
            { label: 'Mistakes', value: mistakes },
            { label: 'Accuracy', value: accuracy },
            { label: 'Latency', value: avgLatency > 0 ? `${avgLatency}ms` : '-' },
        ];
    };

    return (
        <GameShell
            title="Color Focus"
            score={score}
            timeLeft={gameState === 'ACTIVE' ? timeLeft : null}
            mistakes={mistakes}
            gameState={gameState}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            stats={getStats()}
            onPlayAgain={startGame}
            headerColor="bg-blue-600"
        >
            <div className="flex flex-col items-center w-full">
                {/* Pre-game Instructions / Start Screen */}
                {gameState === 'IDLE' && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl">
                        {showTutorial ? (
                            <GameTutorial
                                {...TutorialConfigs.colorFocus}
                                onComplete={() => {
                                    setShowTutorial(false);
                                    setGameState('ACTIVE');
                                    spawnBubble();
                                }}
                            />
                        ) : (
                            <Card className="p-8 max-w-sm w-full flex flex-col items-center gap-6 shadow-2xl animate-in scale-95 duration-200">
                                <Title className="text-blue-600">Color Focus</Title>
                                <p className="text-center text-gray-600 dark:text-gray-300">
                                    Pop only the <strong style={{ color: targetColor.hex }}>{targetColor.name}</strong> bubbles!
                                </p>
                                <div className="text-6xl animate-bounce">🎈</div>
                                <Button
                                    onClick={() => {
                                        setGameState('ACTIVE');
                                        spawnBubble();
                                    }}
                                    className="w-full text-lg shadow-lg hover:shadow-xl transition-all"
                                >
                                    Start Game
                                </Button>
                            </Card>
                        )}
                    </div>
                )}

                {/* Game Area Header (Active State) */}
                {gameState === 'ACTIVE' && (
                    <div className="flex flex-col items-center gap-2 mb-4 z-20">
                        <span className="text-lg font-bold bg-white/80 dark:bg-slate-800/80 text-gray-800 dark:text-white px-4 py-1 rounded-full shadow-sm backdrop-blur">
                            Target Color
                        </span>
                        <div className="flex items-center gap-3">
                            <div
                                className={clsx(
                                    "w-16 h-16 rounded-full shadow-lg border-4 border-white dark:border-slate-600 animate-pulse transition-colors duration-300",
                                    targetColor.bg
                                )}
                            />
                            <span className="text-3xl font-black transition-colors duration-300" style={{ color: targetColor.hex }}>
                                {targetColor.name}
                            </span>
                        </div>
                    </div>
                )}

                {/* Game Container */}
                <div
                    ref={containerRef}
                    className="relative w-full max-w-2xl h-[60vh] border border-gray-200 dark:border-slate-600 rounded-3xl overflow-hidden bg-gradient-to-b from-blue-50 via-purple-50/30 to-white dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 shadow-inner"
                >
                    <AnimatePresence mode="popLayout">
                        {bubbles.map(bubble => (
                            <motion.div
                                key={bubble.id}
                                initial={{ scale: 0, opacity: 0, rotate: -10 }}
                                animate={{
                                    y: bubble.y,
                                    x: bubble.x,
                                    scale: [1, 1.05, 1],
                                    opacity: 1,
                                    rotate: [0, 3, -3, 0],
                                }}
                                exit={{
                                    scale: [1, 1.4, 0],
                                    opacity: [1, 1, 0],
                                    filter: ["blur(0px)", "blur(0px)", "blur(8px)"],
                                }}
                                transition={{
                                    scale: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
                                    rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                    exit: { duration: 0.3, ease: "easeOut" }
                                }}
                                whileHover={{
                                    scale: 1.15,
                                    boxShadow: `0 0 30px ${bubble.color.hex}`,
                                    transition: { duration: 0.15 }
                                }}
                                whileTap={{ scale: 0.9 }}
                                className={clsx(
                                    "absolute rounded-full cursor-pointer border-4 border-white/50",
                                    bubble.color.bg
                                )}
                                style={{
                                    width: bubble.size,
                                    height: bubble.size,
                                    top: 0,
                                    left: 0,
                                    boxShadow: `0 8px 32px ${bubble.color.hex}66, inset 0 -8px 20px rgba(0,0,0,0.15), inset 0 8px 20px rgba(255,255,255,0.4)`,
                                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 20%, ${bubble.color.hex} 60%)`,
                                    touchAction: 'none'
                                }}
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    handlePop(bubble.id, bubble.color.name, bubble.spawnTime);
                                }}
                            >
                                <motion.div
                                    className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full bg-white/70"
                                    style={{ filter: "blur(2px)" }}
                                    animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <div
                                    className="absolute top-[45%] left-[55%] w-[10%] h-[10%] rounded-full bg-white/50"
                                    style={{ filter: "blur(1px)" }}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Floating particles background */}
                    {gameState === 'ACTIVE' && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={`particle-${i}`}
                                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-300 to-purple-300 opacity-40"
                                    initial={{ x: Math.random() * 100 + '%', y: '110%', scale: Math.random() * 0.5 + 0.5 }}
                                    animate={{ y: '-10%', x: `${Math.random() * 100}%` }}
                                    transition={{
                                        duration: Math.random() * 8 + 6,
                                        repeat: Infinity,
                                        delay: i * 0.8,
                                        ease: "linear"
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </GameShell>
    );
}
