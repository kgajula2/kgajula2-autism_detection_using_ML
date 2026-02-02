import { motion } from "framer-motion";
import clsx from "clsx";

 

const variants = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    primary: "bg-blue-100 text-blue-700 border-blue-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    error: "bg-red-100 text-red-700 border-red-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    pink: "bg-pink-100 text-pink-700 border-pink-200",

     
    "solid-primary": "bg-blue-500 text-white border-blue-500",
    "solid-success": "bg-emerald-500 text-white border-emerald-500",
    "solid-warning": "bg-amber-500 text-white border-amber-500",
    "solid-error": "bg-red-500 text-white border-red-500",
    "solid-purple": "bg-purple-500 text-white border-purple-500",

     
    "gradient-primary": "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-none",
    "gradient-purple": "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none",
    "gradient-success": "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none",
};

const sizes = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
};

export const Badge = ({
    children,
    variant = "default",
    size = "sm",
    pulse = false,
    dot = false,
    pill = true,
    className,
    ...props
}) => {
    return (
        <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={clsx(
                "inline-flex items-center gap-1.5 font-semibold border",
                variants[variant],
                sizes[size],
                pill ? "rounded-full" : "rounded-md",
                pulse && "animate-heartbeat",
                className
            )}
            {...props}
        >
            {dot && (
                <span
                    className={clsx(
                        "w-1.5 h-1.5 rounded-full",
                        variant.includes("solid") || variant.includes("gradient")
                            ? "bg-white"
                            : "bg-current"
                    )}
                />
            )}
            {children}
        </motion.span>
    );
};

 
export const StatusBadge = ({ status, showDot = true, size = "sm" }) => {
    const statusConfig = {
        online: { variant: "success", label: "Online" },
        offline: { variant: "default", label: "Offline" },
        busy: { variant: "warning", label: "Busy" },
        away: { variant: "warning", label: "Away" },
        playing: { variant: "gradient-primary", label: "Playing", pulse: true },
        completed: { variant: "gradient-success", label: "Completed" },
        pending: { variant: "warning", label: "Pending" },
        error: { variant: "error", label: "Error" },
        new: { variant: "gradient-purple", label: "New", pulse: true },
    };

    const config = statusConfig[status] || { variant: "default", label: status };

    return (
        <Badge
            variant={config.variant}
            size={size}
            dot={showDot}
            pulse={config.pulse}
        >
            {config.label}
        </Badge>
    );
};

 
export const CountBadge = ({ count, max = 99, variant = "solid-error", size = "xs" }) => {
    const displayCount = count > max ? `${max}+` : count;

    if (count <= 0) return null;

    return (
        <Badge variant={variant} size={size} pill>
            {displayCount}
        </Badge>
    );
};

export default Badge;
