import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { useUserStore } from "../store/userStore";
import { useEffect } from "react";

export const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();

    useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);

    // NeuroPlay Letter Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3,
            },
        },
    };

    const letter = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Animation Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-[100px] opacity-30 animate-pulse" />

            <div className="z-10 text-center px-4">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="flex justify-center gap-1 mb-6"
                >
                    {/* N E U R O S T E P - Animated Letters */}
                    {Array.from("NeuroStep").map((char, index) => (
                        <motion.span
                            key={index}
                            variants={letter}
                            className={`text-6xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-b ${index < 5 ? "from-blue-600 to-blue-400" : "from-purple-600 to-pink-500"
                                }`}
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="text-xl md:text-2xl text-slate-600 font-medium mb-12 max-w-2xl mx-auto"
                >
                    Unlock your potential through adaptive play.
                </motion.p>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2, type: "spring" }}
                >
                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <Button
                            className="text-xl px-12 py-6 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all"
                            onClick={() => navigate('/login')}
                        >
                            Get Started
                        </Button>
                        <Button
                            variant="secondary"
                            className="px-8 py-3 bg-white/50 backdrop-blur"
                            onClick={() => navigate('/login')}
                        >
                            I have an account
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="absolute bottom-8 text-slate-400 text-sm"
            >
                © 2025 NeuroStep Platform
            </motion.div>
        </div>
    );
};
