import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Title, SubTitle } from '../../components/ui/Typography';
import { GameShell } from '../../components/game/GameShell';
import { logRoundMetrics, createGameSession, endGameSession } from '../../services/db';
import { analyzeUserPerformance } from '../../services/ml';
import clsx from 'clsx';
import { CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { ROUTINES, ROUTINE_ICONS, MASCOT } from '../../config/gameConfig';
import { shuffle } from '../../utils/utils';
import GameTutorial, { TutorialConfigs } from '../../components/game/GameTutorial';

export default function RoutineSequencerGame() {
    const { gameState, score, setGameState, incrementScore, resetGame } = useGameStore();
    const [currentRoutine, setCurrentRoutine] = useState(null);
    const [shuffledSteps, setShuffledSteps] = useState([]);
    const [filledSlots, setFilledSlots] = useState([]);
    const [mistakes, setMistakes] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const startTimeRef = useRef(0);
    const stepStartTimeRef = useRef(0);  // Track each step start time
    const stepTimingsRef = useRef([]);   // Store all step timings
    const [showTutorial, setShowTutorial] = useState(true);

    const handleReset = () => {
        resetGame();
        setFilledSlots([]);
        setShuffledSteps([]);
        setCurrentRoutine(null);
        setAnalysisResult(null);
        setSessionId(null);
        setShowTutorial(true);
        setFeedback(null);
    };

    const selectRoutine = async (routine) => {
        // Prepare steps with resolved icons and GIFs
        const stepsWithIcons = routine.steps.map(step => ({
            ...step,
            icon: ROUTINE_ICONS[step.iconName]
        }));

        setCurrentRoutine({ ...routine, steps: stepsWithIcons });
        setShuffledSteps(shuffle(stepsWithIcons));
        setFilledSlots(new Array(routine.steps.length).fill(null));
        setMistakes(0);
        setFeedback(null);
        startTimeRef.current = Date.now();
        stepStartTimeRef.current = Date.now();
        stepTimingsRef.current = [];

        const userId = getAuth().currentUser?.uid;
        if (userId) {
            try {
                const sid = await createGameSession(userId, 'routine-sequencer', { routine: routine.id });
                setSessionId(sid);
            } catch (e) {
                console.error("Failed to create session", e);
            }
        }

        setGameState('ACTIVE');
    };

    const handleStepClick = (step) => {
        if (gameState !== 'ACTIVE' || feedback === 'success') return;

        const firstEmptyIndex = filledSlots.findIndex(slot => slot === null);
        if (firstEmptyIndex === -1) return;

        const correctStep = currentRoutine.steps[firstEmptyIndex];
        const isCorrect = step.id === correctStep.id;

        if (isCorrect) {
            const stepTime = Date.now();
            const stepDuration = stepTime - stepStartTimeRef.current;

            // Store step timing data
            stepTimingsRef.current.push({
                step: firstEmptyIndex + 1,
                totalSteps: currentRoutine.steps.length,
                stepId: step.id,
                correct: true,
                reactionTime: stepDuration,
                timestamp: stepTime
            });

            // Reset timer for next step
            stepStartTimeRef.current = Date.now();

            const newSlots = [...filledSlots];
            newSlots[firstEmptyIndex] = step;
            setFilledSlots(newSlots);
            setShuffledSteps(prev => prev.filter(s => s.id !== step.id));

            if (firstEmptyIndex === currentRoutine.steps.length - 1) {
                completeRound();
            }
        } else {
            setMistakes(prev => prev + 1);
            setFeedback('error');
            incrementScore(-2);
            setTimeout(() => setFeedback(null), 500);

            if (sessionId) {
                logRoundMetrics(sessionId, {
                    game: 'routine-sequencer',
                    type: 'error',
                    routine: currentRoutine.id,
                    expected: correctStep.id,
                    actual: step.id,
                    timestamp: Date.now()
                });
            }
        }
    };

    const completeRound = async () => {
        setGameState('COMPLETED');
        setIsAnalyzing(true);
        incrementScore(20);

        const timeTaken = (Date.now() - startTimeRef.current) / 1000;

        if (sessionId) {
            await endGameSession(sessionId, score + 20, {
                mistakes,
                completed: true,
                duration: timeTaken,
                routine: currentRoutine.id,
                routineTitle: currentRoutine.title,
                totalSteps: currentRoutine.steps.length,
                roundTimings: stepTimingsRef.current  // Include step timings for dashboard
            });
        }

        try {
            const gameData = {
                'routine-sequencer': { score: score + 20, mistakes, completed: true, routine: currentRoutine.id, timeTaken }
            };
            const result = await analyzeUserPerformance(gameData);
            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getStats = () => {
        const duration = startTimeRef.current
            ? ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
            : '0';
        return [
            { label: 'Score', value: score },
            { label: 'Time', value: `${duration}s` },
            { label: 'Mistakes', value: mistakes },
        ];
    };

    return (
        <GameShell
            title="Routine Sequencer"
            score={score}
            mistakes={mistakes}
            gameState={gameState}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            stats={getStats()}
            onPlayAgain={handleReset}
            headerColor="bg-green-600"
        >
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
                {/* Mascot Helper */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-5xl animate-bounce">{MASCOT.emoji}</span>
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur px-4 py-2 rounded-2xl shadow-sm">
                        <span className="text-gray-700 dark:text-gray-200 font-medium">
                            {!currentRoutine ? "Hi! Pick a routine! 👆" : "Put them in order! 🎯"}
                        </span>
                    </div>
                </div>

                {/* Reset Button */}
                {currentRoutine && gameState === 'ACTIVE' && (
                    <div className="w-full flex justify-end mb-4">
                        <Button variant="neumorph" onClick={handleReset}>
                            <RefreshCcw size={20} />
                        </Button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {!currentRoutine ? (
                        /* Selection Screen - Using emoji GIFs */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full"
                            key="selection"
                        >
                            <div className="col-span-full text-center mb-4">
                                <Title>Daily Routines</Title>
                                <SubTitle>Tap a routine to practice!</SubTitle>
                            </div>

                            {ROUTINES.map((r, i) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card
                                        className="cursor-pointer hover:scale-105 transition-all border-2 border-transparent hover:border-green-400 flex flex-col items-center p-6 gap-4 min-h-[180px] bg-white dark:bg-slate-800"
                                        onClick={() => selectRoutine(r)}
                                    >
                                        {/* Large emoji */}
                                        <span className="text-5xl">{r.emoji}</span>
                                        <h3 className="text-lg font-bold text-center text-slate-800 dark:text-white">{r.title}</h3>
                                        {/* Step preview with GIFs */}
                                        <div className="flex gap-1 justify-center flex-wrap">
                                            {r.steps.slice(0, 4).map((s, idx) => (
                                                <span key={idx} className="text-xl">{s.emoji}</span>
                                            ))}
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        /* Game Screen */
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full grid grid-cols-1 md:grid-cols-2 gap-8"
                            key="game"
                        >
                            {/* Left: Slots (Timeline) */}
                            <div className="flex flex-col gap-4 items-center">
                                {/* Tutorial Overlay */}
                                <AnimatePresence>
                                    {showTutorial && (
                                        <GameTutorial
                                            {...TutorialConfigs.routineSequencer}
                                            title="Put in order!"
                                            onComplete={() => setShowTutorial(false)}
                                        />
                                    )}
                                </AnimatePresence>

                                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <span className="text-4xl">{currentRoutine.emoji}</span>
                                </h3>
                                <div className="w-full max-w-sm bg-white/50 dark:bg-slate-700/50 rounded-2xl p-6 min-h-[400px] flex flex-col gap-4 relative shadow-inner">
                                    {/* Error Overlay */}
                                    <AnimatePresence>
                                        {feedback === 'error' && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-red-100/50 z-10 rounded-2xl flex items-center justify-center border-2 border-red-300"
                                            >
                                                <XCircle size={64} className="text-red-500" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {filledSlots.map((slot, idx) => (
                                        <div
                                            key={idx}
                                            className="w-full h-24 rounded-xl border-4 border-dashed border-gray-300 dark:border-slate-500 flex items-center justify-center bg-white/40 dark:bg-slate-800/40 relative overflow-hidden transition-all"
                                        >
                                            <span className="absolute left-4 text-gray-300 dark:text-gray-600 font-bold text-6xl opacity-30 select-none">{idx + 1}</span>
                                            {slot && (
                                                <motion.div
                                                    layoutId={slot.id}
                                                    className={clsx("w-full h-full flex items-center justify-center gap-4 font-bold text-gray-700 shadow-sm rounded-xl", slot.color)}
                                                >
                                                    <span className="text-5xl drop-shadow-md">{slot.emoji}</span>
                                                </motion.div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Options Pool */}
                            <div className="flex flex-col gap-6 justify-center">
                                <SubTitle className="text-center mb-2">Tap the next step! 👇</SubTitle>
                                <div className="grid grid-cols-2 gap-4">
                                    {shuffledSteps.map(step => (
                                        <motion.div
                                            key={step.id}
                                            layoutId={step.id}
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.08 }}
                                            onClick={() => handleStepClick(step)}
                                            className={clsx(
                                                "flex flex-col items-center justify-center p-6 rounded-2xl shadow-lg cursor-pointer font-bold text-center border-b-4 border-black/10 select-none aspect-square gap-2 transition-colors hover:shadow-xl",
                                                step.color
                                            )}
                                        >
                                            <span className="text-6xl drop-shadow-md">{step.emoji}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GameShell>
    );
}
