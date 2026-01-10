import { motion } from "framer-motion";
import clsx from "clsx";

export const Card = ({ children, className, glass = false, delay = 0, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={clsx(
                "rounded-2xl p-6",
                glass ? "glass-card" : "bg-white shadow-xl rounded-2xl",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
