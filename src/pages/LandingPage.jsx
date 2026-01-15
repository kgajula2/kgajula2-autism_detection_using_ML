import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../store/userStore";
import { useEffect } from "react";
import { Brain, Gamepad2, Shield, Sparkles, Heart, ChevronDown } from "lucide-react";

export const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();

    useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);

    // Staggered animations
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.2,
            },
        },
    };

    const letter = {
        hidden: { y: 30, opacity: 0, rotateX: -90 },
        show: { 
            y: 0, 
            opacity: 1, 
            rotateX: 0,
            transition: { type: "spring", stiffness: 100, damping: 12 } 
        },
    };

    const fadeUp = {
        hidden: { y: 40, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const features = [
        { icon: Gamepad2, title: "Fun Games", desc: "Interactive play-based activities", color: "from-blue-500 to-cyan-400" },
        { icon: Brain, title: "AI Analysis", desc: "Smart behavioral insights", color: "from-purple-500 to-pink-400" },
        { icon: Shield, title: "Private & Secure", desc: "Your data stays safe", color: "from-emerald-500 to-teal-400" },
        { icon: Heart, title: "Child-First", desc: "Designed for little ones", color: "from-rose-500 to-orange-400" },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Floating 3D Orbs - Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large purple orb */}
                <motion.div 
                    className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/40 to-violet-600/30 blur-3xl"
                    animate={{ 
                        y: [0, -40, 0], 
                        x: [0, 20, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Blue orb */}
                <motion.div 
                    className="absolute top-1/3 right-10 w-72 h-72 rounded-full bg-gradient-to-br from-blue-400/40 to-cyan-500/30 blur-3xl"
                    animate={{ 
                        y: [0, 30, 0], 
                        x: [0, -15, 0],
                        rotate: [0, 10, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
                {/* Pink orb */}
                <motion.div 
                    className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-pink-400/30 to-rose-500/20 blur-3xl"
                    animate={{ 
                        y: [0, -30, 0], 
                        x: [0, 25, 0]
                    }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
                {/* Teal orb */}
                <motion.div 
                    className="absolute bottom-10 right-1/4 w-56 h-56 rounded-full bg-gradient-to-br from-teal-400/30 to-emerald-500/20 blur-3xl"
                    animate={{ 
                        y: [0, 25, 0], 
                        scale: [1, 0.95, 1]
                    }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
            </div>

            {/* Main Content */}
            <div className="z-10 text-center px-4 max-w-5xl mx-auto">
                
                {/* Animated Mascot */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="mb-4"
                >
                    <motion.div
                        animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-block text-7xl drop-shadow-2xl"
                    >
                        🧠
                    </motion.div>
                </motion.div>

                {/* Animated Title - NeuroStep */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="flex justify-center gap-1 md:gap-2 mb-4 flex-wrap"
                >
                    {Array.from("NeuroStep").map((char, index) => (
                        <motion.span
                            key={index}
                            variants={letter}
                            className={`text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-b drop-shadow-lg
                                ${index < 5 
                                    ? "from-blue-500 via-blue-600 to-indigo-700" 
                                    : "from-purple-500 via-pink-500 to-rose-500"
                                }`}
                            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.1)' }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.div>

                {/* Tagline with sparkle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="flex items-center justify-center gap-2 mb-8"
                >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <p className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium">
                        Unlock potential through adaptive play
                    </p>
                    <Sparkles className="w-5 h-5 text-amber-400" />
                </motion.div>

                {/* CTA Buttons with Glow */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.5, type: "spring", stiffness: 100 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                >
                    <Button
                        className="text-lg sm:text-xl px-10 sm:px-14 py-5 sm:py-6 rounded-2xl shadow-2xl glow-pulse hover:scale-105 transition-transform bg-gradient-to-r from-blue-600 to-purple-600 border-0"
                        onClick={() => navigate('/login')}
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Get Started Free
                    </Button>
                    <Button
                        variant="glass"
                        className="px-8 py-4 rounded-xl border-2 border-white/60 hover:border-white hover:bg-white/60 transition-all font-semibold"
                        onClick={() => navigate('/login')}
                    >
                        I have an account
                    </Button>
                </motion.div>

                {/* Feature Cards Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12"
                >
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={fadeUp}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="glass-card rounded-2xl p-4 md:p-6 text-center group cursor-default"
                        >
                            <div className={`w-12 h-12 md:w-14 md:h-14 mx-auto rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm md:text-base mb-1">
                                {feature.title}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 0.8 }}
                    className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-slate-500 dark:text-slate-400"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>WCAG 2.1 AA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Privacy-First Design</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>AI-Powered Analysis</span>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="absolute bottom-8 text-slate-400"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <ChevronDown className="w-6 h-6" />
                </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8 }}
                className="absolute bottom-2 text-slate-400/70 text-xs"
            >
                © 2026 NeuroStep Platform • Made with ❤️ for families
            </motion.div>
        </div>
    );
};
