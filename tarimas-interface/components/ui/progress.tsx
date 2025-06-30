// components/ui/progress.tsx
import React from "react";

interface ProgressProps {
    value: number;
    className?: string;
    style?: React.CSSProperties;
}

export function Progress({ value, className = "", style }: ProgressProps) {
    const progressValue = Math.min(100, Math.max(0, value));

    const getProgressColor = () => {
        if (progressValue >= 95) return "bg-red-500";
        if (progressValue >= 80) return "bg-yellow-500";
        return "bg-green-500";
    };

    return (
        <div
            className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${className}`}
            style={style}
        >
            <div
                className={`h-full transition-all duration-300 ease-in-out ${getProgressColor()}`}
                style={{ width: `${progressValue}%` }}
            />
        </div>
    );
}