// components/tarimas/TarimasSearch.tsx
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    Search,
    Truck,
    ChevronDown,
    ChevronUp,
    X,
    Eye,
    EyeOff,
    Filter,
    Package,
    ListFilter,
    Hash,
    PackageSearch,
    Tag
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TarimaFilterMode = "general" | "po" | "lote" | "producto" | "customerItem";

const FILTER_MODE_OPTIONS: Array<{
    value: TarimaFilterMode;
    label: string;
    description: string;
    placeholder: string;
    helper: string;
    icon: LucideIcon;
}> = [
    {
        value: "general",
        label: "Búsqueda libre",
        description: "Busca en producto, lote, item number, PO o clave.",
        placeholder: "Buscar por producto, lote, item, clave...",
        helper: "Escribe cualquier palabra clave y encontraremos coincidencias en todos los campos principales.",
        icon: Search
    },
    {
        value: "po",
        label: "PO",
        description: "Filtra por uno o varios números de orden de compra.",
        placeholder: "PO12345, PO67890",
        helper: "Ingresa uno o varios PO, separándolos con comas, saltos de línea o tabulaciones.",
        icon: ListFilter
    },
    {
        value: "lote",
        label: "Lote",
        description: "Encuentra tarimas por número de lote.",
        placeholder: "Lote-001, Lote-002",
        helper: "Escribe los lotes que necesitas consultar, uno por línea o separados por comas.",
        icon: Hash
    },
    {
        value: "producto",
        label: "Producto",
        description: "Filtra por nombre comercial del producto.",
        placeholder: "Nombre de producto",
        helper: "Puedes pegar una lista de nombres de producto, cuidaremos las coincidencias parciales.",
        icon: PackageSearch
    },
    {
        value: "customerItem",
        label: "Customer Item",
        description: "Filtra por Item Number del cliente.",
        placeholder: "12345, 67890",
        helper: "Introduce los Item Number relevantes. Aceptamos comas, saltos de línea o tabulaciones.",
        icon: Tag
    }
];

interface TarimasSearchProps {
    filterMode: TarimaFilterMode;
    onFilterModeChange: (mode: TarimaFilterMode) => void;
    generalQuery: string;
    onGeneralQueryChange: (value: string) => void;
    bulkQuery: string;
    onBulkQueryChange: (value: string) => void;
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
    filterMode,
    onFilterModeChange,
    generalQuery,
    onGeneralQueryChange,
    bulkQuery,
    onBulkQueryChange,
    selectedCount,
    showPreview,
    onTogglePreview,
    onProcess,
    onClearSelection,
    weightInfo,
    showAllTarimas,
    onToggleShowAll,
    totalTarimasCount,
    filteredTarimasCount,
    stats
}: TarimasSearchProps) {
    const activeMode = FILTER_MODE_OPTIONS.find((option) => option.value === filterMode) ?? FILTER_MODE_OPTIONS[0];

    const bulkValues = useMemo(() => {
        return bulkQuery
            .split(/[\n,;\t]+/)
            .map((value) => value.trim())
            .filter(Boolean);
    }, [bulkQuery]);

    return (
        <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="pt-6">
                {/* Header con estadísticas generales */}
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

                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-md border-l-4 border-l-blue-500">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        <Filter className="w-4 h-4 inline mr-2" />
                        {showAllTarimas ? (
                            <>
                                <span className="font-medium">Vista completa:</span> Mostrando todas las tarimas ({stats.pendientes} pendientes + {stats.asignadas} ya asignadas)
                            </>
                        ) : (
                            <>
                                <span className="font-medium">Vista filtrada:</span> Mostrando solo tarimas pendientes ({stats.pendientes} disponibles para procesar)
                            </>
                        )}
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">¿Por qué vamos a filtrar hoy?</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona el criterio principal para guiar la búsqueda.</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {activeMode.label}
                            </Badge>
                        </div>

                        <ToggleGroup
                            type="single"
                            value={filterMode}
                            onValueChange={(value) => value && onFilterModeChange(value as TarimaFilterMode)}
                            className="flex flex-wrap gap-2"
                        >
                            {FILTER_MODE_OPTIONS.map((option) => (
                                <ToggleGroupItem
                                    key={option.value}
                                    value={option.value}
                                    className="data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-md px-3 py-2 h-auto text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                                >
                                    <option.icon className="w-4 h-4" />
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>

                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Filter className="w-3 h-3" />
                            {activeMode.description}
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="relative w-full lg:max-w-xl group">
                            {filterMode === "general" ? (
                                <>
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="search"
                                        placeholder={activeMode.placeholder}
                                        className="pl-10 h-11 border-2 focus:border-primary transition-all duration-200 shadow-sm"
                                        value={generalQuery}
                                        onChange={(event) => onGeneralQueryChange(event.target.value)}
                                    />
                                    {generalQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onGeneralQueryChange("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                                            title="Limpiar búsqueda"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Textarea
                                        placeholder={`${activeMode.placeholder}\nEjemplo: valor1, valor2, valor3`}
                                        className="min-h-[110px] pr-10 border-2 focus:border-primary transition-all duration-200 shadow-sm"
                                        value={bulkQuery}
                                        onChange={(event) => onBulkQueryChange(event.target.value)}
                                    />
                                    {bulkQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onBulkQueryChange("")}
                                            className="absolute right-3 top-3 h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                                            title="Limpiar valores"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </>
                            )}

                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {activeMode.helper}
                            </p>

                            {filterMode !== "general" && bulkValues.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {bulkValues.slice(0, 5).map((value, index) => (
                                        <Badge key={`${value}-${index}`} variant="outline" className="text-xs">
                                            {value}
                                        </Badge>
                                    ))}
                                    {bulkValues.length > 5 && (
                                        <Badge variant="secondary" className="text-xs">
                                            +{bulkValues.length - 5} más
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>

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
                </div>

                {filterMode === "general" && generalQuery && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filtrando por:</span>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            "{generalQuery}"
                        </span>
                    </div>
                )}

                {filterMode !== "general" && bulkValues.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Filtrando por {activeMode.label}:</p>
                        <div className="flex flex-wrap gap-2">
                            {bulkValues.map((value, index) => (
                                <Badge key={`${value}-${index}`} variant="outline" className="text-xs">
                                    {value}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {weightInfo && selectedCount > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Peso total seleccionado:</span>
                            <span
                                className={`font-semibold ${
                                    weightInfo.enLimite
                                        ? "text-red-600"
                                        : weightInfo.cercaDelLimite
                                            ? "text-yellow-600"
                                            : "text-green-600"
                                }`}
                            >
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
