import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../ui/Button";
import { useState, useEffect } from "react";
import { subscribeToAuthChanges, logoutUser } from "../../services/auth";
import FeedbackButton from "./FeedbackButton";
import AIChatbot from "./AIChatbot";
import { User } from "lucide-react";

const variants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
};

import { useUserStore } from "../../store/userStore"; // Import store

export const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUser } = useUserStore(); // Use global store instead of local state

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [setUser]);

    const handleSignOut = async () => {
        await logoutUser();
        navigate('/');
    };

    // Get custom avatar from localStorage
    const customAvatar = typeof window !== 'undefined' ? localStorage.getItem('neurostep_avatar') : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans overflow-x-hidden transition-colors">
            <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/20 dark:border-slate-700/50 px-6 py-3 flex justify-between items-center bg-white/60 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
                <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 tracking-tighter cursor-pointer" onClick={() => navigate(user ? '/home' : '/')}>
                    NeuroStep
                </div>
                <div className="flex gap-4 items-center">
                    {user ? (
                        <>
                            <div className="hidden md:block text-sm font-medium mr-2 dark:text-white">
                                {user.displayName}
                            </div>
                            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                {customAvatar ? (
                                    <span className="text-2xl">{customAvatar}</span>
                                ) : user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-600" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                        <User size={16} />
                                    </div>
                                )}
                            </Link>
                            <Button variant="glass" className="!py-2 !px-4 text-sm text-red-500 hover:text-red-700" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </>
                    ) : (
                        location.pathname !== '/login' && (
                            <Button variant="glass" className="!py-2 !px-4 text-sm" onClick={() => navigate('/login')}>
                                Sign In
                            </Button>
                        )
                    )}
                </div>
            </nav>

            <main className="pt-24 px-4 pb-12 w-full max-w-7xl mx-auto min-h-[calc(100vh-6rem)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Floating Feedback Button */}
            <FeedbackButton />

            {/* AI Chatbot */}
            <AIChatbot />
        </div>
    );
};

