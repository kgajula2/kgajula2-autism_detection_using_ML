import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { CheckCircle, Sparkles } from 'lucide-react';

/**
 * GameTutorial - Child-friendly animated tutorial overlay
 * Uses large visuals, bouncing animations, and clear step-by-step demos
 * No reading required - purely visual understanding
 */
export default function GameTutorial({
    type = 'tap',
    targetElement,
    onComplete,
    title = '👆',
    subtitle = ''
}) {
    const [showSuccess, setShowSuccess] = useState(false);

    // Hand cursor animation based on interaction type
    const getHandAnimation = () => {
        switch (type) {
            case 'tap':
                return {
                    initial: { y: -80, opacity: 0, scale: 1.2 },
                    animate: {
                        y: [-80, 20, 20, -80],
                        opacity: [0, 1, 1, 0],
                        scale: [1.2, 1.2, 0.8, 1.2],
                    },
                    transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.3, 0.5, 1]
                    }
                };
            case 'drag':
                return {
                    initial: { x: -100, y: 0, opacity: 0, rotate: -15 },
                    animate: {
                        x: [-100, 0, 100],
                        y: [0, -20, 0],
                        opacity: [0, 1, 0],
                        rotate: [-15, 0, 15],
                    },
                    transition: {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                };
            case 'copy':
                return {
                    initial: { scale: 1, opacity: 0 },
                    animate: {
                        scale: [1, 1.3, 1],
                        opacity: [0, 1, 1, 0],
                    },
                    transition: {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                };
            default:
                return {};
        }
    };

    const handAnimation = getHandAnimation();

    const handleComplete = () => {
        setShowSuccess(true);
        setTimeout(() => {
            onComplete();
        }, 600);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-gradient-to-b from-purple-900/80 to-blue-900/80 backdrop-blur-md p-4"
            >
                {/* Floating Stars Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-4xl"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [-10, 10, -10],
                                rotate: [0, 180, 360],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        >
                            ✨
                        </motion.div>
                    ))}
                </div>

                {/* Main Tutorial Card */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl border-4 border-white/30"
                >
                    {/* Big Bouncing Title Emoji */}
                    <motion.div
                        className="text-center mb-6"
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        <span className="text-8xl drop-shadow-lg">{title}</span>
                    </motion.div>

                    {/* Simple Instruction Text (very short) */}
                    {subtitle && (
                        <motion.p
                            className="text-center text-2xl font-bold text-gray-700 dark:text-white mb-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {subtitle}
                        </motion.p>
                    )}

                    {/* Demo Area - Larger and more colorful */}
                    <div className="relative flex items-center justify-center min-h-[220px] bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 rounded-3xl mb-6 overflow-hidden border-4 border-dashed border-purple-300 dark:border-purple-500">

                        {/* Pulsing Background Effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-200/50 to-pink-200/50"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Target Element - Larger */}
                        <motion.div
                            className="relative z-10"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {targetElement || (
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-400 to-pink-500 shadow-2xl" />
                            )}
                        </motion.div>

                        {/* Animated Hand Cursor - Bigger */}
                        <motion.div
                            className="absolute z-20 pointer-events-none"
                            style={{ fontSize: '5rem' }}
                            {...handAnimation}
                        >
                            {type === 'copy' ? '🤗' : type === 'drag' ? '✋' : '👆'}
                        </motion.div>

                        {/* Success Burst Effect on tap */}
                        {type === 'tap' && (
                            <motion.div
                                className="absolute w-32 h-32 rounded-full border-8 border-green-400 z-5"
                                animate={{
                                    scale: [0.3, 2],
                                    opacity: [1, 0],
                                }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: 0.4
                                }}
                            />
                        )}

                        {/* Drag Arrow Trail */}
                        {type === 'drag' && (
                            <motion.div
                                className="absolute text-5xl z-5"
                                animate={{
                                    x: [-20, 80],
                                    opacity: [1, 0],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: 0.3
                                }}
                            >
                                ➡️
                            </motion.div>
                        )}

                        {/* Copy face indicator */}
                        {type === 'copy' && (
                            <motion.div
                                className="absolute bottom-4 text-3xl"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                👀
                            </motion.div>
                        )}
                    </div>

                    {/* Big Green "Got It" Button */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            onClick={handleComplete}
                            className="w-full py-6 text-2xl gap-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 shadow-xl rounded-2xl border-4 border-white/30"
                        >
                            {showSuccess ? (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, rotate: 360 }}
                                    className="text-4xl"
                                >
                                    🎉
                                </motion.div>
                            ) : (
                                <>
                                    <span className="text-4xl">✅</span>
                                    <Sparkles className="w-8 h-8" />
                                </>
                            )}
                        </Button>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Pre-configured tutorials for each game type - More visual & engaging
 */
export const TutorialConfigs = {
    colorFocus: {
        type: 'tap',
        title: '🎯',
        subtitle: 'Tap the color!',
        targetElement: (
            <div className="flex flex-col items-center gap-4">
                {/* Target indicator */}
                <motion.div
                    className="text-4xl mb-2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                >
                    👇
                </motion.div>
                {/* Big target bubble */}
                <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-2xl ring-8 ring-yellow-300 ring-opacity-75"
                    animate={{
                        boxShadow: ['0 0 0 0 rgba(255,255,0,0.7)', '0 0 0 20px rgba(255,255,0,0)', '0 0 0 0 rgba(255,255,0,0.7)']
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                {/* Other bubbles */}
                <div className="flex gap-4 mt-3">
                    <div className="w-12 h-12 rounded-full bg-blue-400 opacity-50" />
                    <div className="w-12 h-12 rounded-full bg-green-400 opacity-50" />
                    <div className="w-12 h-12 rounded-full bg-purple-400 opacity-50" />
                </div>
            </div>
        )
    },
    routineSequencer: {
        type: 'drag',
        title: '📋',
        subtitle: 'Drag to box!',
        targetElement: (
            <div className="flex items-center gap-6">
                {/* Source emoji */}
                <motion.div
                    className="text-6xl"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                >
                    🦷
                </motion.div>
                {/* Arrow */}
                <motion.span
                    className="text-4xl"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                >
                    ➡️
                </motion.span>
                {/* Target box */}
                <motion.div
                    className="w-20 h-20 border-4 border-dashed border-green-400 rounded-2xl flex items-center justify-center bg-green-50"
                    animate={{ borderColor: ['#4ade80', '#a855f7', '#4ade80'] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    <span className="text-3xl font-black text-green-500">1</span>
                </motion.div>
            </div>
        )
    },
    emotionMirror: {
        type: 'copy',
        title: '🪞',
        subtitle: 'Copy the face!',
        targetElement: (
            <div className="flex items-center gap-8">
                {/* Example face to copy */}
                <motion.span
                    className="text-7xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    😊
                </motion.span>
                {/* Arrow */}
                <span className="text-4xl">→</span>
                {/* Your face placeholder */}
                <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-200 to-amber-300 flex items-center justify-center shadow-lg border-4 border-amber-400"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <span className="text-4xl">👤</span>
                </motion.div>
            </div>
        )
    },
    objectId: {
        type: 'tap',
        title: '🔍',
        subtitle: 'Find the match!',
        targetElement: (
            <div className="flex flex-col items-center gap-4">
                {/* Item to find */}
                <motion.div
                    className="text-6xl p-3 bg-white rounded-2xl shadow-lg border-4 border-blue-400"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    🍎
                </motion.div>
                {/* Options */}
                <div className="flex gap-4">
                    <span className="text-4xl opacity-50 p-2">🍌</span>
                    <motion.span
                        className="text-4xl p-2 ring-4 ring-green-400 rounded-xl bg-green-50"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        🍎
                    </motion.span>
                    <span className="text-4xl opacity-50 p-2">🍇</span>
                </div>
            </div>
        )
    }
};
