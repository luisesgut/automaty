// components/tarimas/SelectedTarimasPreview.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, X, CheckCircle, AlertCircle } from "lucide-react";
import { Tarima, TarimasStats } from "@/types";
import TarimasStatsComponent from "./TarimasStats";

interface SelectedTarimasPreviewProps {
    selectedTarimas: Tarima[];
    stats: TarimasStats;
    onRemoveTarima: (tarima: Tarima) => void;
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
                                                   weightInfo
                                               }: SelectedTarimasPreviewProps) {
    if (selectedTarimas.length === 0) return null;

    return (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple/5 dark:from-primary/10 dark:to-purple/10 dark:border-primary/40 shadow-xl">
            <CardHeader className="pb-4 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center">
                            <div className="bg-primary/20 p-2 rounded-lg mr-3">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            Tarimas Seleccionadas ({selectedTarimas.length})
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Resumen de las tarimas seleccionadas para procesamiento
                            {weightInfo && weightInfo.cercaDelLimite && (
                                <span className={`ml-2 ${weightInfo.enLimite ? 'text-red-600' : 'text-yellow-600'}`}>
                  • {weightInfo.enLimite ? 'Límite de peso alcanzado' : 'Acercándose al límite de peso'}
                </span>
                            )}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Estadísticas con indicador de peso */}
                <TarimasStatsComponent
                    stats={stats}
                    weightInfo={weightInfo}
                    selectedTarimas={selectedTarimas}
                />

                {/* Lista detallada */}
                <div>
                    <h3 className="font-semibold mb-3 text-lg">Detalle de la Selección</h3>
                    <ScrollArea className="h-[280px] rounded-lg border-2 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50">
                        <div className="p-4">
                            {selectedTarimas.map((tarima, index) => (
                                <div key={tarima.prodEtiquetaRFIDId}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 group hover:bg-slate-50/80 dark:hover:bg-slate-700/40 rounded-lg px-2 transition-all duration-200">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-semibold truncate text-slate-900 dark:text-slate-100" title={tarima.nombreProducto}>
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
                                                    {tarima.asignadoAentrega ? "Asignado" : "Pendiente"}
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
                                            className="mt-2 sm:mt-0 text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-500/10 px-3 py-2 self-start sm:self-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            onClick={() => onRemoveTarima(tarima)}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Quitar
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