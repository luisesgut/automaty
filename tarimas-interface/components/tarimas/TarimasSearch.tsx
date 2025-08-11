// components/tarimas/TarimasSearch.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Truck, ChevronDown, ChevronUp, X, Eye, EyeOff, Filter, Package } from "lucide-react";

interface TarimasSearchProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCount: number;
    showPreview: boolean;
    onTogglePreview: () => void;
    onProcess: () => void;
    onClearSelection: () => void;
    weightInfo?: {
        totalPesoBruto: number;
        pesoMaximo: number;
        porcentajeUsado: number;
        pesoRestante: number;
        cercaDelLimite: boolean;
        enLimite: boolean;
    };
    // NUEVAS PROPS para el filtro de estado
    showAllTarimas: boolean;
    onToggleShowAll: (checked: boolean) => void;
    totalTarimasCount: number;
    filteredTarimasCount: number;
    stats: {
        pendientes: number;
        asignadas: number;
    };
}

export default function TarimasSearch({
    searchTerm,
    onSearchChange,
    selectedCount,
    showPreview,
    onTogglePreview,
    onProcess,
    onClearSelection,
    weightInfo,
    // Nuevas props
    showAllTarimas,
    onToggleShowAll,
    totalTarimasCount,
    filteredTarimasCount,
    stats
}: TarimasSearchProps) {
    return (
        <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="pt-6">
                {/* Header con estadísticas generales - NUEVO */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline" className="text-base px-3 py-1.5">
                            <Package className="w-4 h-4 mr-2" />
                            {filteredTarimasCount} de {totalTarimasCount} tarimas
                        </Badge>
                        
                        {selectedCount > 0 && (
                            <Badge variant="secondary" className="text-base px-3 py-1.5 bg-blue-100 text-blue-800 border-blue-200">
                                {selectedCount} seleccionadas
                            </Badge>
                        )}

                        {stats.pendientes > 0 && (
                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-base px-3 py-1.5">
                                {stats.pendientes} pendientes
                            </Badge>
                        )}

                        {stats.asignadas > 0 && showAllTarimas && (
                            <Badge variant="secondary" className="bg-green-500 hover:bg-green-600 text-white text-base px-3 py-1.5">
                                {stats.asignadas} asignadas
                            </Badge>
                        )}
                    </div>

                    {/* Switch para mostrar todas las tarimas - NUEVO */}
                    <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            {showAllTarimas ? (
                                <Eye className="w-4 h-4 text-slate-500" />
                            ) : (
                                <EyeOff className="w-4 h-4 text-slate-500" />
                            )}
                            <Label 
                                htmlFor="show-all-switch" 
                                className="text-sm font-medium cursor-pointer"
                            >
                                Mostrar todas
                            </Label>
                        </div>
                        <Switch
                            id="show-all-switch"
                            checked={showAllTarimas}
                            onCheckedChange={onToggleShowAll}
                            className="data-[state=checked]:bg-blue-600"
                        />
                    </div>
                </div>

                {/* Descripción del filtro actual - NUEVO */}
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-md border-l-4 border-l-blue-500">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        <Filter className="w-4 h-4 inline mr-2" />
                        {showAllTarimas ? (
                            <>
                                <span className="font-medium">Vista completa:</span> Mostrando todas las tarimas 
                                ({stats.pendientes} pendientes + {stats.asignadas} ya asignadas)
                            </>
                        ) : (
                            <>
                                <span className="font-medium">Vista filtrada:</span> Mostrando solo tarimas pendientes 
                                ({stats.pendientes} disponibles para procesar)
                            </>
                        )}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {/* Barra de búsqueda mejorada */}
                    <div className="relative w-full lg:max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="search"
                            placeholder="Buscar por producto, lote, item, clave..."
                            className="pl-10 h-11 border-2 focus:border-primary transition-all duration-200 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSearchChange("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* Controles de acción mejorados */}
                    <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
                        {selectedCount > 0 && (
                            <>
                                <Button
                                    variant="default"
                                    size="default"
                                    onClick={onProcess}
                                    disabled={weightInfo?.enLimite}
                                    className={`w-full sm:w-auto shadow-lg transition-all duration-200 hover:scale-105 ${
                                        weightInfo?.enLimite
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                    }`}
                                >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Procesar ({selectedCount})
                                    {weightInfo && (
                                        <span className="ml-2 text-xs bg-white/20 px-1 rounded">
                                            {(weightInfo.totalPesoBruto / 1000).toFixed(1)}T
                                        </span>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="default"
                                    onClick={onTogglePreview}
                                    className="w-full sm:w-auto border-2 hover:border-primary transition-all duration-200"
                                >
                                    {showPreview ? (
                                        <>
                                            <ChevronUp className="h-4 w-4 mr-2" />
                                            Ocultar Selección
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-2" />
                                            Mostrar Selección
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="default"
                                    onClick={onClearSelection}
                                    className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 w-full sm:w-auto hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Limpiar
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Indicador de filtros activos */}
                {searchTerm && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filtrando por:</span>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            "{searchTerm}"
                        </span>
                    </div>
                )}

                {/* Indicador de peso si hay selección */}
                {weightInfo && selectedCount > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Peso total seleccionado:</span>
                            <span className={`font-semibold ${
                                weightInfo.enLimite ? 'text-red-600' :
                                    weightInfo.cercaDelLimite ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                                {(weightInfo.totalPesoBruto / 1000).toFixed(1)}T / 20T
                                ({weightInfo.porcentajeUsado.toFixed(0)}%)
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}