import { motion } from "framer-motion";
import clsx from "clsx";

 
export const Card = ({
    children,
    className,
    glass = false,
    delay = 0,
    onClick,
    ariaLabel,
    ...props
}) => {
    const isInteractive = !!onClick;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={clsx(
                "rounded-2xl p-6",
                glass ? "glass-card" : "bg-white dark:bg-slate-800 shadow-xl rounded-2xl",
                isInteractive && "cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2",
                className
            )}
            onClick={onClick}
            role={isInteractive ? "button" : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            aria-label={ariaLabel}
            onKeyDown={isInteractive ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            } : undefined}
            {...props}
        >
            {children}
        </motion.div>
    );
};
