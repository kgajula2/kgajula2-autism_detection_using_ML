import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Title, SubTitle } from '../ui/Typography';
import {
    Activity, Brain, CheckCircle, Target, Zap, Layers, ArrowRight,
    User, ChevronDown, ChevronUp, Play, Info, Sparkles
} from 'lucide-react';
import { fetchUserGameStats } from '../../services/db';
import { getAuth } from 'firebase/auth';

 
const DataFlowAnimation = ({ isPlaying }) => {
    const steps = [
        { id: 1, label: 'Game Data', icon: '🎮', color: 'bg-blue-500' },
        { id: 2, label: 'Feature Extract', icon: '📊', color: 'bg-purple-500' },
        { id: 3, label: 'ML Model', icon: '🧠', color: 'bg-pink-500' },
        { id: 4, label: 'Risk Score', icon: '📈', color: 'bg-green-500' },
    ];

    return (
        <div className="flex items-center justify-between gap-2 py-6 px-4 bg-slate-900 rounded-2xl overflow-hidden">
            {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={isPlaying ? {
                            scale: [0.8, 1.1, 1],
                            opacity: [0.5, 1, 1],
                            boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 20px rgba(255,255,255,0.5)', '0 0 0px rgba(255,255,255,0)']
                        } : {}}
                        transition={{ delay: idx * 0.5, duration: 0.5, repeat: isPlaying ? Infinity : 0, repeatDelay: 1.5 }}
                        className={`${step.color} w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white shadow-lg`}
                    >
                        <span className="text-2xl">{step.icon}</span>
                        <span className="text-[8px] font-bold mt-1">{step.label}</span>
                    </motion.div>
                    {idx < steps.length - 1 && (
                        <motion.div
                            initial={{ opacity: 0.3 }}
                            animate={isPlaying ? { opacity: [0.3, 1, 0.3] } : {}}
                            transition={{ delay: idx * 0.5 + 0.3, duration: 0.3, repeat: isPlaying ? Infinity : 0, repeatDelay: 1.7 }}
                        >
                            <ArrowRight className="text-slate-500 w-6 h-6" />
                        </motion.div>
                    )}
                </div>
            ))}
        </div>
    );
};

 
const ExpandableSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className="overflow-hidden border-slate-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                        <Icon size={20} />
                    </div>
                    <span className="font-bold text-slate-700">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 border-t border-slate-100">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

