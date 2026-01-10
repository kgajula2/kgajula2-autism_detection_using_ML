import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Title, SubTitle } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { analyzeUserPerformance } from '../services/ml';
import { fetchUserGameStats, getUserProfile } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, Brain, TrendingUp, AlertTriangle, CheckCircle, X, ArrowLeft, Gamepad, Clock, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { default as MLExplainer } from '../components/ml/MLExplainer';
import { MASCOT } from '../config/gameConfig';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [childName, setChildName] = useState('Child');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSession, setExpandedSession] = useState(null);
    const [stats, setStats] = useState({
        totalGames: 0,
        wins: 0,
        misses: 0,
        gameBreakdown: []
    });
    const [showMLModal, setShowMLModal] = useState(false);
    const [mlError, setMlError] = useState(null);

    useEffect(() => {
        const loadRealData = async () => {
            if (!user) return;
            try {
                // 1. Get Child Profile Name
                const profile = await getUserProfile(user.uid);
                if (profile?.childName) setChildName(profile.childName);

                // 2. Fetch Sessions
                const { sessions, aggregated } = await fetchUserGameStats(user.uid);

                // 3. Process Stats
                let totalMistakes = 0;
                sessions.forEach(s => {
                    if (s.stats?.mistakes) totalMistakes += s.stats.mistakes;
                    if (s.stats?.errors) totalMistakes += s.stats.errors;
                    if (s.stats?.wrong) totalMistakes += s.stats.wrong;
                });

                setStats({
                    totalGames: sessions.length,
                    wins: sessions.length, // Treating every completed session as a 'Win' for engagement
                    misses: totalMistakes,
                    gameBreakdown: sessions.slice(0, 10) // Recent 10
                });

                // 4. Run Analysis
                try {
                    const result = await analyzeUserPerformance(aggregated);
                    setAnalysis(result);
                } catch (mlErr) {
                    console.error("ML Analysis Error:", mlErr);
                    setMlError("Analysis momentarily unavailable.");
                }

            } catch (err) {
                console.error("Dashboard Load Error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadRealData();
    }, [user]);

    const pieData = [
        { name: 'Completed Plays', value: stats.wins || 1, color: '#8b5cf6' }, // fallback val to show empty circle if 0
        { name: 'Challenges', value: stats.misses, color: '#fca5a5' }
    ];

    const getRiskPercentage = () => {
        if (!analysis?.riskScore) return 0;
        return (analysis.riskScore * 100).toFixed(1);
    };

    // Format round timings for display
    const formatRoundTimings = (roundTimings) => {
        if (!roundTimings || roundTimings.length === 0) return null;
        return roundTimings.map((r, idx) => ({
            name: `${idx + 1}/${roundTimings.length}`,
            time: (r.reactionTime / 1000).toFixed(2),
            correct: r.correct
        }));
    };

    const getGameEmoji = (gameId) => {
        const emojis = {
            'color-focus': '🎯',
            'emotion-mirror': '🪞',
            'routine-sequencer': '📋',
            'object-id': '🔍'
        };
        return emojis[gameId] || '🎮';
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-10 px-4 min-h-[80vh]">
            <div className="flex justify-between items-center">
                <Button
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 bg-white/50 hover:bg-white text-purple-700 shadow-sm border border-white/60"
                >
                    <ArrowLeft size={24} /> Back
                </Button>
                <div className="flex items-center gap-3">
                    <span className="text-4xl">{MASCOT.emoji}</span>
                    <Title className="text-right text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        {childName}'s Progress
                    </Title>
                </div>
            </div>

            {/* Top Stats Cards - Child Friendly Shapes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Games Counter */}
                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-blue-400 to-cyan-300 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden border-4 border-white/40">
                    <Gamepad className="absolute top-4 right-4 opacity-30 w-24 h-24" />
                    <div className="h-full flex flex-col justify-between relative z-10">
                        <span className="text-xl font-bold opacity-90">Games Played</span>
                        <span className="text-7xl font-black drop-shadow-md">{stats.totalGames}</span>
                    </div>
                </motion.div>

                {/* Engagement Status */}
                <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-green-400 to-emerald-300 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden border-4 border-white/40">
                    <TrendingUp className="absolute top-4 right-4 opacity-30 w-24 h-24" />
                    <div className="h-full flex flex-col justify-between relative z-10">
                        <span className="text-xl font-bold opacity-90">Activity Level</span>
                        <span className="text-5xl font-black drop-shadow-md mt-2">
                            {stats.totalGames > 0 ? 'Super!' : 'Ready?'}
                        </span>
                    </div>
                </motion.div>

                {/* AI Card */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowMLModal(true)}
                    className="cursor-pointer bg-gradient-to-br from-purple-500 to-indigo-500 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden border-4 border-white/40 group"
                >
                    <Brain className="absolute top-4 right-4 opacity-30 w-24 h-24 group-hover:scale-110 transition-transform" />
                    <div className="h-full flex flex-col justify-between relative z-10">
                        <span className="text-xl font-bold opacity-90 flex items-center gap-2">
                            Unique Pattern
                            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">AI</span>
                        </span>
                        <div className="flex items-end gap-2">
                            <span className="text-7xl font-black drop-shadow-md">{getRiskPercentage()}<span className="text-4xl">%</span></span>
                        </div>
                        <span className="text-white/80 text-sm font-medium underline decoration-white/50">Tap for details</span>
                    </div>
                </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card glass className="shadow-xl rounded-[2rem] border-white/50">
                    <h3 className="text-2xl font-black text-gray-700 mb-6 px-4">Wins vs. Learning Moments</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* AI Insights Card */}
                <Card glass className="shadow-xl rounded-[2rem] border-white/50">
                    <h3 className="text-2xl font-black text-gray-700 mb-4 px-4 flex items-center gap-2">
                        <Brain size={24} className="text-purple-500" />
                        AI Observations
                    </h3>
                    <div className="px-4 pb-4 space-y-4">
                        {analysis?.insights?.length > 0 ? (
                            analysis.insights.map((insight, idx) => (
                                <div key={idx} className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <p className="text-purple-800 font-medium">{insight}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-center py-8">
                                Play more games to unlock personalized insights!
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Detailed Game History with Expandable Rows */}
            <Card glass className="shadow-xl flex flex-col">
                <h3 className="text-xl font-bold mb-4 text-gray-700 flex items-center gap-2">
                    <Clock size={20} className="text-blue-500" />
                    Detailed Game History
                    <span className="text-sm font-normal text-gray-400">(tap a row for timing details)</span>
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-sm text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                <th className="p-3">Game</th>
                                <th className="p-3">Result</th>
                                <th className="p-3">Score</th>
                                <th className="p-3">Duration</th>
                                <th className="p-3">Avg Reaction</th>
                                <th className="p-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm">
                            {stats.gameBreakdown.map((session, idx) => {
                                // Check if player actually played (score > 0)
                                const hasPlayed = session.score > 0 || (session.stats?.correct || 0) > 0;
                                const mistakes = session.stats?.mistakes || session.stats?.errors || session.stats?.wrong || 0;

                                return (
                                    <React.Fragment key={idx}>
                                        <tr
                                            className="border-b border-gray-50 hover:bg-white/40 transition-colors cursor-pointer"
                                            onClick={() => setExpandedSession(expandedSession === idx ? null : idx)}
                                        >
                                            <td className="p-3 font-bold text-purple-700">
                                                <span className="text-2xl mr-2">{getGameEmoji(session.gameId)}</span>
                                                <span className="capitalize">{session.gameId.replace('-', ' ')}</span>
                                            </td>
                                            <td className="p-3">
                                                {!hasPlayed ? (
                                                    <span className="inline-flex items-center gap-1 text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                        🎮 Not Played
                                                    </span>
                                                ) : mistakes === 0 ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full text-xs">
                                                        <CheckCircle size={12} /> Perfect!
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-full text-xs">
                                                        <AlertTriangle size={12} /> {mistakes} misses
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 font-mono font-bold text-lg">{session.score}</td>
                                            <td className="p-3">
                                                {session.stats?.duration ? (
                                                    <span className="font-bold">{session.stats.duration.toFixed(1)}s</span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-3">
                                                {session.stats?.roundTimings?.length > 0 ? (
                                                    <span className="font-bold text-blue-600">
                                                        {(session.stats.roundTimings.reduce((sum, r) => sum + r.reactionTime, 0) / session.stats.roundTimings.length / 1000).toFixed(2)}s
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-3">
                                                <Button variant="ghost" className="!p-2" onClick={(e) => { e.stopPropagation(); setExpandedSession(expandedSession === idx ? null : idx); }}>
                                                    {expandedSession === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </Button>
                                            </td>
                                        </tr>
                                        {/* Expanded Row - Per-Round Details */}
                                        {expandedSession === idx && session.stats?.roundTimings && (
                                            <tr>
                                                <td colSpan="6" className="bg-slate-50 p-4">
                                                    <div className="space-y-3">
                                                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                                            <Target size={16} className="text-blue-500" />
                                                            Per-Round Reaction Times
                                                        </h4>
                                                        <div className="h-[150px]">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={formatRoundTimings(session.stats.roundTimings)}>
                                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                                    <XAxis dataKey="name" fontSize={12} />
                                                                    <YAxis unit="s" fontSize={12} />
                                                                    <Tooltip
                                                                        formatter={(value) => [`${value}s`, 'Reaction Time']}
                                                                        contentStyle={{ borderRadius: '0.5rem' }}
                                                                    />
                                                                    <Bar
                                                                        dataKey="time"
                                                                        fill="#8b5cf6"
                                                                        radius={[4, 4, 0, 0]}
                                                                    />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                        <div className="grid grid-cols-5 gap-2 mt-2">
                                                            {session.stats.roundTimings.map((r, rIdx) => (
                                                                <div
                                                                    key={rIdx}
                                                                    className={`text-center p-2 rounded-lg ${r.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                                                >
                                                                    <div className="font-bold">{rIdx + 1}/{session.stats.roundTimings.length}</div>
                                                                    <div className="text-sm">{(r.reactionTime / 1000).toFixed(2)}s</div>
                                                                    <div className="text-xs">{r.correct ? '✓' : '✗'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {stats.totalGames === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400 italic">
                                        No sessions recorded yet. Play a game to see detailed stats!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* AI Modal */}
            <AnimatePresence>
                {showMLModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={() => setShowMLModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                                <Brain className="absolute -right-4 -top-4 text-white/10 w-48 h-48" />
                                <div className="relative z-10 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-black">AI Analysis</h2>
                                        <p className="opacity-90 mt-2 font-medium">Deep learning insights for parents.</p>
                                    </div>
                                    <button onClick={() => setShowMLModal(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 max-h-[70vh] overflow-y-auto">
                                <MLExplainer />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
