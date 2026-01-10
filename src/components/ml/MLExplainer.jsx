import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Title, SubTitle } from '../ui/Typography';
import { Activity, Brain, CheckCircle, Target, Zap, Layers, ArrowRight, TrendingUp, User } from 'lucide-react';
import { fetchUserGameStats } from '../../services/db';
import { getAuth } from 'firebase/auth';

const MetricCard = ({ label, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 ${color}`}
    >
        <div className="p-3 rounded-full bg-white/50 backdrop-blur shadow-sm">
            <Icon size={24} />
        </div>
        <div className="text-3xl font-black">{typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}</div>
        <div className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</div>
    </motion.div>
);

// Dynamic per-game accuracy card
const GameAccuracyCard = ({ game, accuracy, gamesPlayed, icon, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm"
    >
        <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{icon}</span>
            <div>
                <div className="font-bold text-slate-700 text-sm">{game}</div>
                <div className="text-xs text-slate-400">{gamesPlayed} sessions</div>
            </div>
        </div>
        <div className="flex items-end justify-between">
            <div>
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                    {accuracy.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 uppercase">Your Accuracy</div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${accuracy >= 70 ? 'bg-green-100 text-green-700' : accuracy >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {accuracy >= 70 ? '🌟 Great!' : accuracy >= 50 ? '👍 Good' : '📈 Improving'}
            </div>
        </div>
    </motion.div>
);

const HierarchicalViz = ({ modelData }) => {
    if (!modelData) return null;

    // Level 1: Games
    const games = [
        { id: 'color_focus', name: 'Color Focus', icon: '🎨', color: 'bg-pink-500' },
        { id: 'routine_sequencer', name: 'Routine Sequencer', icon: '🧩', color: 'bg-blue-500' },
        { id: 'emotion_mirror', name: 'Emotion Mirror', icon: '🙂', color: 'bg-yellow-500' },
        { id: 'object_hunt', name: 'Object Hunt', icon: '🔍', color: 'bg-green-500' }
    ];

    return (
        <div className="relative w-full p-8 bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            {/* LEVEL 1: GAMES */}
            <div className="flex flex-col gap-4 z-10 w-full md:w-1/3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Level 1: Behavioral Analysis</div>
                {games.map((g, i) => (
                    <motion.div
                        key={g.id}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between shadow-lg relative"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{g.icon}</span>
                            <div>
                                <div className="text-white font-bold text-sm">{g.name}</div>
                                <div className="text-[10px] text-slate-400">Independent Model</div>
                            </div>
                        </div>
                        {/* Flow Line */}
                        <motion.div
                            className={`absolute right-0 top-1/2 w-8 h-0.5 ${g.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: 40, x: 20 }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* FLOW ARROWS / AGGREGATION */}
            <div className="hidden md:flex flex-col items-center justify-center z-10">
                <ArrowRight className="text-slate-600 w-8 h-8 animate-pulse" />
            </div>

            {/* LEVEL 2: GLOBAL RISK */}
            <div className="flex flex-col gap-4 z-10 w-full md:w-1/3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Level 2: Global Integration</div>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-2xl border border-white/10 text-center relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <Layers className="w-8 h-8 text-white mx-auto mb-2 opacity-80" />
                        <h3 className="text-white font-bold text-lg">Global Risk Estimator</h3>
                        <p className="text-indigo-200 text-xs mt-1">Aggregates Level-1 outputs + Age/Demographics</p>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-center gap-4">
                            <div className="text-center">
                                <div className="text-xs text-indigo-300 uppercase">Input Sources</div>
                                <div className="text-xl font-bold text-white">8+</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-indigo-300 uppercase">Decision Logic</div>
                                <div className="text-xl font-bold text-white">Logistic</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default function MLExplainer() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState(null);

    useEffect(() => {
        // Load static model metrics
        fetch('/models/model_weights.json')
            .then(res => res.json())
            .then(data => {
                if (data.global_metrics) {
                    setMetrics(data.global_metrics);
                } else {
                    setMetrics(data.metadata);
                }
            })
            .catch(err => {
                console.error("Failed to load metrics", err);
            });

        // Load dynamic user stats
        const loadUserStats = async () => {
            try {
                const user = getAuth().currentUser;
                if (user) {
                    const { sessions, aggregated } = await fetchUserGameStats(user.uid);

                    // Calculate per-game accuracy
                    const gameAccuracies = {};
                    const gameCounts = {};

                    sessions.forEach(session => {
                        const gameId = session.gameId;
                        if (!gameAccuracies[gameId]) {
                            gameAccuracies[gameId] = [];
                            gameCounts[gameId] = 0;
                        }

                        // Calculate accuracy based on game type
                        let accuracy = 0;
                        if (session.score > 0) {
                            const mistakes = session.stats?.mistakes || session.stats?.errors || 0;
                            const total = session.score + (mistakes * 10);
                            accuracy = total > 0 ? (session.score / total) * 100 : 0;
                        }

                        gameAccuracies[gameId].push(accuracy);
                        gameCounts[gameId]++;
                    });

                    // Average accuracy per game
                    const averages = {};
                    Object.keys(gameAccuracies).forEach(gameId => {
                        const arr = gameAccuracies[gameId];
                        averages[gameId] = arr.length > 0
                            ? arr.reduce((a, b) => a + b, 0) / arr.length
                            : 0;
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

    const gameIcons = {
        'color-focus': '🎯',
        'routine-sequencer': '📋',
        'emotion-mirror': '🪞',
        'object-id': '🔍'
    };

    const gameNames = {
        'color-focus': 'Color Focus',
        'routine-sequencer': 'Routine Sequencer',
        'emotion-mirror': 'Emotion Mirror',
        'object-id': 'Object ID'
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading AI Brain Data...</div>;

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Header Section */}
            <div className="text-center space-y-2">
                <Title>Hierarchical ML Architecture</Title>
                <SubTitle>A Two-Level System for Robust Risk Estimation</SubTitle>
            </div>

            {/* 1. DYNAMIC: Your Performance Section */}
            {userStats && userStats.totalGames > 0 && (
                <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                        <User className="text-purple-600" />
                        <h3 className="font-bold text-purple-800">Your Performance</h3>
                        <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full ml-auto">
                            {userStats.totalGames} games played
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.keys(userStats.averages).map((gameId, idx) => (
                            <GameAccuracyCard
                                key={gameId}
                                game={gameNames[gameId] || gameId}
                                accuracy={userStats.averages[gameId]}
                                gamesPlayed={userStats.counts[gameId]}
                                icon={gameIcons[gameId] || '🎮'}
                                delay={idx * 0.1}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {/* 2. STATIC: Academic Model Metrics */}
            <Card className="p-6 border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                    <Brain className="text-slate-600" />
                    <h3 className="font-bold text-slate-700">Model Training Metrics</h3>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full ml-auto">Static</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Global Accuracy"
                        value={metrics?.accuracy || 0}
                        icon={CheckCircle}
                        color="text-green-600 bg-green-50"
                        delay={0.1}
                    />
                    <MetricCard
                        label="Precision"
                        value={metrics?.precision || 0}
                        icon={Target}
                        color="text-blue-600 bg-blue-50"
                        delay={0.2}
                    />
                    <MetricCard
                        label="Recall"
                        value={metrics?.recall || 0}
                        icon={Zap}
                        color="text-purple-600 bg-purple-50"
                        delay={0.3}
                    />
                    <MetricCard
                        label="F1 Score"
                        value={metrics?.f1_score || 0}
                        icon={Activity}
                        color="text-indigo-600 bg-indigo-50"
                        delay={0.4}
                    />
                </div>
            </Card>

            {/* 3. Hierarchical Visualization */}
            <Card className="p-6 border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Brain className="text-purple-500" /> System Architecture
                    </h3>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Hierarchical Ensemble</span>
                </div>
                <HierarchicalViz modelData={metrics} />
                <p className="mt-4 text-sm text-gray-500 text-center italic">
                    Data flows from independent game modules (Level 1) into a global aggregator (Level 2) to ensure robust, explainable decision support.
                </p>
            </Card>

            {/* 4. Confusion Matrix Proof */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-0 overflow-hidden bg-slate-50 border-slate-200">
                    <div className="p-4 border-b border-slate-200">
                        <h3 className="font-bold text-gray-700">Confusion Matrix</h3>
                        <p className="text-xs text-slate-500">Visual proof of classification performance</p>
                    </div>
                    <div className="p-8 flex justify-center bg-white">
                        <img
                            src="/models/confusion_matrix.png"
                            alt="Confusion Matrix"
                            className="max-w-full rounded-lg shadow-lg border border-slate-100"
                        />
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-indigo-900 to-slate-800 text-white flex flex-col justify-center gap-4">
                    <h3 className="text-2xl font-black text-yellow-400">Why Hierarchical?</h3>
                    <ul className="space-y-3 opacity-90 text-sm">
                        <li className="flex gap-2">
                            <CheckCircle size={16} className="text-green-400 mt-0.5" />
                            <span><strong>No "Black Box":</strong> Each game is analyzed independently first.</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle size={16} className="text-green-400 mt-0.5" />
                            <span><strong>Robustness:</strong> Failure in one game input doesn't crash the global prediction.</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle size={16} className="text-green-400 mt-0.5" />
                            <span><strong>Explainability:</strong> We know exactly which component contributed to the risk score.</span>
                        </li>
                    </ul>
                    <div className="mt-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                        <div className="text-sm font-bold opacity-75 uppercase tracking-widest mb-1">Status</div>
                        <div className="text-lg font-bold text-green-400">Academic Standard Met</div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

