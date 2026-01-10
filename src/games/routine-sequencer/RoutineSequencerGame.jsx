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
import { ROUTINES, ROUTINE_ICONS } from '../../config/gameConfig';
import { shuffle } from '../../utils/utils';

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

    const selectRoutine = async (routine) => {
        // Prepare steps with resolved icons
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
            await endGameSession(sessionId, score + 20, { mistakes, completed: true, duration: timeTaken });
        }

        try {
            const gameData = {
                'routine-sequencer': { score: score + 20, mistakes, routine: currentRoutine.id, timeTaken }
            };
            const result = await analyzeUserPerformance(gameData);
            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        resetGame();
        setCurrentRoutine(null);
        setFilledSlots([]);
        setShuffledSteps([]);
        setFeedback(null);
        setAnalysisResult(null);
        setSessionId(null);
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
                        /* Selection Screen */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
                            key="selection"
                        >
                            <div className="md:col-span-2 text-center mb-4">
                                <Title>Daily Routines</Title>
                                <SubTitle>Choose a routine to practice sequencing.</SubTitle>
                            </div>

                            {ROUTINES.map((r, i) => (
                                <Card
                                    key={r.id}
                                    className="cursor-pointer hover:bg-brand-primary/10 transition-colors border border-transparent hover:border-brand-primary/30 flex flex-col items-center p-6 gap-4"
                                    onClick={() => selectRoutine(r)}
                                    delay={i * 0.1}
                                >
                                    <h3 className="text-xl font-bold mb-2">{r.title}</h3>
                                    <div className="flex gap-2 justify-center">
                                        {r.steps.map((s, idx) => (
                                            <div key={idx} className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center opacity-70`} />
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </motion.div>
                    ) : (
                        /* Game Screen */
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full grid grid-cols-1 md:grid-cols-2 gap-12"
                            key="game"
                        >
                            {/* Left: Slots (Timeline) */}
                            <div className="flex flex-col gap-4 items-center">
                                <h3 className="text-xl font-bold text-gray-700">{currentRoutine.title}</h3>
                                <div className="w-full max-w-sm bg-white/50 rounded-2xl p-6 min-h-[400px] flex flex-col gap-4 relative shadow-inner">
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
                                            className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white/40 relative overflow-hidden transition-all"
                                        >
                                            <span className="absolute left-4 text-gray-300 font-bold text-3xl opacity-30">{idx + 1}</span>
                                            {slot && (
                                                <motion.div
                                                    layoutId={slot.id}
                                                    className={clsx("w-full h-full flex items-center justify-between px-6 font-bold text-gray-700 shadow-sm", slot.color)}
                                                >
                                                    <div className="bg-white/30 p-2 rounded-full">
                                                        {slot.icon && <slot.icon size={32} />}
                                                    </div>
                                                    <span className="text-lg">{slot.label}</span>
                                                </motion.div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Options Pool */}
                            <div className="flex flex-col gap-6 justify-center">
                                <SubTitle className="text-center mb-4">Tap the next step!</SubTitle>
                                <div className="grid grid-cols-2 gap-4">
                                    {shuffledSteps.map(step => (
                                        <motion.div
                                            key={step.id}
                                            layoutId={step.id}
                                            whileTap={{ scale: 0.95 }}
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => handleStepClick(step)}
                                            className={clsx(
                                                "flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg cursor-pointer font-bold text-center border-b-4 border-black/10 select-none aspect-square gap-3 transition-colors",
                                                step.color
                                            )}
                                        >
                                            <div className="bg-white/40 p-3 rounded-full shadow-sm text-gray-800">
                                                {step.icon && <step.icon size={32} />}
                                            </div>
                                            <span className="text-sm leading-tight">{step.label}</span>
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
