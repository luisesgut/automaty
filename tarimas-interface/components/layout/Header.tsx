// components/layout/Header.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2 } from "lucide-react";

interface HeaderProps {
    totalTarimas: number;
    onRefresh: () => void;
    isLoading: boolean;
}

export default function Header({ totalTarimas, onRefresh, isLoading }: HeaderProps) {
    return (
        <header className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 sticky top-0 z-20 shadow-sm">
            <div className="container mx-auto py-4 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Sistema de Gestión de Tarimas
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestiona y procesa tu inventario de manera eficiente
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="text-sm px-3 py-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {totalTarimas} tarimas disponibles
                        </Badge>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="transition-all duration-200 hover:scale-105"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            {isLoading ? "Actualizando..." : "Actualizar"}
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}