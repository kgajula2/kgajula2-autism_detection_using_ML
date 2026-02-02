import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                { }
                <motion.div
                    animate={{
                        rotate: [0, -5, 5, -5, 0],
                        scale: [1, 1.02, 1]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                    }}
                    className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4"
                >
                    404
                </motion.div>

                { }
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-8xl mb-6"
                >
                    🦊
                </motion.div>

                <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-4">
                    Oops! Page Not Found
                </h1>

                <p className="text-slate-600 dark:text-slate-300 mb-8">
                    Looks like Neuro got a bit lost! The page you're looking for doesn't exist or has been moved.
                </p>

                { }
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/">
                        <Button className="gap-2 w-full sm:w-auto">
                            <Home size={18} />
                            Go Home
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="gap-2"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </Button>
                </div>

                { }
                <div className="mt-12 p-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl backdrop-blur">
                    <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center justify-center gap-2">
                        <Search size={18} />
                        Try these instead:
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/home" className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">
                            🎮 Play Games
                        </Link>
                        <Link to="/dashboard" className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors">
                            📊 Dashboard
                        </Link>
                        <Link to="/help" className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium hover:bg-green-200 transition-colors">
                            ❓ Help
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
