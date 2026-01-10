import { motion } from "framer-motion";
import clsx from "clsx";

export const Button = ({ children, onClick, variant = 'primary', className, disabled, ...props }) => {
    const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-blue-600 text-white shadow-lg hover:shadow-xl hover:bg-blue-700 border-none",
        secondary: "bg-purple-500 text-white shadow-lg hover:shadow-xl hover:bg-purple-600 border-none",
        glass: "glass-card text-blue-900 border border-white/50 hover:bg-white/40",
        neumorph: "neumorph text-gray-700 active:shadow-inner"
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
            {...props}
        >
            {children}
        </motion.button>
    );
};
