/**
 * GameShell Component
 * 
 * A wrapper component that provides consistent UI elements across all games:
 * - Navigation (Back button)
 * - Score display
 * - Timer display
 * - Results Modal (via portal)
 * - Auth state monitoring with re-auth prompt
 * 
 * This eliminates duplicate modal code from individual game components.
 */

import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, BrainCircuit } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Title } from '../ui/Typography';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { ReAuthPrompt } from './ReAuthPrompt';
import clsx from 'clsx';

export function GameShell({
    title,
    children,
    score = 0,
    timeLeft = null,
    mistakes = null,
    gameState = 'IDLE',
    isAnalyzing = false,
    analysisResult = null,
    stats = [],
    onPlayAgain,
    headerColor = 'bg-blue-600',
}) {
    const navigate = useNavigate();
    const { showReAuthPrompt, dismissReAuthPrompt } = useAuthGuard();

    const handleBack = () => {
        navigate('/home');
    };

    return (
        <div className="relative w-full min-h-[80vh] flex flex-col">
            {/* Re-Auth Prompt - Shows when session expires mid-game */}
            {showReAuthPrompt && <ReAuthPrompt onDismiss={dismissReAuthPrompt} />}

            {/* HUD - Top Bar */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center gap-4">
                {/* Left: Back Button */}
                <Button
                    variant="ghost"
                    className="!p-2 bg-white/80 backdrop-blur text-gray-500 hover:bg-white"
                    onClick={handleBack}
                >
                    <ArrowLeft size={24} />
                    <span className="ml-2 font-bold hidden md:inline">Back</span>
                </Button>

                {/* Center: Score & Mistakes */}
                <Card className="!p-4 bg-white/80 backdrop-blur min-w-[120px]">
                    <div className="text-xl font-bold text-blue-600">Score: {score}</div>
                    {mistakes !== null && (
                        <div className="text-xs text-gray-500">Mistakes: {mistakes}</div>
                    )}
                </Card>

                {/* Right: Timer (if applicable) */}
                {timeLeft !== null && (
                    <Card
                        className={clsx(
                            "!p-4 bg-white/80 backdrop-blur flex items-center gap-2",
                            timeLeft < 10 && "text-red-500 animate-pulse"
                        )}
                    >
                        <div className="text-xl font-bold">{timeLeft}s</div>
                    </Card>
                )}
            </div>

            {/* Game Content Area */}
            <div className="flex-1 pt-20">
                {children}
            </div>

            {/* Results Modal - Portal to body */}
            {gameState === 'COMPLETED' && createPortal(
                <ResultsModal
                    title={title}
                    score={score}
                    stats={stats}
                    isAnalyzing={isAnalyzing}
                    analysisResult={analysisResult}
                    onPlayAgain={onPlayAgain}
                    headerColor={headerColor}
                />,
                document.body
            )}
        </div>
    );
}

/**
 * Results Modal Component
 */
function ResultsModal({
    title,
    score,
    stats = [],
    isAnalyzing,
    analysisResult,
    onPlayAgain,
    headerColor,
}) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-lg bg-white/95 shadow-2xl overflow-hidden p-0 max-h-[85vh] flex flex-col scale-100">
                {/* Header */}
                <div className={clsx("p-6 text-white text-center flex-shrink-0", headerColor)}>
                    <Title className="!text-white mb-2">Game Over!</Title>
                    <div className="text-4xl font-black">{score}</div>
                    <div className="text-white/80">Final Score</div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center py-8 space-y-4">
                            <BrainCircuit size={48} className="animate-pulse text-purple-500" />
                            <p className="text-gray-500 font-medium">Analyzing results...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            {stats.length > 0 && (
                                <div className="grid grid-cols-3 gap-4">
                                    {stats.map((stat, i) => (
                                        <div
                                            key={i}
                                            className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100"
                                        >
                                            <div className="text-2xl font-bold text-gray-800">
                                                {stat.value}
                                            </div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* AI Insights */}
                            {analysisResult?.aiInsights && (
                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                    <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                                        <BrainCircuit size={18} /> AI Insights
                                    </h4>
                                    <p className="text-sm text-purple-700">
                                        {analysisResult.aiInsights}
                                    </p>
                                </div>
                            )}

                            {/* Not Played Warning */}
                            {analysisResult?.notPlayed && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                                    <div className="text-4xl mb-2">🎮</div>
                                    <h4 className="font-bold text-amber-800 mb-1">No Activity Detected</h4>
                                    <p className="text-sm text-amber-700">
                                        Play the game to get your personalized analysis!
                                    </p>
                                </div>
                            )}

                            {/* Risk Score (only if actually played) */}
                            {!analysisResult?.notPlayed && analysisResult?.riskScore !== undefined && analysisResult?.riskScore !== null && (
                                <div className="flex items-center justify-center gap-4 py-2">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-slate-800">
                                            {(analysisResult.riskScore * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">
                                            Risk Indicator
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Play Again Button */}
                            <Button onClick={onPlayAgain} className="w-full gap-2 mt-4">
                                <RotateCcw size={18} /> Play Again
                            </Button>

                            {/* Back to Menu Button */}
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = '/home'}
                                className="w-full gap-2 mt-2 text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft size={18} /> Back to Menu
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}

export default GameShell;
