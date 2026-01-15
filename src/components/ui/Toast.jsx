import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import clsx from "clsx";

/**
 * Toast Notification System
 * Premium slide-in notifications with auto-dismiss and progress bar
 */

// Toast Context for global access
const ToastContext = createContext(null);

// Toast variants configuration
const variants = {
    success: {
        icon: CheckCircle,
        bg: "bg-gradient-to-r from-emerald-500 to-teal-500",
        iconColor: "text-white",
        progressColor: "bg-white/30"
    },
    error: {
        icon: AlertCircle,
        bg: "bg-gradient-to-r from-red-500 to-rose-500",
        iconColor: "text-white",
        progressColor: "bg-white/30"
    },
    warning: {
        icon: AlertTriangle,
        bg: "bg-gradient-to-r from-amber-500 to-orange-500",
        iconColor: "text-white",
        progressColor: "bg-white/30"
    },
    info: {
        icon: Info,
        bg: "bg-gradient-to-r from-blue-500 to-cyan-500",
        iconColor: "text-white",
        progressColor: "bg-white/30"
    }
};

// Individual Toast Component
const ToastItem = ({ id, message, variant = "info", duration = 4000, onDismiss }) => {
    const [progress, setProgress] = useState(100);
    const config = variants[variant] || variants.info;
    const Icon = config.icon;

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                onDismiss(id);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration, id, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={clsx(
                "relative overflow-hidden rounded-2xl shadow-2xl min-w-[300px] max-w-md",
                config.bg
            )}
        >
            <div className="flex items-center gap-3 p-4 pr-10 text-white">
                <div className="flex-shrink-0">
                    <Icon className={clsx("w-6 h-6", config.iconColor)} />
                </div>
                <p className="font-medium text-sm leading-snug">{message}</p>
            </div>

            {/* Dismiss button */}
            <button
                onClick={() => onDismiss(id)}
                className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
                aria-label="Dismiss notification"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1">
                <motion.div
                    className={clsx("h-full", config.progressColor)}
                    initial={{ width: "100%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.05, ease: "linear" }}
                />
            </div>
        </motion.div>
    );
};

// Toast Container Component
export const ToastContainer = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, variant = "info", duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, variant, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, "success", duration),
        error: (message, duration) => addToast(message, "error", duration),
        warning: (message, duration) => addToast(message, "warning", duration),
        info: (message, duration) => addToast(message, "info", duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast Stack */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem
                                id={t.id}
                                message={t.message}
                                variant={t.variant}
                                duration={t.duration}
                                onDismiss={removeToast}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a fallback that logs to console if not wrapped in provider
        return {
            success: (msg) => console.log("Toast (success):", msg),
            error: (msg) => console.error("Toast (error):", msg),
            warning: (msg) => console.warn("Toast (warning):", msg),
            info: (msg) => console.log("Toast (info):", msg),
        };
    }
    return context;
};

export default ToastItem;
