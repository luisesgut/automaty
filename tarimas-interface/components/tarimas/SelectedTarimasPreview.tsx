// components/tarimas/SelectedTarimasPreview.tsx
import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, X, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Tarima, TarimasStats } from "@/types";
import { formatNumber, formatString, coerceBoolean } from "@/utils/formatters";
import TarimasStatsComponent from "./TarimasStats";

const PRODUCT_COLOR_PALETTE = [
    {
        id: "emerald",
        container: "border-emerald-300/60 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-900/10",
        headerText: "text-emerald-700 dark:text-emerald-300",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
        chip: "bg-emerald-100/70 dark:bg-emerald-500/15",
        chipText: "text-emerald-700 dark:text-emerald-200",
        dot: "bg-emerald-400 dark:bg-emerald-500",
        rowBackground: "bg-emerald-50/60 dark:bg-emerald-900/20",
        rowBorder: "border-emerald-200/60 dark:border-emerald-600/40",
        rowHover: "hover:bg-emerald-100/70 dark:hover:bg-emerald-800/30",
        separator: "bg-emerald-200/60 dark:bg-emerald-600/40"
    },
    {
        id: "sky",
        container: "border-sky-300/60 dark:border-sky-500/40 bg-sky-50/70 dark:bg-sky-900/10",
        headerText: "text-sky-700 dark:text-sky-300",
        badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
        chip: "bg-sky-100/70 dark:bg-sky-500/15",
        chipText: "text-sky-700 dark:text-sky-200",
        dot: "bg-sky-400 dark:bg-sky-500",
        rowBackground: "bg-sky-50/60 dark:bg-sky-900/20",
        rowBorder: "border-sky-200/60 dark:border-sky-600/40",
        rowHover: "hover:bg-sky-100/70 dark:hover:bg-sky-800/30",
        separator: "bg-sky-200/60 dark:bg-sky-600/40"
    },
    {
        id: "amber",
        container: "border-amber-300/60 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/10",
        headerText: "text-amber-700 dark:text-amber-300",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
        chip: "bg-amber-100/70 dark:bg-amber-500/15",
        chipText: "text-amber-700 dark:text-amber-200",
        dot: "bg-amber-400 dark:bg-amber-500",
        rowBackground: "bg-amber-50/60 dark:bg-amber-900/20",
        rowBorder: "border-amber-200/60 dark:border-amber-600/40",
        rowHover: "hover:bg-amber-100/70 dark:hover:bg-amber-800/30",
        separator: "bg-amber-200/60 dark:bg-amber-600/40"
    },
    {
        id: "violet",
        container: "border-violet-300/60 dark:border-violet-500/40 bg-violet-50/70 dark:bg-violet-900/10",
        headerText: "text-violet-700 dark:text-violet-300",
        badge: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
        chip: "bg-violet-100/70 dark:bg-violet-500/15",
        chipText: "text-violet-700 dark:text-violet-200",
        dot: "bg-violet-400 dark:bg-violet-500",
        rowBackground: "bg-violet-50/60 dark:bg-violet-900/20",
        rowBorder: "border-violet-200/60 dark:border-violet-600/40",
        rowHover: "hover:bg-violet-100/70 dark:hover:bg-violet-800/30",
        separator: "bg-violet-200/60 dark:bg-violet-600/40"
    },
    {
        id: "rose",
        container: "border-rose-300/60 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-900/10",
        headerText: "text-rose-700 dark:text-rose-300",
        badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
        chip: "bg-rose-100/70 dark:bg-rose-500/15",
        chipText: "text-rose-700 dark:text-rose-200",
        dot: "bg-rose-400 dark:bg-rose-500",
        rowBackground: "bg-rose-50/60 dark:bg-rose-900/20",
        rowBorder: "border-rose-200/60 dark:border-rose-600/40",
        rowHover: "hover:bg-rose-100/70 dark:hover:bg-rose-800/30",
        separator: "bg-rose-200/60 dark:bg-rose-600/40"
    },
    {
        id: "cyan",
        container: "border-cyan-300/60 dark:border-cyan-500/40 bg-cyan-50/70 dark:bg-cyan-900/10",
        headerText: "text-cyan-700 dark:text-cyan-300",
        badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200",
        chip: "bg-cyan-100/70 dark:bg-cyan-500/15",
        chipText: "text-cyan-700 dark:text-cyan-200",
        dot: "bg-cyan-400 dark:bg-cyan-500",
        rowBackground: "bg-cyan-50/60 dark:bg-cyan-900/20",
        rowBorder: "border-cyan-200/60 dark:border-cyan-600/40",
        rowHover: "hover:bg-cyan-100/70 dark:hover:bg-cyan-800/30",
        separator: "bg-cyan-200/60 dark:bg-cyan-600/40"
    },
    {
        id: "lime",
        container: "border-lime-300/60 dark:border-lime-500/40 bg-lime-50/70 dark:bg-lime-900/10",
        headerText: "text-lime-700 dark:text-lime-300",
        badge: "bg-lime-100 text-lime-800 dark:bg-lime-500/20 dark:text-lime-200",
        chip: "bg-lime-100/70 dark:bg-lime-500/15",
        chipText: "text-lime-700 dark:text-lime-200",
        dot: "bg-lime-400 dark:bg-lime-500",
        rowBackground: "bg-lime-50/60 dark:bg-lime-900/20",
        rowBorder: "border-lime-200/60 dark:border-lime-600/40",
        rowHover: "hover:bg-lime-100/70 dark:hover:bg-lime-800/30",
        separator: "bg-lime-200/60 dark:bg-lime-600/40"
    },
    {
        id: "indigo",
        container: "border-indigo-300/60 dark:border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-900/10",
        headerText: "text-indigo-700 dark:text-indigo-300",
        badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
        chip: "bg-indigo-100/70 dark:bg-indigo-500/15",
        chipText: "text-indigo-700 dark:text-indigo-200",
        dot: "bg-indigo-400 dark:bg-indigo-500",
        rowBackground: "bg-indigo-50/60 dark:bg-indigo-900/20",
        rowBorder: "border-indigo-200/60 dark:border-indigo-600/40",
        rowHover: "hover:bg-indigo-100/70 dark:hover:bg-indigo-800/30",
        separator: "bg-indigo-200/60 dark:bg-indigo-600/40"
    }
];

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
        const tarimasAsignadas = selectedTarimas.filter(tarima => coerceBoolean(tarima.asignadoAentrega));
        
        if (tarimasAsignadas.length > 0 && onClearProcessedTarimas) {
            // Esperar un momento para que el usuario vea el cambio, luego limpiar
            const timer = setTimeout(() => {
                onClearProcessedTarimas();
            }, 2000); // 2 segundos de delay para que el usuario vea el cambio

            return () => clearTimeout(timer);
        }
    }, [selectedTarimas, onClearProcessedTarimas]);

    if (selectedTarimas.length === 0) return null;

    const sortedTarimas = useMemo(() => (
        [...selectedTarimas].sort((a, b) =>
            (a.nombreProducto ?? "").localeCompare(b.nombreProducto ?? "", "es", { sensitivity: "base" })
        )
    ), [selectedTarimas]);

    const productGroups = useMemo(() => {
        const groupsMap = new Map<string, { nombreProducto: string; itemNumber: string; tarimas: Tarima[] }>();

        sortedTarimas.forEach((tarima) => {
            const key = tarima.itemNumber || tarima.nombreProducto || String(tarima.prodEtiquetaRFIDId);

            if (!groupsMap.has(key)) {
                groupsMap.set(key, {
                    nombreProducto: tarima.nombreProducto,
                    itemNumber: tarima.itemNumber,
                    tarimas: []
                });
            }

            groupsMap.get(key)?.tarimas.push(tarima);
        });

        const groups = Array.from(groupsMap.entries()).map(([key, group], index) => {
            const tarimas = group.tarimas;
            const totalCajas = tarimas.reduce((sum, t) => sum + (t.cajas || 0), 0);
            const totalPesoBruto = tarimas.reduce((sum, t) => sum + (t.pesoBruto || 0), 0);
            const totalPesoNeto = tarimas.reduce((sum, t) => sum + (t.pesoNeto || 0), 0);
            const totalCantidad = tarimas.reduce((sum, t) => sum + (t.cantidad || 0), 0);
            const totalUnits = tarimas.reduce((sum, t) => sum + (t.totalUnits || 0), 0);
            const totalIndividualUnits = tarimas.reduce((sum, t) => sum + (t.individualUnits || 0), 0);
            const promedioUnidadesCaja = tarimas.length > 0 ? Math.round(totalIndividualUnits / tarimas.length) : 0;

            const unidades = tarimas.map(t => t.unidad).filter(Boolean) as string[];
            const unidadesOrdenadas = [...unidades];
            const unidadPredominante = unidadesOrdenadas.length > 0
                ? unidadesOrdenadas
                    .sort((a, b) => unidadesOrdenadas.filter(v => v === a).length - unidadesOrdenadas.filter(v => v === b).length)
                    .pop() || ""
                : "";

            const cantidadFormateada = tarimas.length === 0
                ? "0"
                : unidadPredominante === "MIL"
                    ? `${totalCantidad.toLocaleString()} Millares`
                    : unidadPredominante
                        ? `${totalCantidad.toLocaleString()} ${unidadPredominante}`
                        : totalCantidad.toLocaleString();

            const pendientes = tarimas.filter(t => !t.asignadoAentrega).length;
            const procesadas = tarimas.length - pendientes;

            const color = PRODUCT_COLOR_PALETTE[index % PRODUCT_COLOR_PALETTE.length];

            return {
                key,
                nombreProducto: group.nombreProducto,
                itemNumber: group.itemNumber,
                tarimas,
                color,
                stats: {
                    totalCajas,
                    totalPesoBruto,
                    totalPesoNeto,
                    totalCantidad,
                    totalUnits,
                    promedioUnidadesCaja,
                    cantidadFormateada,
                    unidadPredominante,
                    tarimasCount: tarimas.length,
                    pendientes,
                    procesadas
                }
            };
        });

        return groups.sort((a, b) =>
            (a.nombreProducto ?? "").localeCompare(b.nombreProducto ?? "", "es", { sensitivity: "base" })
        );
    }, [sortedTarimas]);

    // Separar tarimas por estado
    const tarimasPendientes = sortedTarimas.filter(tarima => !coerceBoolean(tarima.asignadoAentrega));
    const tarimasAsignadas = sortedTarimas.filter(tarima => coerceBoolean(tarima.asignadoAentrega));

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
                    selectedTarimas={sortedTarimas}
                    productGroups={productGroups}
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
                        <div className="p-4 space-y-4">
                            {productGroups.map((group) => (
                                <div
                                    key={group.key}
                                    className={`rounded-2xl border-2 p-4 transition-all duration-200 shadow-sm ${group.color.container}`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2.5 w-2.5 rounded-full ${group.color.dot}`} />
                                                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-50" title={group.nombreProducto}>
                                                    {group.nombreProducto}
                                                </h4>
                                            </div>
                                            <p className={`text-xs uppercase tracking-wide mt-1 font-semibold ${group.color.headerText}`}>
                                                Item {group.itemNumber || "-"}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <Badge className={`${group.color.badge} px-3 py-1`}>{group.stats.tarimasCount} tarima(s)</Badge>
                                            <Badge className={`${group.color.badge} px-3 py-1`}>{group.stats.totalCajas.toLocaleString()} cajas</Badge>
                                            {group.stats.pendientes > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                                >
                                                    {group.stats.pendientes} pendiente(s)
                                                </Badge>
                                            )}
                                            {group.stats.procesadas > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                >
                                                    {group.stats.procesadas} procesada(s)
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-4">
                                        {group.tarimas.map((tarima, index) => {
                                            const isAssigned = coerceBoolean(tarima.asignadoAentrega);
                                            const tarimaNombre = formatString(tarima.nombreProducto);

                                            return (
                                                <div key={tarima.prodEtiquetaRFIDId}>
                                                    <div
                                                        className={`group/tarima flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3 rounded-lg border transition-all duration-200 ${
                                                            isAssigned
                                                                ? 'bg-green-50/60 dark:bg-green-900/10 border-green-200/60 dark:border-green-700/40'
                                                                : `${group.color.rowBackground} ${group.color.rowBorder}`
                                                        } ${group.color.rowHover}`}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h5 className={`font-semibold truncate ${
                                                                    isAssigned
                                                                        ? 'text-green-700 dark:text-green-300'
                                                                        : 'text-slate-900 dark:text-slate-100'
                                                                }`} title={tarimaNombre || undefined}>
                                                                    {tarimaNombre}
                                                                </h5>
                                                                <Badge
                                                                    variant={isAssigned ? "default" : "destructive"}
                                                                    className={`whitespace-nowrap text-xs h-fit py-1 px-2 transition-all duration-200 ${
                                                                        isAssigned
                                                                            ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30'
                                                                            : 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                                                                    }`}
                                                                >
                                                                    {isAssigned ? (
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                    ) : (
                                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                                    )}
                                                                    {isAssigned ? '✅ Procesado' : '⏳ Pendiente'}
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 lg:grid-cols-7 gap-2 text-xs text-muted-foreground">
                                                                <div className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                                                                    <span className="font-medium">Lote:</span> {formatString(tarima.lote)}
                                                                </div>
                                                                <div className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                                                                    <span className="font-medium">Item:</span> {formatString(tarima.itemNumber)}
                                                                </div>
                                                                <div className="bg-blue-100 dark:bg-blue-700 rounded px-2 py-1">
                                                                    <span className="font-medium">Cajas:</span> {formatNumber(tarima.cajas)}
                                                                </div>
                                                                <div className="bg-indigo-100 dark:bg-indigo-700 rounded px-2 py-1">
                                                                    <span className="font-medium">Pzs/Caja:</span> {formatNumber(tarima.individualUnits)}
                                                                </div>
                                                                <div className="bg-green-100 dark:bg-green-700 rounded px-2 py-1">
                                                                    <span className="font-medium">Total:</span> {formatNumber(tarima.totalUnits)}
                                                                </div>
                                                                <div className="bg-yellow-100 dark:bg-yellow-700 rounded px-2 py-1">
                                                                    <span className="font-medium">Peso:</span> {typeof tarima.pesoBruto === 'number' ? `${(tarima.pesoBruto / 1000).toFixed(1)}T` : 'N/A'}
                                                                </div>
                                                                <div className="bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                                                                    <span className="font-medium">RFID:</span> {tarima.prodEtiquetaRFIDId}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={`mt-2 sm:mt-0 px-3 py-2 self-start sm:self-center opacity-0 group-hover/tarima:opacity-100 transition-all duration-200 ${
                                                                isAssigned
                                                                    ? 'text-green-600 hover:text-green-700 hover:bg-green-100/40 dark:hover:bg-green-900/20'
                                                                    : 'text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-500/10'
                                                            }`}
                                                            onClick={() => onRemoveTarima(tarima)}
                                                        >
                                                            <X className="h-4 w-4 mr-1" />
                                                            {isAssigned ? 'Remover' : 'Quitar'}
                                                        </Button>
                                                    </div>
                                                    {index < group.tarimas.length - 1 && (
                                                        <Separator className={`${group.color.separator} my-2`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
