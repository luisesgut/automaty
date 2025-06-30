// components/shared/WeightIndicator.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Scale, AlertTriangle, CheckCircle } from "lucide-react";

interface WeightIndicatorProps {
    totalPesoBruto: number;
    pesoMaximo: number;
    porcentajeUsado: number;
    pesoRestante: number;
    cercaDelLimite: boolean;
    enLimite: boolean;
}

export default function WeightIndicator({
                                            totalPesoBruto,
                                            pesoMaximo,
                                            porcentajeUsado,
                                            pesoRestante,
                                            cercaDelLimite,
                                            enLimite
                                        }: WeightIndicatorProps) {
    const getStatusColor = () => {
        if (enLimite) return "red";
        if (cercaDelLimite) return "yellow";
        return "green";
    };

    const getStatusInfo = () => {
        if (enLimite) {
            return {
                icon: AlertTriangle,
                text: "Límite Crítico",
                bgColor: "bg-red-50 dark:bg-red-900/20",
                borderColor: "border-red-200 dark:border-red-700",
                textColor: "text-red-800 dark:text-red-200"
            };
        }
        if (cercaDelLimite) {
            return {
                icon: AlertTriangle,
                text: "Acercándose al Límite",
                bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
                borderColor: "border-yellow-200 dark:border-yellow-700",
                textColor: "text-yellow-800 dark:text-yellow-200"
            };
        }
        return {
            icon: CheckCircle,
            text: "Capacidad Normal",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            borderColor: "border-green-200 dark:border-green-700",
            textColor: "text-green-800 dark:text-green-200"
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
                            <span className="font-semibold text-sm">Control de Peso</span>
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
                            <span>Límite: 20T</span>
                        </div>
                        <Progress
                            value={porcentajeUsado}
                            className="h-3"
                            style={{
                                '--progress-background': getStatusColor() === 'red' ? '#ef4444' :
                                    getStatusColor() === 'yellow' ? '#f59e0b' : '#10b981'
                            } as React.CSSProperties}
                        />
                    </div>

                    {/* Información detallada */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-xl font-bold">{(totalPesoBruto / 1000).toFixed(1)}T</p>
                            <p className="text-xs text-muted-foreground">Actual</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold">{porcentajeUsado.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">Usado</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold">{(pesoRestante / 1000).toFixed(1)}T</p>
                            <p className="text-xs text-muted-foreground">Restante</p>
                        </div>
                    </div>

                    {/* Advertencia si está cerca del límite */}
                    {cercaDelLimite && (
                        <div className={`text-xs p-2 rounded ${status.bgColor} ${status.textColor} text-center`}>
                            {enLimite
                                ? "⚠️ Has alcanzado el límite de peso. No se pueden agregar más tarimas."
                                : `⚠️ Te acercas al límite. Solo puedes agregar ${(pesoRestante / 1000).toFixed(1)}T más.`
                            }
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}