export default function MLExplainer() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
         
        fetch('/models/model_weights.json')
            .then(res => res.json())
            .then(data => {
                if (data.global_metrics) {
                    setMetrics(data.global_metrics);
                } else {
                    setMetrics(data.metadata);
                }
            })
            .catch(err => console.error("Failed to load metrics", err));

         
        const loadUserStats = async () => {
            try {
                const user = getAuth().currentUser;
                if (user) {
                    const { sessions } = await fetchUserGameStats(user.uid);

                    const gameAccuracies = {};
                    const gameCounts = {};

                    sessions.forEach(session => {
                        const gameId = session.gameId;
                        if (!gameAccuracies[gameId]) {
                            gameAccuracies[gameId] = [];
                            gameCounts[gameId] = 0;
                        }

                        let accuracy = 0;
                        if (session.score > 0) {
                            const mistakes = session.stats?.mistakes || session.stats?.errors || 0;
                            const total = session.score + (mistakes * 10);
                            accuracy = total > 0 ? (session.score / total) * 100 : 0;
                        }

                        gameAccuracies[gameId].push(accuracy);
                        gameCounts[gameId]++;
                    });

                    const averages = {};
                    Object.keys(gameAccuracies).forEach(gameId => {
                        const arr = gameAccuracies[gameId];
                        averages[gameId] = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
                    });

                    setUserStats({ averages, counts: gameCounts, totalGames: sessions.length });
                }
            } catch (e) {
                console.error("Failed to load user stats:", e);
            } finally {
                setLoading(false);
            }
        };

        loadUserStats();
    }, []);

    const gameConfig = {
        'color-focus': { name: 'Color Focus', icon: '🎯', input: 'Reaction time, Accuracy, Mistakes' },
        'routine-sequencer': { name: 'Routine Sequencer', icon: '📋', input: 'Sequence accuracy, Time per step' },
        'emotion-mirror': { name: 'Emotion Mirror', icon: '🪞', input: 'Expression match, Hold duration' },
        'object-id': { name: 'Object ID', icon: '🔍', input: 'Identification accuracy, Response time' }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading AI Brain Data...</div>;

    return (
        <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
            { }
            <div className="text-center space-y-2">
                <Title>How AI Analysis Works</Title>
                <SubTitle className="text-slate-500">Tap each section to learn more</SubTitle>
            </div>

            { }
            <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Sparkles className="text-yellow-400" size={20} />
                        Data Flow Visualization
                    </h3>
                    <Button
                        variant="ghost"
                        className="!bg-white/10 !text-white hover:!bg-white/20"
                        onClick={() => setIsAnimating(!isAnimating)}
                    >
                        <Play size={16} className="mr-2" />
                        {isAnimating ? 'Pause' : 'Play Demo'}
                    </Button>
                </div>
                <DataFlowAnimation isPlaying={isAnimating} />
                <p className="text-slate-400 text-sm text-center mt-4">
                    Click "Play Demo" to see how your game data flows through the ML system
                </p>
            </Card>

            { }
            {userStats && userStats.totalGames > 0 && (
                <ExpandableSection title="Your Performance" icon={User} defaultOpen={true}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">
                            Based on {userStats.totalGames} game sessions, here's how you performed:
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 font-bold text-slate-600">Game</th>
                                        <th className="text-center py-3 px-4 font-bold text-slate-600">Sessions</th>
                                        <th className="text-center py-3 px-4 font-bold text-slate-600">Accuracy</th>
                                        <th className="text-center py-3 px-4 font-bold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(userStats.averages).map((gameId, idx) => {
                                        const config = gameConfig[gameId] || { name: gameId, icon: '🎮' };
                                        const accuracy = userStats.averages[gameId];
                                        return (
                                            <motion.tr
                                                key={gameId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="border-b border-slate-100 hover:bg-slate-50"
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{config.icon}</span>
                                                        <span className="font-medium text-slate-700">{config.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium">
                                                        {userStats.counts[gameId]}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                                                        {accuracy.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${accuracy >= 70 ? 'bg-green-100 text-green-700' :
                                                            accuracy >= 50 ? 'bg-amber-100 text-amber-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {accuracy >= 70 ? '🌟 Excellent' : accuracy >= 50 ? '👍 Good' : '📈 Improving'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </ExpandableSection>
            )}

            {/* How ML Works - Explanation */}
            <ExpandableSection title="How the ML Model Works" icon={Brain}>
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                            <Info size={16} /> Step-by-Step Process
                        </h4>
                        <ol className="space-y-3 text-sm text-blue-700">
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                <span><strong>Data Collection:</strong> Each game records your reactions, timing, and accuracy</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                <span><strong>Feature Extraction:</strong> Raw data is converted into behavioral patterns</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                <span><strong>Level 1 Analysis:</strong> Each game has its own ML model for specific assessment</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                <span><strong>Level 2 Integration:</strong> All game scores are combined for a global risk estimate</span>
                            </li>
                        </ol>
                    </div>

                    {/* Input/Output Table */}
                    <h4 className="font-bold text-slate-700 mt-4">What Each Game Measures:</h4>
                    <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="text-left py-3 px-4 font-bold text-slate-600">Game</th>
                                <th className="text-left py-3 px-4 font-bold text-slate-600">Input Data</th>
                                <th className="text-left py-3 px-4 font-bold text-slate-600">Measures</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-slate-200">
                                <td className="py-3 px-4">🎯 Color Focus</td>
                                <td className="py-3 px-4 text-slate-600">Clicks, timing, colors</td>
                                <td className="py-3 px-4 text-slate-600">Attention & Impulse Control</td>
                            </tr>
                            <tr className="border-t border-slate-200 bg-slate-50">
                                <td className="py-3 px-4">📋 Routine Sequencer</td>
                                <td className="py-3 px-4 text-slate-600">Order, time per step</td>
                                <td className="py-3 px-4 text-slate-600">Planning & Sequencing</td>
                            </tr>
                            <tr className="border-t border-slate-200">
                                <td className="py-3 px-4">🪞 Emotion Mirror</td>
                                <td className="py-3 px-4 text-slate-600">Facial landmarks</td>
                                <td className="py-3 px-4 text-slate-600">Emotional Recognition</td>
                            </tr>
                            <tr className="border-t border-slate-200 bg-slate-50">
                                <td className="py-3 px-4">🔍 Object ID</td>
                                <td className="py-3 px-4 text-slate-600">Selection, response time</td>
                                <td className="py-3 px-4 text-slate-600">Visual Discrimination</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </ExpandableSection>

            {/* Model Training Metrics */}
            <ExpandableSection title="Model Training Metrics" icon={Activity}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        These are fixed metrics from when the model was trained on research data:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Accuracy', value: metrics?.accuracy, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
                            { label: 'Precision', value: metrics?.precision, icon: Target, color: 'text-blue-600 bg-blue-50' },
                            { label: 'Recall', value: metrics?.recall, icon: Zap, color: 'text-purple-600 bg-purple-50' },
                            { label: 'F1 Score', value: metrics?.f1_score, icon: Activity, color: 'text-indigo-600 bg-indigo-50' },
                        ].map((metric, idx) => (
                            <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`rounded-xl p-4 text-center ${metric.color}`}
                            >
                                <metric.icon size={24} className="mx-auto mb-2" />
                                <div className="text-2xl font-black">
                                    {metric.value ? (metric.value * 100).toFixed(1) + '%' : 'N/A'}
                                </div>
                                <div className="text-xs font-bold uppercase opacity-60">{metric.label}</div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                        <strong>Note:</strong> These values are from model training and don't change during gameplay.
                    </div>
                </div>
            </ExpandableSection>

            { }
            <ExpandableSection title="Why Hierarchical ML?" icon={Layers}>
                <div className="grid gap-3">
                    {[
                        { icon: '🔍', title: 'Transparency', desc: 'Each game analysis is visible and explainable' },
                        { icon: '🛡️', title: 'Robustness', desc: 'If one game fails, others still provide a result' },
                        { icon: '📊', title: 'Accuracy', desc: 'Multiple inputs improve prediction reliability' },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl"
                        >
                            <span className="text-3xl">{item.icon}</span>
                            <div>
                                <h4 className="font-bold text-slate-700">{item.title}</h4>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </ExpandableSection>
        </div>
    );
}
