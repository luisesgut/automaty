// components/tarimas/TarimasStats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Package, BarChart3, Truck, CheckCircle, Calculator, Layers } from "lucide-react";
import { TarimasStats } from "@/types";
import WeightIndicator from "../shared/WeightIndicator";

interface TarimasStatsProps {
    stats: TarimasStats;
    weightInfo?: {
        totalPesoBruto: number;
        pesoMaximo: number;
        porcentajeUsado: number;
        pesoRestante: number;
        cercaDelLimite: boolean;
        enLimite: boolean;
    };
    selectedTarimas?: any[]; // Para calcular estadísticas de unidades
}

export default function TarimasStatsComponent({ stats, weightInfo, selectedTarimas = [] }: TarimasStatsProps) {
    // Calcular estadísticas de unidades
    const totalIndividualUnits = selectedTarimas.reduce((sum, t) => sum + (t.individualUnits || 0), 0);
    const totalUnitsGlobal = selectedTarimas.reduce((sum, t) => sum + (t.totalUnits || 0), 0);
    const averageUnitsPerBox = selectedTarimas.length > 0
        ? Math.round(totalIndividualUnits / selectedTarimas.length)
        : 0;

    const statCards = [
        {
            title: "Total Cajas",
            value: stats.totalCajas.toLocaleString(),
            subtitle: `${selectedTarimas.length} tarimas`,
            icon: Package,
            color: "blue",
            bgColor: "bg-blue-50 dark:bg-blue-500/10",
            iconColor: "text-blue-600 dark:text-blue-400",
            borderColor: "border-blue-200 dark:border-blue-500/30"
        },
        {
            title: "Piezas por Caja",
            value: averageUnitsPerBox > 0 ? averageUnitsPerBox.toLocaleString() : "N/A",
            subtitle: "Promedio",
            icon: Calculator,
            color: "indigo",
            bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
            iconColor: "text-indigo-600 dark:text-indigo-400",
            borderColor: "border-indigo-200 dark:border-indigo-500/30"
        },
        {
            title: "Total Unidades",
            value: totalUnitsGlobal.toLocaleString(),
            subtitle: "Piezas totales",
            icon: Layers,
            color: "green",
            bgColor: "bg-green-50 dark:bg-green-500/10",
            iconColor: "text-green-600 dark:text-green-400",
            borderColor: "border-green-200 dark:border-green-500/30"
        },
        {
            title: "Cantidad",
            value: stats.cantidadFormateada,
            subtitle: stats.unidadPredominante,
            icon: BarChart3,
            color: "emerald",
            bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
            iconColor: "text-emerald-600 dark:text-emerald-400",
            borderColor: "border-emerald-200 dark:border-emerald-500/30"
        },
        {
            title: "Peso Bruto",
            value: `${stats.totalPesoBruto.toLocaleString()} kg`,
            subtitle: `${(stats.totalPesoBruto / 1000).toFixed(1)}T`,
            icon: Truck,
            color: "yellow",
            bgColor: "bg-yellow-50 dark:bg-yellow-500/10",
            iconColor: "text-yellow-600 dark:text-yellow-400",
            borderColor: "border-yellow-200 dark:border-yellow-500/30"
        },
        {
            title: "Peso Neto",
            value: `${stats.totalPesoNeto.toLocaleString()} kg`,
            subtitle: `${(stats.totalPesoNeto / 1000).toFixed(1)}T`,
            icon: CheckCircle,
            color: "purple",
            bgColor: "bg-purple-50 dark:bg-purple-500/10",
            iconColor: "text-purple-600 dark:text-purple-400",
            borderColor: "border-purple-200 dark:border-purple-500/30"
        }
    ];

    return (
        <div className="space-y-4">
            {/* Indicador de peso (si se proporciona la información) */}
            {weightInfo && (
                <WeightIndicator {...weightInfo} />
            )}

            {/* Estadísticas regulares */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card
                            key={stat.title}
                            className={`${stat.bgColor} ${stat.borderColor} border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                        >
                            <CardContent className="pt-4 pb-3 px-4">
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <div className={`${stat.bgColor} p-3 rounded-full border ${stat.borderColor} shadow-sm`}>
                                        <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                        <p className="text-xl font-bold tracking-tight" style={{ wordBreak: "break-word" }}>
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}