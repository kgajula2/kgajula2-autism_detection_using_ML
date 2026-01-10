import clsx from "clsx";

export const Title = ({ children, className }) => (
    <h1 className={clsx("text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 drop-shadow-sm", className)}>
        {children}
    </h1>
);

export const SubTitle = ({ children, className }) => (
    <h2 className={clsx("text-xl md:text-2xl font-semibold text-gray-600 dark:text-gray-300", className)}>
        {children}
    </h2>
);

