import { motion } from "framer-motion";
import clsx from "clsx";

 
export const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    ariaLabel,
    type = 'button',
    loading = false,
    ...props
}) => {
    const baseStyles = "relative rounded-xl font-bold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-offset-2 overflow-hidden";

    const variants = {
        primary: "bg-blue-600 text-white shadow-lg hover:shadow-xl hover:bg-blue-700 border-none focus:ring-blue-300",
        secondary: "bg-purple-500 text-white shadow-lg hover:shadow-xl hover:bg-purple-600 border-none focus:ring-purple-300",
        ghost: "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-300",
        glass: "glass-card text-blue-900 dark:text-white border border-white/50 hover:bg-white/40 focus:ring-blue-200",
        neumorph: "neumorph text-gray-700 active:shadow-inner focus:ring-gray-300",

         
        glow: "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none shadow-lg glow-pulse hover:shadow-2xl focus:ring-purple-300",
        gradient: "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-none shadow-xl hover:shadow-2xl hover:saturate-150 focus:ring-purple-300",
        "gradient-success": "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none shadow-lg hover:shadow-xl focus:ring-emerald-300",
        "gradient-danger": "bg-gradient-to-r from-red-500 to-rose-500 text-white border-none shadow-lg hover:shadow-xl focus:ring-red-300",
        "outline-gradient": "bg-transparent text-purple-600 dark:text-purple-400 border-2 border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:ring-purple-300",
    };

    const sizes = {
        xs: "px-3 py-1.5 text-xs",
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        xl: "px-10 py-5 text-xl",
    };

    return (
        <motion.button
            whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
            whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
            className={clsx(
                baseStyles,
                variants[variant],
                sizes[size],
                (disabled || loading) && "opacity-50 cursor-not-allowed grayscale",
                className
            )}
            onClick={!disabled && !loading ? onClick : undefined}
            disabled={disabled || loading}
            type={type}
            aria-label={ariaLabel}
            aria-disabled={disabled || loading}
            aria-busy={loading}
            role="button"
            tabIndex={disabled ? -1 : 0}
            {...props}
        >
            { }
            {loading && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-inherit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </motion.div>
            )}

            { }
            <span className={clsx(loading && "opacity-0")}>
                {children}
            </span>

            { }
            {(variant === 'gradient' || variant === 'glow') && !disabled && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                    animate={{ x: ["0%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
            )}
        </motion.button>
    );
};
