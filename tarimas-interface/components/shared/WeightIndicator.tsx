// components/shared/WeightIndicator.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Scale, Info, TrendingUp, CheckCircle } from "lucide-react";

interface WeightIndicatorProps {
    totalPesoBruto: number;
    pesoMaximo: number;
    porcentajeUsado: number;
    pesoRestante: number;
    cercaDelLimite: boolean;
    enLimite: boolean;
    excedeReferencia?: boolean;
    excesoReferencia?: number;
}

export default function WeightIndicator({
                                            totalPesoBruto,
                                            pesoMaximo,
                                            porcentajeUsado,
                                            pesoRestante,
                                            cercaDelLimite,
                                            enLimite,
                                            excedeReferencia = false,
                                            excesoReferencia = 0
                                        }: WeightIndicatorProps) {
    
    const getStatusInfo = () => {
        if (excedeReferencia) {
            return {
                icon: TrendingUp,
                text: "Por Encima de Referencia",
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
                borderColor: "border-blue-200 dark:border-blue-700",
                textColor: "text-blue-800 dark:text-blue-200",
                progressColor: "#3b82f6" // blue
            };
        }
        if (enLimite) {
            return {
                icon: Info,
                text: "En Límite de Referencia",
                bgColor: "bg-amber-50 dark:bg-amber-900/20",
                borderColor: "border-amber-200 dark:border-amber-700",
                textColor: "text-amber-800 dark:text-amber-200",
                progressColor: "#f59e0b" // amber
            };
        }
        if (cercaDelLimite) {
            return {
                icon: Info,
                text: "Acercándose a Referencia",
                bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
                borderColor: "border-yellow-200 dark:border-yellow-700",
                textColor: "text-yellow-800 dark:text-yellow-200",
                progressColor: "#eab308" // yellow
            };
        }
        return {
            icon: CheckCircle,
            text: "Dentro de Referencia",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            borderColor: "border-green-200 dark:border-green-700",
            textColor: "text-green-800 dark:text-green-200",
            progressColor: "#10b981" // green
        };
    };

    const status = getStatusInfo();
    const StatusIcon = status.icon;

    return (
        <Card className={`${status.bgColor} ${status.borderColor} border-2 transition-all duration-200`}>
            <CardContent className="pt-4 pb-3 px-4">
                <div className="space-y-3">
                    {/* Header con icono y estado */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-full ${status.bgColor}`}>
                                <Scale className={`h-4 w-4 ${status.textColor}`} />
                            </div>
                            <span className="font-semibold text-sm">Información de Peso</span>
                        </div>
                        <Badge variant="outline" className={`${status.textColor} ${status.borderColor} text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.text}
                        </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Peso Actual</span>
                            <span>Referencia: 20T{excedeReferencia ? ` (+${(excesoReferencia / 1000).toFixed(1)}T)` : ""}</span>
                        </div>
                        <Progress
                            value={Math.min(porcentajeUsado, 100)} // Limitar visualmente a 100% en la barra
                            className="h-3"
                            style={{
                                '--progress-background': status.progressColor
                            } as React.CSSProperties}
                        />
                        {/* Mostrar porcentaje real si excede 100% */}
                        {porcentajeUsado > 100 && (
                            <div className="text-right text-xs text-muted-foreground">
                                Real: {porcentajeUsado.toFixed(0)}%
                            </div>
                        )}
                    </div>

                    {/* Información detallada */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-xl font-bold">{(totalPesoBruto / 1000).toFixed(1)}T</p>
                            <p className="text-xs text-muted-foreground">Actual</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold">{Math.min(porcentajeUsado, 999).toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">vs Referencia</p>
                        </div>
                        <div>
                            {excedeReferencia ? (
                                <>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        +{(excesoReferencia / 1000).toFixed(1)}T
                                    </p>
                                    <p className="text-xs text-muted-foreground">Exceso</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-xl font-bold">{(pesoRestante / 1000).toFixed(1)}T</p>
                                    <p className="text-xs text-muted-foreground">Hasta Ref.</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Información contextual */}
                    <div className={`text-xs p-2 rounded ${status.bgColor} ${status.textColor} text-center`}>
                        {excedeReferencia
                            ? `ℹ️ Peso por encima de la referencia de 20T. El sistema permite continuar agregando tarimas.`
                            : enLimite
                            ? "ℹ️ Has alcanzado la referencia de peso de 20T. Puedes continuar agregando más tarimas."
                            : cercaDelLimite
                            ? `ℹ️ Te acercas a la referencia. Quedan ${(pesoRestante / 1000).toFixed(1)}T para llegar a 20T.`
                            : "✅ Peso dentro del rango de referencia normal."
                        }
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}