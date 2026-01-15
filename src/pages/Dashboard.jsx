import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Title, SubTitle } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { analyzeUserPerformance } from '../services/ml';
import { fetchUserGameStats, getUserProfile } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Activity, Brain, TrendingUp, AlertTriangle, CheckCircle, X, ArrowLeft, Gamepad, Clock, Target, ChevronDown, ChevronUp, Flame, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { default as MLExplainer } from '../components/ml/MLExplainer';
import { MASCOT } from '../config/gameConfig';
import { calculateStreak, getAchievementProgress } from '../config/achievements';
import Footer from '../components/layout/Footer';

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
    const [streak, setStreak] = useState(0);
    const [achievements, setAchievements] = useState({ unlocked: 0, total: 13, achievements: [] });
    const [progressData, setProgressData] = useState([]);

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

                // 4. Calculate Streak
                const currentStreak = calculateStreak(sessions);
                setStreak(currentStreak);

                // 5. Calculate Achievements
                const achStats = {
                    totalGames: sessions.length,
                    hasPerfectGame: sessions.some(s => (s.stats?.mistakes || 0) === 0 && s.score > 0),
                    averageAccuracy: sessions.length > 0
                        ? sessions.reduce((acc, s) => acc + (s.score || 0), 0) / sessions.length
                        : 0,
                    streak: currentStreak,
                    gamesPlayed: [...new Set(sessions.map(s => s.gameId))]
                };
                const achProgress = getAchievementProgress(achStats);
                setAchievements(achProgress);

                // 6. Build Progress Over Time Data (last 7 days)
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    date.setHours(0, 0, 0, 0);
                    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });

                    const daySessions = sessions.filter(s => {
                        const sDate = new Date(s.startedAt?.toDate?.() || s.startedAt);
                        sDate.setHours(0, 0, 0, 0);
                        return sDate.getTime() === date.getTime();
                    });

                    const avgScore = daySessions.length > 0
                        ? Math.round(daySessions.reduce((acc, s) => acc + (s.score || 0), 0) / daySessions.length)
                        : 0;

                    last7Days.push({
                        day: dateStr,
                        games: daySessions.length,
                        score: avgScore
                    });
                }
                setProgressData(last7Days);

                // 7. Run Analysis
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
            'object-id': '🔍',
            'free-toy-tap': '🧸',
            'shape-switch': '🔷',
            'attention-call': '🔔'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Games Counter */}
                <motion.div whileHover={{ scale: 1.02, y: -5 }} className="bg-gradient-to-br from-blue-400 to-cyan-300 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden border-4 border-white/40 group">
                    <Gamepad className="absolute top-4 right-4 opacity-30 w-24 h-24 group-hover:scale-110 transition-transform" />
                    <div className="h-full flex flex-col justify-between relative z-10">
                        <span className="text-lg font-bold opacity-90">Games Played</span>
                        <AnimatedCounter
                            value={stats.totalGames}
                            className="text-6xl font-black drop-shadow-md"
                            delay={0}
                        />
                    </div>
                </motion.div>

                {/* Daily Streak */}
                <motion.div whileHover={{ scale: 1.02, y: -5 }} className="bg-gradient-to-br from-orange-400 to-red-400 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden border-4 border-white/40 group">
                    <Flame className="absolute top-4 right-4 opacity-30 w-24 h-24 group-hover:scale-110 transition-transform" />
                    <div className="h-full flex flex-col justify-between relative z-10">
                        <span className="text-lg font-bold opacity-90">🔥 Daily Streak</span>
                        <div className="flex items-end gap-2">
                            <AnimatedCounter
                                value={streak}
                                className="text-6xl font-black drop-shadow-md"
                                delay={0.1}
                            />
                            <span className="text-2xl font-bold opacity-80 mb-2">days</span>
                        </div>
                        <span className="text-white/80 text-xs">
                            {streak === 0 ? 'Play today to start!' : streak >= 7 ? '🌟 Amazing consistency!' : 'Keep it up!'}
                        </span>
                    </div>
                </motion.div>

                {/* Achievements */}
                <motion.div whileHover={{ scale: 1.02, y: -5 }} className="bg-gradient-to-br from-yellow-400 to-amber-400 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden border-4 border-white/40 group">
                    <Award className="absolute top-4 right-4 opacity-30 w-24 h-24 group-hover:scale-110 transition-transform" />
                    <div className="h-full flex flex-col justify-between relative z-10">
                        <span className="text-lg font-bold opacity-90">🏆 Achievements</span>
                        <div className="flex items-end gap-2">
                            <AnimatedCounter
                                value={achievements.unlocked}
                                className="text-6xl font-black drop-shadow-md"
                                delay={0.2}
                            />
                            <span className="text-2xl font-bold opacity-80 mb-2">/ {achievements.total}</span>
                        </div>
                        <span className="text-white/80 text-xs">
                            <AnimatedCounter value={achievements.percentage || 0} suffix="%" delay={0.3} /> unlocked
                        </span>
                    </div>
                </motion.div>

                {/* AI Card - Behavioral Analysis */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowMLModal(true)}
                    className="cursor-pointer bg-gradient-to-br from-purple-500 to-indigo-500 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden border-4 border-white/40 group"
                >
                    <Brain className="absolute top-4 right-4 opacity-30 w-24 h-24 group-hover:scale-110 transition-transform" />
                    <div className="h-full flex flex-col justify-between relative z-10">
                        <div>
                            <span className="text-lg font-bold opacity-90 flex items-center gap-2">
                                Behavioral Analysis
                                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">AI</span>
                            </span>
                            <p className="text-white/70 text-xs mt-1">Based on gameplay patterns</p>
                        </div>
                        <div className="flex items-end gap-2 my-2">
                            <span className="text-6xl font-black drop-shadow-md">{getRiskPercentage()}<span className="text-3xl">%</span></span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-white/90 text-xs">
                                {getRiskPercentage() < 20 ? '✅ Low concern - Great patterns!' :
                                    getRiskPercentage() < 50 ? '📊 Moderate - Keep observing' :
                                        '⚠️ Consider professional consultation'}
                            </span>
                            <span className="text-white/80 text-sm font-medium underline decoration-white/50">Tap to see how it works →</span>
                        </div>
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

            {/* Progress Over Time Chart */}
            <Card glass className="shadow-xl rounded-[2rem] border-white/50 p-6">
                <h3 className="text-2xl font-black text-gray-700 mb-6 flex items-center gap-2">
                    <TrendingUp size={24} className="text-green-500" />
                    Progress Over Time (Last 7 Days)
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '1rem',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    background: 'white'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="games"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                                name="Games Played"
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', strokeWidth: 2 }}
                                name="Avg Score"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-sm text-gray-600">Games Played</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm text-gray-600">Avg Score</span>
                    </div>
                </div>
            </Card>

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
                                        {expandedSession === idx && (
                                            <tr>
                                                <td colSpan="6" className="bg-slate-50 p-4">
                                                    <div className="space-y-3">
                                                        {/* Attention Call specific metrics */}
                                                        {session.gameId === 'attention-call' && session.stats ? (
                                                            <div className="space-y-4">
                                                                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                                                    <span className="text-2xl">🔔</span>
                                                                    Name Response Analysis
                                                                </h4>

                                                                {/* Main response info */}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                    <div className="bg-rose-50 p-4 rounded-xl text-center border border-rose-100">
                                                                        <div className="text-3xl font-black text-rose-600">
                                                                            {session.stats.firstResponseCall ? `Call #${session.stats.firstResponseCall}` : 'No Response'}
                                                                        </div>
                                                                        <div className="text-xs text-rose-700 font-bold uppercase tracking-wide mt-1">
                                                                            {session.stats.firstResponseCall ? 'Responded At' : 'No Response Detected'}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            Out of {session.stats.totalCalls || 5} calls
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
                                                                        <div className="text-2xl font-black text-purple-600 capitalize">
                                                                            {session.stats.responseType?.replace('_', ' ') || 'N/A'}
                                                                        </div>
                                                                        <div className="text-xs text-purple-700 font-bold uppercase tracking-wide mt-1">Response Type</div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            {session.stats.responseType === 'eye_contact' ? '👁️ Looked at camera' :
                                                                                session.stats.responseType === 'face_detected' ? '👤 Face detected' :
                                                                                    session.stats.responseType === 'none' ? '❌ No response' : ''}
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                                                                        <div className="text-2xl font-black text-blue-600">
                                                                            {session.stats.avgResponseTime ? `${(session.stats.avgResponseTime / 1000).toFixed(1)}s` : '-'}
                                                                        </div>
                                                                        <div className="text-xs text-blue-700 font-bold uppercase tracking-wide mt-1">Response Time</div>
                                                                        <div className="text-xs text-gray-500 mt-1">After name was called</div>
                                                                    </div>
                                                                </div>

                                                                {/* Call by Call breakdown */}
                                                                {session.stats.callDetails && session.stats.callDetails.length > 0 && (
                                                                    <div className="mt-4">
                                                                        <h5 className="font-bold text-slate-600 text-sm mb-3 flex items-center gap-2">
                                                                            📞 Call by Call Breakdown
                                                                        </h5>
                                                                        <div className="flex gap-2 flex-wrap">
                                                                            {session.stats.callDetails.map((call, cIdx) => (
                                                                                <div
                                                                                    key={cIdx}
                                                                                    className={`p-3 rounded-xl text-center min-w-[80px] ${call.response !== 'none'
                                                                                            ? 'bg-green-100 border-2 border-green-400'
                                                                                            : 'bg-gray-100 border border-gray-200'
                                                                                        }`}
                                                                                >
                                                                                    <div className="text-2xl mb-1">
                                                                                        {call.response !== 'none' ? '✅' : '⏳'}
                                                                                    </div>
                                                                                    <div className={`text-lg font-bold ${call.response !== 'none' ? 'text-green-700' : 'text-gray-500'
                                                                                        }`}>
                                                                                        Call {call.call}
                                                                                    </div>
                                                                                    {call.time && (
                                                                                        <div className="text-xs text-gray-600">
                                                                                            {(call.time / 1000).toFixed(1)}s
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <p className="text-xs text-gray-400 mt-2">
                                                                            ✅ = Responded, ⏳ = No response within window
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* Summary stats */}
                                                                <div className="grid grid-cols-2 gap-3 mt-2">
                                                                    <div className="bg-slate-100 p-3 rounded-xl text-center">
                                                                        <div className="text-xl font-bold text-slate-700">
                                                                            {session.stats.totalResponses || 0} / {session.stats.totalCalls || 5}
                                                                        </div>
                                                                        <div className="text-xs text-slate-600">Total Responses</div>
                                                                    </div>
                                                                    <div className="bg-slate-100 p-3 rounded-xl text-center">
                                                                        <div className="text-xl font-bold text-slate-700">
                                                                            {session.stats.duration ? `${session.stats.duration.toFixed(1)}s` : '-'}
                                                                        </div>
                                                                        <div className="text-xs text-slate-600">Total Duration</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : session.gameId === 'free-toy-tap' && session.stats ? (
                                                            <div className="space-y-4">
                                                                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                                                    <span className="text-2xl">🧸</span>
                                                                    Behavioral Analysis Metrics
                                                                </h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    <div className="bg-purple-50 p-3 rounded-xl text-center border border-purple-100">
                                                                        <div className="text-2xl font-black text-purple-600">
                                                                            {session.stats.objectFixationEntropy?.toFixed(2) || session.stats.stats?.objectFixationEntropy?.toFixed(2) || '0.00'}
                                                                        </div>
                                                                        <div className="text-xs text-purple-700 font-bold uppercase tracking-wide">Fixation Entropy</div>
                                                                        <div className="text-xs text-gray-500 mt-1">Higher = better variety</div>
                                                                    </div>
                                                                    <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-100">
                                                                        <div className="text-2xl font-black text-blue-600">
                                                                            {((session.stats.repetitionRate || session.stats.stats?.repetitionRate || 0) * 100).toFixed(0)}%
                                                                        </div>
                                                                        <div className="text-xs text-blue-700 font-bold uppercase tracking-wide">Repetition Rate</div>
                                                                        <div className="text-xs text-gray-500 mt-1">Same object taps</div>
                                                                    </div>
                                                                    <div className="bg-green-50 p-3 rounded-xl text-center border border-green-100">
                                                                        <div className="text-2xl font-black text-green-600">
                                                                            {((session.stats.switchFrequency || session.stats.stats?.switchFrequency || 0) * 100).toFixed(0)}%
                                                                        </div>
                                                                        <div className="text-xs text-green-700 font-bold uppercase tracking-wide">Switch Frequency</div>
                                                                        <div className="text-xs text-gray-500 mt-1">Object switching</div>
                                                                    </div>
                                                                    <div className="bg-orange-50 p-3 rounded-xl text-center border border-orange-100">
                                                                        <div className="text-2xl font-black text-orange-600">
                                                                            {session.stats.engagementTime || session.stats.stats?.engagementTime || 0}s
                                                                        </div>
                                                                        <div className="text-xs text-orange-700 font-bold uppercase tracking-wide">Engagement Time</div>
                                                                        <div className="text-xs text-gray-500 mt-1">Active play time</div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3 mt-2">
                                                                    <div className="bg-slate-100 p-3 rounded-xl text-center">
                                                                        <div className="text-xl font-bold text-slate-700">{session.stats.totalTaps || session.stats.stats?.totalTaps || session.score || 0}</div>
                                                                        <div className="text-xs text-slate-600">Total Taps</div>
                                                                    </div>
                                                                    <div className="bg-slate-100 p-3 rounded-xl text-center">
                                                                        <div className="text-xl font-bold text-slate-700">{session.stats.pauseCount || session.stats.stats?.pauseCount || 0}</div>
                                                                        <div className="text-xs text-slate-600">Pauses (&gt;5s)</div>
                                                                    </div>
                                                                </div>

                                                                {/* Per-Toy Tap Breakdown */}
                                                                {(session.stats.toyTapBreakdown || session.stats.stats?.toyTapBreakdown) && (
                                                                    <div className="mt-4">
                                                                        <h5 className="font-bold text-slate-600 text-sm mb-3 flex items-center gap-2">
                                                                            🎯 Taps Per Toy
                                                                        </h5>
                                                                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                                                            {Object.entries(session.stats.toyTapBreakdown || session.stats.stats?.toyTapBreakdown || {}).map(([toyId, count]) => {
                                                                                const toyEmojis = {
                                                                                    car: '🚗', balloon: '🎈', star: '⭐', bear: '🐻',
                                                                                    rainbow: '🌈', bow: '🎀', rocket: '🚀', gift: '🎁'
                                                                                };
                                                                                return (
                                                                                    <div key={toyId} className="bg-white p-3 rounded-xl text-center border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                                                        <div className="text-3xl mb-1">{toyEmojis[toyId] || '🧸'}</div>
                                                                                        <div className="text-lg font-black text-indigo-600">{count}</div>
                                                                                        <div className="text-xs text-slate-500 capitalize">{toyId}</div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : session.stats?.roundTimings && session.stats.roundTimings.length > 0 ? (
                                                            <>
                                                                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                                                    <Target size={16} className="text-blue-500" />
                                                                    {session.gameId === 'color-focus' ? 'Bubble Pop Reaction Times' :
                                                                        session.gameId === 'routine-sequencer' ? 'Step Completion Times' :
                                                                            'Per-Round Reaction Times'}
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
                                                            </>
                                                        ) : (
                                                            <div className="text-center py-6 text-gray-400">
                                                                <div className="text-3xl mb-2">📊</div>
                                                                <p className="font-medium">Detailed timing data not available</p>
                                                                <p className="text-sm">Play new games to see per-round reaction times!</p>
                                                                {session.stats?.duration && (
                                                                    <p className="mt-2 text-gray-600">
                                                                        Total Duration: <span className="font-bold">{session.stats.duration.toFixed(1)}s</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
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
        </div >
    );
};
