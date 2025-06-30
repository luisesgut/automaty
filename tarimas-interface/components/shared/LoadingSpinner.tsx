// components/shared/LoadingSpinner.tsx
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    title?: string;
    description?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export default function LoadingSpinner({
                                           title = "Cargando...",
                                           description = "Por favor espere un momento",
                                           size = "md",
                                           className = ""
                                       }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-12 w-12",
        lg: "h-16 w-16"
    };

    const textSizeClasses = {
        sm: "text-base",
        md: "text-xl",
        lg: "text-2xl"
    };

    return (
        <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${className}`}>
            <div className="relative">
                {/* Spinning circle background */}
                <div className={`${sizeClasses[size]} rounded-full border-4 border-primary/20 animate-pulse`}></div>

                {/* Main spinner */}
                <Loader2 className={`${sizeClasses[size]} animate-spin text-primary absolute inset-0`} />

                {/* Pulsing effect */}
                <div className={`${sizeClasses[size]} rounded-full bg-primary/10 absolute inset-0 animate-ping`}></div>
            </div>

            <div className="mt-6 text-center space-y-2">
                <h2 className={`${textSizeClasses[size]} font-semibold text-slate-800 dark:text-slate-200`}>
                    {title}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    {description}
                </p>
            </div>

            {/* Progress indicator dots */}
            <div className="flex space-x-2 mt-4">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                    />
                ))}
            </div>
        </div>
    );
}