import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { Title, SubTitle } from "../components/ui/Typography";
import { Button } from "../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { useGameStore, SCREENING_CONFIG } from "../store/gameStore";
import { getUserProfile } from "../services/db";
import { Play, Activity, Smile, Search, LayoutDashboard, Gamepad2, Rocket, Star, User, Package, Shapes, Bell, CheckCircle, Lock, Sparkles } from "lucide-react";

// --- Progress Tracker Component ---
const ProgressTracker = ({ screeningStatus }) => {
    const { mandatoryPlayed, choicePlayed, hasBothMandatory, hasChoice, isValid, totalPlayed } = screeningStatus;
    const { MANDATORY_GAMES, MIN_TOTAL_GAMES } = SCREENING_CONFIG;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-3xl p-6 mb-8 shadow-2xl"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    Screening Progress
                </h3>
                <span className="bg-white/20 px-4 py-1 rounded-full text-white font-bold">
                    {totalPlayed} / {MIN_TOTAL_GAMES}+ Games
                </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Mandatory Game 1: Toy Box */}
                <div className={`rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${mandatoryPlayed.includes('free-toy-tap')
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 text-white/80'
                    }`}>
                    {mandatoryPlayed.includes('free-toy-tap')
                        ? <CheckCircle className="w-8 h-8" />
                        : <Lock className="w-8 h-8" />
                    }
                    <span className="font-bold text-sm text-center">Toy Box</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Required</span>
                </div>

                {/* Mandatory Game 2: Hi There! */}
                <div className={`rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${mandatoryPlayed.includes('attention-call')
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 text-white/80'
                    }`}>
                    {mandatoryPlayed.includes('attention-call')
                        ? <CheckCircle className="w-8 h-8" />
                        : <Lock className="w-8 h-8" />
                    }
                    <span className="font-bold text-sm text-center">Hi There!</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Required</span>
                </div>

                {/* Choice Game Slot */}
                <div className={`rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${choicePlayed.length >= 1
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 text-white/80'
                    }`}>
                    {choicePlayed.length >= 1
                        ? <CheckCircle className="w-8 h-8" />
                        : <Star className="w-8 h-8" />
                    }
                    <span className="font-bold text-sm text-center">
                        {choicePlayed.length >= 1 ? `+${choicePlayed.length} Choice` : 'Your Choice'}
                    </span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Pick Any</span>
                </div>
            </div>

            {isValid && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-white font-bold mt-4 text-lg"
                >
                    ✨ Ready to see your results!
                </motion.p>
            )}
        </motion.div>
    );
};

