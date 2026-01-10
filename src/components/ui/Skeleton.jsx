export function Skeleton({ className = '', variant = 'default' }) {
    const baseClasses = 'skeleton rounded-lg animate-pulse';

    const variants = {
        default: 'h-4 bg-gray-200 dark:bg-gray-700',
        circle: 'rounded-full bg-gray-200 dark:bg-gray-700',
        card: 'h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl',
        text: 'h-4 bg-gray-200 dark:bg-gray-700 rounded',
        title: 'h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2',
        avatar: 'w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700',
        button: 'h-10 bg-gray-200 dark:bg-gray-700 rounded-full w-32',
    };

    return (
        <div className={`${baseClasses} ${variants[variant] || variants.default} ${className}`} />
    );
}

export function SkeletonCard() {
    return (
        <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-800/50 space-y-4">
            <Skeleton variant="title" />
            <Skeleton className="w-full" />
            <Skeleton className="w-3/4" />
            <Skeleton className="w-1/2" />
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center">
                <Skeleton variant="button" />
                <Skeleton variant="title" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-40 rounded-[2.5rem] bg-gray-200 dark:bg-gray-700" />
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                <div className="h-80 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Table */}
            <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>
    );
}

export function SkeletonGameCard() {
    return (
        <div className="p-6 rounded-3xl bg-white/50 dark:bg-slate-800/50 space-y-4 animate-pulse">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 mx-auto" />
            <Skeleton variant="title" className="mx-auto" />
            <Skeleton className="w-3/4 mx-auto" />
            <Skeleton variant="button" className="mx-auto" />
        </div>
    );
}
