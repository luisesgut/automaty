// components/tarimas/SelectedTarimasPreview.tsx
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, X, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Tarima, TarimasStats } from "@/types";
import TarimasStatsComponent from "./TarimasStats";

interface SelectedTarimasPreviewProps {
    selectedTarimas: Tarima[];
    stats: TarimasStats;
    onRemoveTarima: (tarima: Tarima) => void;
    onClearProcessedTarimas?: () => void; // NUEVA PROP
    weightInfo?: {
        totalPesoBruto: number;
        pesoMaximo: number;
        porcentajeUsado: number;
        pesoRestante: number;
        cercaDelLimite: boolean;
        enLimite: boolean;
    };
}

export default function SelectedTarimasPreview({
                                                   selectedTarimas,
                                                   stats,
                                                   onRemoveTarima,
                                                   onClearProcessedTarimas,
                                                   weightInfo
                                               }: SelectedTarimasPreviewProps) {
    
    // NUEVO: Detectar tarimas procesadas y limpiarlas automáticamente
    useEffect(() => {
        const tarimasAsignadas = selectedTarimas.filter(tarima => tarima.asignadoAentrega);
        
        if (tarimasAsignadas.length > 0 && onClearProcessedTarimas) {
            // Esperar un momento para que el usuario vea el cambio, luego limpiar
            const timer = setTimeout(() => {
                onClearProcessedTarimas();
            }, 2000); // 2 segundos de delay para que el usuario vea el cambio

            return () => clearTimeout(timer);
        }
    }, [selectedTarimas, onClearProcessedTarimas]);

    if (selectedTarimas.length === 0) return null;

    // Separar tarimas por estado
    const tarimasPendientes = selectedTarimas.filter(tarima => !tarima.asignadoAentrega);
    const tarimasAsignadas = selectedTarimas.filter(tarima => tarima.asignadoAentrega);

    // Función para limpiar manualmente las tarimas procesadas
    const handleClearProcessed = () => {
        if (onClearProcessedTarimas) {
            onClearProcessedTarimas();
        }
    };

    return (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple/5 dark:from-primary/10 dark:to-purple/10 dark:border-primary/40 shadow-xl">
            <CardHeader className="pb-4 pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-xl flex items-center">
                            <div className="bg-primary/20 p-2 rounded-lg mr-3">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            Tarimas Seleccionadas ({selectedTarimas.length})
                            {tarimasAsignadas.length > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    {tarimasAsignadas.length} procesada(s)
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {tarimasAsignadas.length > 0 ? (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                    ✅ {tarimasAsignadas.length} tarima(s) procesada(s) exitosamente. Se limpiarán automáticamente en unos segundos.
                                </span>
                            ) : (
                                <>
                                    Resumen de las tarimas seleccionadas para procesamiento
                                    {weightInfo && weightInfo.cercaDelLimite && (
                                        <span className={`ml-2 ${weightInfo.enLimite ? 'text-red-600' : 'text-yellow-600'}`}>
                                            • {weightInfo.enLimite ? 'Límite de peso alcanzado' : 'Acercándose al límite de peso'}
                                        </span>
                                    )}
                                </>
                            )}
                        </CardDescription>
                    </div>
                    
                    {/* NUEVO: Botón para limpiar tarimas procesadas manualmente */}
                    {tarimasAsignadas.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearProcessed}
                            className="ml-4 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/40"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Limpiar Procesadas
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* NUEVO: Mostrar mensaje de estado si hay tarimas procesadas */}
                {tarimasAsignadas.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <div>
                                <h4 className="font-medium text-green-800 dark:text-green-200">
                                    Proceso Completado
                                </h4>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    {tarimasAsignadas.length} tarima(s) han sido procesadas y asignadas exitosamente. 
                                    Las tarimas procesadas se eliminarán de la selección automáticamente.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Estadísticas con indicador de peso */}
                <TarimasStatsComponent
                    stats={stats}
                    weightInfo={weightInfo}
                    selectedTarimas={selectedTarimas}
                />

                {/* Lista detallada */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">Detalle de la Selección</h3>
                        {tarimasPendientes.length > 0 && tarimasAsignadas.length > 0 && (
                            <div className="flex gap-2 text-xs">
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                    {tarimasPendientes.length} Pendientes
                                </Badge>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    {tarimasAsignadas.length} Procesadas
                                </Badge>
                            </div>
                        )}
                    </div>
                    
                    <ScrollArea className="h-[280px] rounded-lg border-2 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50">
                        <div className="p-4">
                            {selectedTarimas.map((tarima, index) => (
                                <div key={tarima.prodEtiquetaRFIDId}>
                                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 group hover:bg-slate-50/80 dark:hover:bg-slate-700/40 rounded-lg px-2 transition-all duration-200 ${
                                        tarima.asignadoAentrega ? 'bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-700/30' : ''
                                    }`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className={`font-semibold truncate ${
                                                    tarima.asignadoAentrega 
                                                        ? 'text-green-700 dark:text-green-300' 
                                                        : 'text-slate-900 dark:text-slate-100'
                                                }`} title={tarima.nombreProducto}>
                                                    {tarima.nombreProducto}
                                                </h4>
                                                <Badge
                                                    variant={tarima.asignadoAentrega ? "default" : "destructive"}
                                                    className={`whitespace-nowrap text-xs h-fit py-1 px-2 transition-all duration-200
                                                        ${tarima.asignadoAentrega
                                                            ? "bg-green-100 border-green-300 text-green-800 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                                                            : "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"}`}
                                                >
                                                    {tarima.asignadoAentrega ? (
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                    )}
                                                    {tarima.asignadoAentrega ? "✅ Procesado" : "⏳ Pendiente"}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-7 gap-2 text-xs text-muted-foreground">
                                                <div className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                                                    <span className="font-medium">Lote:</span> {tarima.lote}
                                                </div>
                                                <div className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                                                    <span className="font-medium">Item:</span> {tarima.itemNumber}
                                                </div>
                                                <div className="bg-blue-100 dark:bg-blue-700 rounded px-2 py-1">
                                                    <span className="font-medium">Cajas:</span> {tarima.cajas}
                                                </div>
                                                <div className="bg-indigo-100 dark:bg-indigo-700 rounded px-2 py-1">
                                                    <span className="font-medium">Pzs/Caja:</span> {tarima.individualUnits?.toLocaleString() || "N/A"}
                                                </div>
                                                <div className="bg-green-100 dark:bg-green-700 rounded px-2 py-1">
                                                    <span className="font-medium">Total:</span> {tarima.totalUnits?.toLocaleString() || "N/A"}
                                                </div>
                                                <div className="bg-yellow-100 dark:bg-yellow-700 rounded px-2 py-1">
                                                    <span className="font-medium">Peso:</span> {(tarima.pesoBruto / 1000).toFixed(1)}T
                                                </div>
                                                <div className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                                                    <span className="font-medium">RFID:</span> {tarima.prodEtiquetaRFIDId}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`mt-2 sm:mt-0 hover:bg-red-100/50 dark:hover:bg-red-500/10 px-3 py-2 self-start sm:self-center opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                                                tarima.asignadoAentrega 
                                                    ? 'text-green-600 hover:text-green-700' 
                                                    : 'text-red-500 hover:text-red-600'
                                            }`}
                                            onClick={() => onRemoveTarima(tarima)}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            {tarima.asignadoAentrega ? 'Remover' : 'Quitar'}
                                        </Button>
                                    </div>
                                    {index < selectedTarimas.length - 1 && (
                                        <Separator className="dark:bg-slate-600 my-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}