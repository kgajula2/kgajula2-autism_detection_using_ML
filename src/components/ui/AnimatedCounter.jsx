import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * AnimatedCounter Component
 * Smooth count-up animation for dashboard statistics
 * Uses pure React state to avoid framer-motion hook issues with React 19
 */

export const AnimatedCounter = ({
    value,
    duration = 1.5,
    delay = 0,
    format = "number", // "number" | "percentage" | "currency" | "decimal"
    decimals = 0,
    prefix = "",
    suffix = "",
    className,
    onComplete,
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef(null);
    const startTimeRef = useRef(null);
    const animationRef = useRef(null);

    // Format the display value
    const formatValue = (num) => {
        const numValue = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
        switch (format) {
            case "percentage":
                return `${numValue.toFixed(decimals)}%`;
            case "currency":
                return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: decimals })}`;
            case "decimal":
                return numValue.toFixed(decimals);
            default:
                return Math.round(numValue).toLocaleString('en-US');
        }
    };

    // Easing function for smooth animation
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    // Animation loop using requestAnimationFrame
    const animate = (timestamp) => {
        if (!startTimeRef.current) {
            startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const easedProgress = easeOutQuart(progress);

        setDisplayValue(easedProgress * value);

        if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            setDisplayValue(value);
            if (onComplete) onComplete();
        }
    };

    // Intersection observer for triggering animation when visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                    setTimeout(() => {
                        animationRef.current = requestAnimationFrame(animate);
                    }, delay * 1000);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, hasStarted, delay]);

    // Update when value changes after initial animation
    useEffect(() => {
        if (hasStarted) {
            setDisplayValue(value);
        }
    }, [value, hasStarted]);

    return (
        <span
            ref={ref}
            className={clsx("tabular-nums inline-block", className)}
        >
            {prefix}{formatValue(displayValue)}{suffix}
        </span>
    );
};

/**
 * StatCard with AnimatedCounter
 * Ready-to-use dashboard stat card
 */
export const AnimatedStatCard = ({
    label,
    value,
    icon: Icon,
    format = "number",
    trend,
    trendLabel,
    color = "purple",
    delay = 0,
}) => {
    const colors = {
        purple: "from-purple-500 to-indigo-500",
        blue: "from-blue-500 to-cyan-500",
        green: "from-emerald-500 to-teal-500",
        orange: "from-orange-500 to-amber-500",
        pink: "from-pink-500 to-rose-500",
        red: "from-red-500 to-rose-500",
    };

    const trendColor = trend > 0 ? "text-emerald-400" : trend < 0 ? "text-red-400" : "text-white/60";
    const trendIcon = trend > 0 ? "↑" : trend < 0 ? "↓" : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className={clsx(
                "relative overflow-hidden rounded-3xl p-6 text-white shadow-xl",
                "bg-gradient-to-br",
                colors[color]
            )}
        >
            {/* Background Icon */}
            {Icon && (
                <Icon className="absolute top-4 right-4 w-20 h-20 opacity-20" />
            )}

            {/* Content */}
            <div className="relative z-10">
                <p className="text-white/80 text-sm font-medium mb-2">{label}</p>
                <div className="flex items-end gap-2">
                    <AnimatedCounter
                        value={value}
                        format={format}
                        delay={delay + 0.3}
                        className="text-4xl font-black"
                    />
                    {trend !== undefined && (
                        <span className={clsx("text-sm font-bold mb-1", trendColor)}>
                            {trendIcon} {Math.abs(trend)}% {trendLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </motion.div>
    );
};

/**
 * Compact Counter for inline use
 */
export const CompactCounter = ({ value, label, className }) => {
    return (
        <div className={clsx("flex items-center gap-2", className)}>
            <AnimatedCounter
                value={value}
                className="text-2xl font-bold"
                duration={1}
            />
            {label && <span className="text-sm text-gray-500">{label}</span>}
        </div>
    );
};

export default AnimatedCounter;
