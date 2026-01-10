import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { Title, SubTitle } from "../components/ui/Typography";
import { Button } from "../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { getUserProfile } from "../services/db";
import { Play, Activity, Smile, Search, LayoutDashboard, Gamepad2, Rocket, Star } from "lucide-react";

export const GameSelection = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [viewState, setViewState] = useState('WELCOME'); // WELCOME, MENU, GAMES
    const [childName, setChildName] = useState('');

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

        // CHECK SESSION STORAGE
        const hasSeenWelcome = sessionStorage.getItem('welcome_shown');
        if (hasSeenWelcome) {
            setViewState('MENU'); // Skip animation
        } else {
            // Auto-transition from Welcome to Menu after 2.5s
            const timer = setTimeout(() => {
                setViewState('MENU');
                sessionStorage.setItem('welcome_shown', 'true');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center overflow-hidden relative">
            <AnimatePresence mode="wait">

                {/* STATE 1: WELCOME ANIMATION */}
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

                {/* STATE 2: MAIN MENU (BIG PLAY BUTTON) */}
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
                    </motion.div>
                )}

                {/* STATE 3: GAME SELECTION GRID */}
                {viewState === 'GAMES' && (
                    <motion.div
                        key="games"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="w-full max-w-6xl px-4 z-10"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={() => setViewState('MENU')} className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
                                ← Back
                            </button>
                            <h2 className="text-3xl font-black text-purple-800">Pick a Game!</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">

                            {/* COLOR FOCUS */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/color-focus')}
                                    className="cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-blue-400 to-cyan-300 p-6 relative overflow-hidden shadow-xl border-4 border-white/50 group"
                                >
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

                            {/* ROUTINE */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/routine-sequencer')}
                                    className="cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-300 p-6 relative overflow-hidden shadow-xl border-4 border-white/50 group"
                                >
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

                            {/* EMOTION */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/emotion-mirror')}
                                    className="cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-pink-400 to-rose-300 p-6 relative overflow-hidden shadow-xl border-4 border-white/50 group"
                                >
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

                            {/* OBJECT HUNT */}
                            <motion.div variants={itemVariants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <div
                                    onClick={() => navigate('/game/object-id')}
                                    className="cursor-pointer h-64 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-300 p-6 relative overflow-hidden shadow-xl border-4 border-white/50 group"
                                >
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