export const GameSelection = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { sessionPlayedGames, getScreeningStatus } = useGameStore();
    const [viewState, setViewState] = useState('WELCOME');  // WELCOME, MENU, GAMES
    const [childName, setChildName] = useState('');
    const [screeningStatus, setScreeningStatus] = useState(null);

    useEffect(() => {
        // Update screening status whenever sessionPlayedGames changes
        setScreeningStatus(getScreeningStatus());
    }, [sessionPlayedGames, getScreeningStatus]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.uid) {
                const profile = await getUserProfile(user.uid);
                if (profile?.childName) {
                    setChildName(profile.childName);
                } else {
                    setChildName(user.displayName || 'Friend');
                }
            }
        };
        fetchProfile();

        // Auto-transition from welcome screen
        const hasSeenWelcome = sessionStorage.getItem('welcome_shown');
        if (hasSeenWelcome) {
            setViewState('MENU');  // Skip welcome if already seen
        } else {
            // Show welcome for 2.5 seconds then transition
            const timer = setTimeout(() => {
                setViewState('MENU');
                sessionStorage.setItem('welcome_shown', 'true');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    // Helper to check if a game is mandatory
    const isMandatory = (gameId) => SCREENING_CONFIG.MANDATORY_GAMES.includes(gameId);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center overflow-hidden relative">
            <AnimatePresence mode="wait">

                {/* Welcome Screen */}
                {viewState === 'WELCOME' && (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="text-center z-10"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-8xl mb-6 inline-block"
                        >
                            👋
                        </motion.div>
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 drop-shadow-xl mb-4">
                            Hi, {childName}!
                        </h1>
                        <p className="text-2xl text-gray-600 font-bold">Ready to play?</p>
                    </motion.div>
                )}

                {/* Main Menu */}
                {viewState === 'MENU' && (
                    <motion.div
                        key="menu"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex flex-col items-center gap-8 w-full max-w-md z-10"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 2 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-full"
                        >
                            <button
                                onClick={() => setViewState('GAMES')}
                                className="w-full aspect-square md:aspect-video rounded-[3rem] bg-gradient-to-br from-orange-400 to-pink-500 shadow-[0_20px_50px_rgba(255,100,100,0.4)] border-8 border-white flex flex-col items-center justify-center gap-4 group transition-all transform hover:-translate-y-2"
                            >
                                <Rocket className="w-24 h-24 text-white drop-shadow-lg animate-bounce" />
                                <span className="text-5xl font-black text-white tracking-widest uppercase drop-shadow-lg">
                                    PLAY
                                </span>
                            </button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.05 }} className="w-full">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-4 rounded-2xl bg-white/50 backdrop-blur-md border border-white shadow-lg flex items-center justify-center gap-3 text-purple-700 font-bold text-xl hover:bg-white transition-all"
                            >
                                <LayoutDashboard className="w-6 h-6" />
                                Parent Dashboard
                            </button>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.05 }} className="w-full">
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 border border-white shadow-lg flex items-center justify-center gap-3 text-white font-bold text-xl hover:opacity-90 transition-all"
                            >
                                <User className="w-6 h-6" />
                                My Profile
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Game Selection Grid */}
                {viewState === 'GAMES' && (
                    <motion.div
                        key="games"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full max-w-6xl px-4 z-10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setViewState('MENU')} className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
                                ← Back
                            </button>
                            <h2 className="text-3xl font-black text-purple-800">Pick a Game!</h2>
                        </div>

                        {/* Progress Tracker */}
                        {screeningStatus && <ProgressTracker screeningStatus={screeningStatus} />}

                        {/* Unlock Results Button */}
                        {screeningStatus?.isValid && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-8"
                            >
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 shadow-xl border-4 border-white flex items-center justify-center gap-3 text-white font-black text-2xl hover:scale-105 transition-all"
                                >
                                    <Sparkles className="w-8 h-8" />
                                    🎉 Unlock Results!
                                </button>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">

                            {/* MANDATORY: Toy Box (Free Toy Tap) */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/free-toy-tap')}
                                    className={`cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-indigo-400 to-violet-300 p-6 relative overflow-hidden shadow-xl border-4 group ${screeningStatus?.mandatoryPlayed?.includes('free-toy-tap')
                                            ? 'border-green-400'
                                            : 'border-yellow-400 ring-4 ring-yellow-300/50'
                                        }`}
                                >
                                    {/* Required Badge */}
                                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-black z-20">
                                        ⭐ REQUIRED
                                    </div>
                                    {screeningStatus?.mandatoryPlayed?.includes('free-toy-tap') && (
                                        <div className="absolute top-4 left-4 bg-green-500 text-white p-2 rounded-full z-20">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-500">
                                        <Package size={120} color="white" />
                                    </div>
                                    <div className="flex flex-col h-full justify-between relative z-10 text-white">
                                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Package size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black mb-2 drop-shadow-md">Toy Box</h3>
                                            <p className="font-medium opacity-90 text-lg">Play with toys!</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* MANDATORY: Hi There! (Attention Call) */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/attention-call')}
                                    className={`cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-rose-400 to-pink-300 p-6 relative overflow-hidden shadow-xl border-4 group ${screeningStatus?.mandatoryPlayed?.includes('attention-call')
                                            ? 'border-green-400'
                                            : 'border-yellow-400 ring-4 ring-yellow-300/50'
                                        }`}
                                >
                                    {/* Required Badge */}
                                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-black z-20">
                                        ⭐ REQUIRED
                                    </div>
                                    {screeningStatus?.mandatoryPlayed?.includes('attention-call') && (
                                        <div className="absolute top-4 left-4 bg-green-500 text-white p-2 rounded-full z-20">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-500">
                                        <Bell size={120} color="white" />
                                    </div>
                                    <div className="flex flex-col h-full justify-between relative z-10 text-white">
                                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Bell size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black mb-2 drop-shadow-md">Hi There!</h3>
                                            <p className="font-medium opacity-90 text-lg">Listen for your name!</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CHOICE: Shape Switch */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/shape-switch')}
                                    className={`cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-teal-400 to-cyan-300 p-6 relative overflow-hidden shadow-xl border-4 group ${screeningStatus?.choicePlayed?.includes('shape-switch')
                                            ? 'border-green-400'
                                            : 'border-white/50'
                                        }`}
                                >
                                    {screeningStatus?.choicePlayed?.includes('shape-switch') && (
                                        <div className="absolute top-4 left-4 bg-green-500 text-white p-2 rounded-full z-20">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-500">
                                        <Shapes size={120} color="white" />
                                    </div>
                                    <div className="flex flex-col h-full justify-between relative z-10 text-white">
                                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Shapes size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black mb-2 drop-shadow-md">Shape Play</h3>
                                            <p className="font-medium opacity-90 text-lg">Tap the glow!</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CHOICE: Color Focus */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/color-focus')}
                                    className={`cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-blue-400 to-cyan-300 p-6 relative overflow-hidden shadow-xl border-4 group ${screeningStatus?.choicePlayed?.includes('color-focus')
                                            ? 'border-green-400'
                                            : 'border-white/50'
                                        }`}
                                >
                                    {screeningStatus?.choicePlayed?.includes('color-focus') && (
                                        <div className="absolute top-4 left-4 bg-green-500 text-white p-2 rounded-full z-20">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-500">
                                        <Activity size={120} color="white" />
                                    </div>
                                    <div className="flex flex-col h-full justify-between relative z-10 text-white">
                                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Activity size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black mb-2 drop-shadow-md">Pop Bubbles</h3>
                                            <p className="font-medium opacity-90 text-lg">Focus on colors!</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CHOICE: Routine Sequencer */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/routine-sequencer')}
                                    className={`cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-300 p-6 relative overflow-hidden shadow-xl border-4 group ${screeningStatus?.choicePlayed?.includes('routine-sequencer')
                                            ? 'border-green-400'
                                            : 'border-white/50'
                                        }`}
                                >
                                    {screeningStatus?.choicePlayed?.includes('routine-sequencer') && (
                                        <div className="absolute top-4 left-4 bg-green-500 text-white p-2 rounded-full z-20">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-500">
                                        <Star size={120} color="white" />
                                    </div>
                                    <div className="flex flex-col h-full justify-between relative z-10 text-white">
                                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Star size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black mb-2 drop-shadow-md">Daily Steps</h3>
                                            <p className="font-medium opacity-90 text-lg">Learn your routine!</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CHOICE: Emotion Mirror */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/emotion-mirror')}
                                    className={`cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-pink-400 to-rose-300 p-6 relative overflow-hidden shadow-xl border-4 group ${screeningStatus?.choicePlayed?.includes('emotion-mirror')
                                            ? 'border-green-400'
                                            : 'border-white/50'
                                        }`}
                                >
                                    {screeningStatus?.choicePlayed?.includes('emotion-mirror') && (
                                        <div className="absolute top-4 left-4 bg-green-500 text-white p-2 rounded-full z-20">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-500">
                                        <Smile size={120} color="white" />
                                    </div>
                                    <div className="flex flex-col h-full justify-between relative z-10 text-white">
                                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Smile size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black mb-2 drop-shadow-md">Copy Face</h3>
                                            <p className="font-medium opacity-90 text-lg">Show me a smile!</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CHOICE: Object ID */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/object-id')}
                                    className={`cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-300 p-6 relative overflow-hidden shadow-xl border-4 group ${screeningStatus?.choicePlayed?.includes('object-id')
                                            ? 'border-green-400'
                                            : 'border-white/50'
                                        }`}
                                >
                                    {screeningStatus?.choicePlayed?.includes('object-id') && (
                                        <div className="absolute top-4 left-4 bg-green-500 text-white p-2 rounded-full z-20">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-125 transition-transform duration-500">
                                        <Search size={120} color="white" />
                                    </div>
                                    <div className="flex flex-col h-full justify-between relative z-10 text-white">
                                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                            <Search size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black mb-2 drop-shadow-md">Find It</h3>
                                            <p className="font-medium opacity-90 text-lg">Hunt for objects!</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
