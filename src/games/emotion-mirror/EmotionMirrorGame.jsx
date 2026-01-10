import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useGameLoop } from '../../hooks/useGameLoop';
import { initializeFaceMesh, stopVision } from '../../services/vision';
import { Card } from '../../components/ui/Card';
import { Title, SubTitle } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { GameShell } from '../../components/game/GameShell';
import { logRoundMetrics, createGameSession, endGameSession } from '../../services/db';
import { analyzeUserPerformance } from '../../services/ml';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { EMOTION_TARGETS, EXPRESSION_THRESHOLDS, EMOTION_MIRROR_CONFIG } from '../../config/gameConfig';
import GameTutorial, { TutorialConfigs } from '../../components/game/GameTutorial';

const { MAX_ROUNDS, HOLD_TIME_REQUIRED } = EMOTION_MIRROR_CONFIG;

export default function EmotionMirrorGame() {
    const videoRef = useRef(null);
    const [streamActive, setStreamActive] = useState(false);
    const { gameState, score, setGameState, incrementScore, resetGame } = useGameStore();

    const [currentTarget, setCurrentTarget] = useState(EMOTION_TARGETS[0]);
    const [detection, setDetection] = useState('none');
    const [holdProgress, setHoldProgress] = useState(0);
    const [debugInfo, setDebugInfo] = useState({});

    const [roundCount, setRoundCount] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showTutorial, setShowTutorial] = useState(true);

    const stateRef = useRef({
        target: EMOTION_TARGETS[0],
        holdTime: 0,
        requiredTime: HOLD_TIME_REQUIRED,
        lastFrame: 0,
        startTime: 0,
    });

    useEffect(() => {
        if (gameState === 'ACTIVE') {
            const startCamera = async () => {
                try {
                    await initializeFaceMesh(videoRef.current, onResults);
                    setStreamActive(true);
                } catch (err) {
                    console.error("Camera init failed", err);
                }
            };
            startCamera();
        }

        return () => {
            stopVision();
        };
    }, [gameState]);

    // Game loop for hold detection
    useGameLoop((deltaTime) => {
        if (gameState !== 'ACTIVE') return;

        if (detection === stateRef.current.target.id) {
            stateRef.current.holdTime += deltaTime * 1000;
            const progress = Math.min((stateRef.current.holdTime / stateRef.current.requiredTime) * 100, 100);
            setHoldProgress(progress);

            if (stateRef.current.holdTime >= stateRef.current.requiredTime) {
                handleSuccess();
            }
        } else {
            stateRef.current.holdTime = Math.max(0, stateRef.current.holdTime - deltaTime * 500);
            setHoldProgress((stateRef.current.holdTime / stateRef.current.requiredTime) * 100);
        }
    }, [detection, gameState]);

    const onResults = (results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setDetection('none');
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];
        const { expression, debug } = classifyExpression(landmarks);
        setDetection(expression);
        setDebugInfo(debug);
    };

    const classifyExpression = (landmarks) => {
        const top = landmarks[10];
        const bottom = landmarks[152];
        const height = Math.abs(top.y - bottom.y);

        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        const mouthOpen = Math.abs(upperLip.y - lowerLip.y) / height;

        const leftMouth = landmarks[61];
        const rightMouth = landmarks[291];
        const mouthWidth = Math.abs(leftMouth.x - rightMouth.x) / height;

        const mouthCornerY = (leftMouth.y + rightMouth.y) / 2;
        const upperLipY = upperLip.y;
        const smileCurve = (upperLipY - mouthCornerY) / height;

        const leftBrow = landmarks[105];
        const leftEye = landmarks[159];
        const browLift = Math.abs(leftBrow.y - leftEye.y) / height;

        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];
        const cheekWidth = Math.abs(leftCheek.x - rightCheek.x) / height;

        let detected = 'unknown';
        let confidence = 0;

        const thresholds = EXPRESSION_THRESHOLDS;

        // SURPRISE
        if (mouthOpen > thresholds.surprise.mouthOpen && browLift > thresholds.surprise.browLift) {
            detected = 'surprise';
            confidence = Math.min(1, (mouthOpen / 0.08) * 0.5 + (browLift / 0.05) * 0.5);
        }
        // SMILE
        else if (smileCurve > thresholds.smile.smileCurve || mouthWidth > thresholds.smile.mouthWidth || cheekWidth > thresholds.smile.cheekWidth) {
            detected = 'smile';
            confidence = Math.min(1, Math.max(smileCurve / 0.02, (mouthWidth - 0.28) / 0.12));
        }
        // NEUTRAL
        else if (mouthWidth < thresholds.neutral.mouthWidth && mouthOpen < thresholds.neutral.mouthOpen && Math.abs(smileCurve) < thresholds.neutral.smileCurve) {
            detected = 'neutral';
            confidence = 1 - (mouthOpen / 0.04);
        }

        return {
            expression: detected,
            confidence,
            debug: { mouthOpen, mouthWidth, smileCurve, browLift, cheekWidth }
        };
    };

    const handleSuccess = () => {
        incrementScore(15);
        stateRef.current.holdTime = 0;
        setHoldProgress(0);

        const nextRound = roundCount + 1;
        setRoundCount(nextRound);

        if (nextRound >= MAX_ROUNDS) {
            stopVision();
            handleGameOver();
            return;
        }

        const nextTarget = EMOTION_TARGETS[Math.floor(Math.random() * EMOTION_TARGETS.length)];
        setCurrentTarget(nextTarget);
        stateRef.current.target = nextTarget;

        if (sessionId) {
            logRoundMetrics(sessionId, {
                game: 'emotion-mirror',
                action: 'success',
                target: stateRef.current.target.id,
                timestamp: Date.now()
            });
        }
    };

    const handleGameOver = async () => {
        setGameState('COMPLETED');
        setIsAnalyzing(true);

        const duration = (Date.now() - stateRef.current.startTime) / 1000;

        if (sessionId) {
            await endGameSession(sessionId, score, { rounds: MAX_ROUNDS, duration });
        }

        const gameData = {
            'emotion-mirror': { score, attempts: MAX_ROUNDS, duration }
        };

        try {
            const result = await analyzeUserPerformance(gameData);
            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const startGame = async () => {
        try {
            resetGame();
            setRoundCount(0);
            setAnalysisResult(null);
            setCurrentTarget(EMOTION_TARGETS[0]);
            setShowTutorial(true);
            stateRef.current = {
                target: EMOTION_TARGETS[0],
                holdTime: 0,
                requiredTime: HOLD_TIME_REQUIRED,
                lastFrame: performance.now(),
                startTime: Date.now()
            };

            const userId = getAuth().currentUser?.uid;
            if (userId) {
                const sid = await createGameSession(userId, 'emotion-mirror', { maxRounds: MAX_ROUNDS });
                setSessionId(sid);
            }

            setGameState('ACTIVE');
        } catch (e) {
            console.error("Failed to start emotion session", e);
            setGameState('ACTIVE');
        }
    };

    const getStats = () => {
        const duration = stateRef.current.startTime
            ? ((Date.now() - stateRef.current.startTime) / 1000).toFixed(1)
            : '0';
        return [
            { label: 'Rounds', value: roundCount },
            { label: 'Time', value: `${duration}s` },
        ];
    };

    return (
        <GameShell
            title="Emotion Mirror"
            score={score}
            gameState={gameState}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            stats={getStats()}
            onPlayAgain={startGame}
            headerColor="bg-purple-600"
        >
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 gap-6">

                {/* Tutorial Overlay */}
                <AnimatePresence>
                    {gameState === 'ACTIVE' && showTutorial && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center">
                            <GameTutorial
                                {...TutorialConfigs.emotionMirror}
                                onComplete={() => setShowTutorial(false)}
                            />
                        </div>
                    )}
                </AnimatePresence>

                {/* Round Counter */}
                {gameState === 'ACTIVE' && (
                    <div className="flex items-center gap-4">
                        <div className="text-xl font-bold text-gray-400">Round {roundCount + 1} / {MAX_ROUNDS}</div>
                        <Card className="!p-3 bg-red-100/50 border-red-200">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${streamActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                                <span className="text-xs font-bold text-red-800">LIVE</span>
                            </div>
                        </Card>
                    </div>
                )}

                {gameState === 'IDLE' && (
                    <Card glass className="p-10 text-center max-w-lg mt-10 shadow-2xl">
                        <Title>Emotion Mirror</Title>
                        <SubTitle className="mb-8 font-light text-2xl">Copy the face! 😐😊😮</SubTitle>
                        <div className="flex gap-4 justify-center mb-10">
                            <span className="text-6xl animate-bounce" style={{ animationDelay: '0s' }}>😊</span>
                            <span className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>😮</span>
                            <span className="text-6xl animate-bounce" style={{ animationDelay: '0.4s' }}>😐</span>
                        </div>
                        <Button onClick={startGame} className="w-full text-xl py-6 shadow-xl">
                            <Camera size={28} className="mr-3" /> Start Camera
                        </Button>
                    </Card>
                )}

                {gameState === 'ACTIVE' && (
                    <div className="flex flex-col md:flex-row gap-8 items-center w-full">
                        {/* Video Feed */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg aspect-[4/3] bg-black border-4 border-white dark:border-slate-600">
                            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" />

                            {/* Progress Bar - Large & Clear */}
                            <div className="absolute bottom-6 left-6 right-6 h-6 bg-gray-700/50 rounded-full backdrop-blur overflow-hidden border-2 border-white/20">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-green-400 to-green-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${holdProgress}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>

                            {/* Detected Status Pill */}
                            <div className="absolute top-6 right-6">
                                <div className="bg-black/60 text-white px-4 py-2 rounded-full text-lg backdrop-blur font-bold border border-white/10">
                                    {detection === 'none' ? '...' : detection === 'unknown' ? '?' : detection.toUpperCase()}
                                </div>
                            </div>
                        </div>

                        {/* Target Display - Massive for Kids */}
                        <div className="flex flex-col items-center justify-center gap-4 min-w-[200px]">
                            <motion.div
                                key={currentTarget.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white dark:bg-slate-800 rounded-[2rem] p-10 shadow-2xl flex flex-col items-center gap-6 border-4 border-purple-100 dark:border-purple-900/50"
                            >
                                <currentTarget.icon size={120} className={currentTarget.color} />
                                {/* Large Emoji or Icon Representation */}
                            </motion.div>
                            <h2 className={`text-4xl font-black tracking-wider ${currentTarget.color}`}>{currentTarget.label}</h2>
                        </div>
                    </div>
                )}
            </div>
        </GameShell>
    );
}
