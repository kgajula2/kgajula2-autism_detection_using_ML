import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * Accessible Button Component
 * Includes ARIA support, focus indicators, and keyboard navigation
 */
export const Button = ({
    children,
    onClick,
    variant = 'primary',
    className,
    disabled,
    ariaLabel,
    type = 'button',
    ...props
}) => {
    const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-offset-2";

    const variants = {
        primary: "bg-blue-600 text-white shadow-lg hover:shadow-xl hover:bg-blue-700 border-none focus:ring-blue-300",
        secondary: "bg-purple-500 text-white shadow-lg hover:shadow-xl hover:bg-purple-600 border-none focus:ring-purple-300",
        ghost: "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-300",
        glass: "glass-card text-blue-900 border border-white/50 hover:bg-white/40 focus:ring-blue-200",
        neumorph: "neumorph text-gray-700 active:shadow-inner focus:ring-gray-300"
    };

    return (
        <motion.button
            whileTap={!disabled ? { scale: 0.95 } : {}}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            className={clsx(
                baseStyles,
                variants[variant],
                disabled && "opacity-50 cursor-not-allowed grayscale",
                className
            )}
            onClick={!disabled ? onClick : undefined}
            disabled={disabled}
            type={type}
            aria-label={ariaLabel}
            aria-disabled={disabled}
            role="button"
            tabIndex={disabled ? -1 : 0}
            {...props}
        >
            {children}
        </motion.button>
    );
};
