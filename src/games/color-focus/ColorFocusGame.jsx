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

const { GAME_DURATION, SPAWN_RATE, BUBBLE_SIZE_MIN, BUBBLE_SIZE_MAX, BUBBLE_SPEED_BASE, BUBBLE_SPEED_VARIANCE, SPEED_INCREASE_PER_ROUND } = COLOR_FOCUS_CONFIG;

export default function ColorFocusGame() {
    const {
        gameState, score, round,
        setGameState, incrementScore, nextRound, resetGame
    } = useGameStore();

    const [bubbles, setBubbles] = useState([]);
    const [targetColor, setTargetColor] = useState(COLORS[0]);
    const [spawnRate, setSpawnRate] = useState(SPAWN_RATE);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [mistakes, setMistakes] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const lastSpawnRef = useRef(0);
    const containerRef = useRef(null);
    const latenciesRef = useRef([]);

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
        if (now - lastSpawnRef.current > spawnRate) {
            spawnBubble();
            lastSpawnRef.current = now;
        }

        // Move Bubbles
        setBubbles(prev => prev.map(b => ({
            ...b,
            y: b.y - (b.speed * deltaTime * 60)
        })).filter(b => b.y > -50));
    }, [targetColor, spawnRate, gameState]);

    const spawnBubble = () => {
        if (!containerRef.current) return;
        const { width } = containerRef.current.getBoundingClientRect();

        const id = generateUniqueId();
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const size = Math.random() * (BUBBLE_SIZE_MAX - BUBBLE_SIZE_MIN) + BUBBLE_SIZE_MIN;
        const x = Math.random() * (width - size);
        const speed = Math.random() * BUBBLE_SPEED_VARIANCE + BUBBLE_SPEED_BASE + (round * SPEED_INCREASE_PER_ROUND);

        setBubbles(prev => [...prev, { id, x, y: 600, size, color, speed, spawnTime: Date.now() }]);
    };

    const handlePop = (id, colorName, spawnTime) => {
        if (gameState !== 'ACTIVE') return;

        setBubbles(prev => {
            const exists = prev.find(b => b.id === id);
            if (!exists) return prev;
            return prev.filter(b => b.id !== id);
        });

        const isCorrect = colorName === targetColor.name;

        if (sessionId) {
            logRoundMetrics(sessionId, {
                type: 'interaction',
                game: 'color-focus',
                action: 'pop',
                target: targetColor.name,
                popped: colorName,
                correct: isCorrect,
                timestamp: Date.now()
            });
        }

        if (isCorrect) {
            incrementScore(10);
            const latency = Date.now() - spawnTime;
            latenciesRef.current.push(latency);
        } else {
            incrementScore(-5);
            setMistakes(m => m + 1);
        }
    };

    const startGame = async () => {
        resetGame();
        latenciesRef.current = [];
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
                    riskScore: result.riskScore,
                    aiInsights: result.aiInsights,
                    gameRisks: result.gameRisks
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
                {/* Pre-game Instructions */}
                <div className="mb-4 z-10 text-center relative w-full flex justify-center">
                    {gameState === 'IDLE' && (
                        <Card className="p-8 max-w-md bg-white/90 z-20 shadow-xl">
                            <Title className="mb-4 text-blue-600">Color Focus</Title>
                            <p className="mb-6 text-gray-600">
                                Pop only the{' '}
                                <strong
                                    className="px-2 py-1 rounded bg-gray-100 border border-gray-200"
                                    style={{ color: targetColor.hex }}
                                >
                                    {targetColor.name}
                                </strong>{' '}
                                bubbles! Be quick, you have {GAME_DURATION} seconds.
                            </p>
                            <Button onClick={startGame} className="w-full text-lg shadow-lg hover:shadow-xl transition-all">
                                Start Game
                            </Button>
                        </Card>
                    )}

                    {gameState === 'ACTIVE' && (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-lg font-bold bg-white/80 px-4 py-1 rounded-full shadow-sm backdrop-blur">
                                Target Color
                            </span>
                            <div
                                className={clsx(
                                    "w-16 h-16 rounded-full shadow-lg border-4 border-white animate-pulse transition-colors duration-300",
                                    targetColor.bg
                                )}
                            />
                        </div>
                    )}
                </div>

                {/* Game Area */}
                <div
                    ref={containerRef}
                    className="relative w-full max-w-2xl h-[60vh] border border-gray-200 rounded-3xl overflow-hidden bg-gradient-to-b from-blue-50 via-purple-50/30 to-white shadow-inner"
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
