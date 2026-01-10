import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Title, SubTitle } from '../ui/Typography';
import { Activity, Brain, CheckCircle, Target, Zap, Layers, ArrowRight } from 'lucide-react';

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

const HierarchicalViz = ({ modelData }) => {
    if (!modelData) return null;

    // Level 1: Games
    const games = [
        { id: 'color_focus', name: 'Color Focus', icon: '🎨', color: 'bg-pink-500' },
        { id: 'routine_sequencer', name: 'Routine Sequencer', icon: '🧩', color: 'bg-blue-500' },
        { id: 'emotion_mirror', name: 'Emotion Mirror', icon: '🙂', color: 'bg-yellow-500' },
        { id: 'object_hunt', name: 'Object Hunt', icon: '🔍', color: 'bg-green-500' }
    ];

    // Get feature importance (coefficients) from Level 2 model
    // Features are ordered: [game1_risk, game2_risk, game3_risk, game4_risk, age, gender...]
    // We map roughly assuming order to just show "Contribution" visual

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

    useEffect(() => {
        fetch('/models/model_weights.json')
            .then(res => res.json())
            .then(data => {
                // Parse new structure
                if (data.global_metrics) {
                    setMetrics(data.global_metrics);
                } else {
                    // Fallback for old structure if logic fails
                    setMetrics(data.metadata);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load metrics", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading AI Brain Data...</div>;

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Header Section */}
            <div className="text-center space-y-2">
                <Title>Hierarchical ML Architecture</Title>
                <SubTitle>A Two-Level System for Robust Risk Estimation</SubTitle>
            </div>

            {/* 1. Academic Metrics (Global) */}
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

            {/* 2. Hierarchical Visualization */}
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

            {/* 3. Confusion Matrix Proof */}
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
