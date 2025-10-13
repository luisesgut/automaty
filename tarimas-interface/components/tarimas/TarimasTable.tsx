// components/tarimas/TarimasTable.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useMemo, useCallback, type ReactNode } from "react";
import { Tarima } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { formatNumber, formatNumberWithUnit, formatString, coerceBoolean } from "@/utils/formatters";

type HighlightField = "nombreProducto" | "lote" | "itemNumber" | "claveProducto" | "po";
type TarimaHighlightMap = Record<number, Partial<Record<HighlightField, string[]>>>;

type RequiredTarimaField = {
    key: keyof Tarima;
    label: string;
};

const REQUIRED_TARIMA_FIELDS: RequiredTarimaField[] = [
    { key: "nombreProducto", label: "Producto" },
    { key: "claveProducto", label: "Clave" },
    { key: "lote", label: "Lote" },
    { key: "itemNumber", label: "Item Number" },
    { key: "cantidad", label: "Cantidad" },
    { key: "unidad", label: "Unidad" },
    { key: "cajas", label: "Cajas/Bobinas" },
    { key: "pesoNeto", label: "Peso Neto" },
    { key: "pesoBruto", label: "Peso Bruto" },
    { key: "almacen", label: "Almacén" },
    { key: "po", label: "PO" },
    { key: "prodEtiquetaRFIDId", label: "RFID ID" },
    { key: "individualUnits", label: "Unidades Individuales" },
    { key: "totalUnits", label: "Unidades Totales" },
    { key: "uom", label: "UOM" },
    { key: "ordenSAP", label: "Orden SAP" }
];

const isMissingTarimaValue = (value: Tarima[keyof Tarima]): boolean => {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === "string") {
        return value.trim() === "";
    }

    if (typeof value === "number") {
        return Number.isNaN(value);
    }

    return false;
};

const getMissingTarimaFields = (tarima: Tarima): string[] => {
    return REQUIRED_TARIMA_FIELDS.reduce<string[]>((missing, field) => {
        const value = tarima[field.key];
        if (isMissingTarimaValue(value)) {
            missing.push(field.label);
        }
        return missing;
    }, []);
};

const highlightText = (
    value: string | number | null | undefined,
    highlights?: string[]
): ReactNode => {
    if (value === null || value === undefined) {
        return "";
    }

    const text = typeof value === "string" ? value : String(value);

    if (!text) {
        return text;
    }

    const validTerms = (highlights ?? [])
        .map((term) => term?.trim())
        .filter((term): term is string => Boolean(term));

    if (validTerms.length === 0) {
        return text;
    }

    const lowerText = text.toLowerCase();
    const ranges: Array<{ start: number; end: number }> = [];

    validTerms.forEach((term) => {
        const lowerTerm = term.toLowerCase();
        let index = lowerText.indexOf(lowerTerm);

        while (index !== -1) {
            ranges.push({ start: index, end: index + lowerTerm.length });
            index = lowerText.indexOf(lowerTerm, index + 1);
        }
    });

    if (ranges.length === 0) {
        return text;
    }

    ranges.sort((a, b) => a.start - b.start);

    const merged: Array<{ start: number; end: number }> = [];

    ranges.forEach((range) => {
        const last = merged[merged.length - 1];
        if (!last || range.start > last.end) {
            merged.push({ ...range });
        } else if (range.end > last.end) {
            last.end = range.end;
        }
    });

    const nodes: ReactNode[] = [];
    let cursor = 0;

    merged.forEach((range, index) => {
        if (cursor < range.start) {
            nodes.push(text.slice(cursor, range.start));
        }

        nodes.push(
            <span
                key={`highlight-${range.start}-${range.end}-${index}`}
                className="bg-yellow-200 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-50 rounded px-1"
            >
                {text.slice(range.start, range.end)}
            </span>
        );
        cursor = range.end;
    });

    if (cursor < text.length) {
        nodes.push(text.slice(cursor));
    }

    return nodes;
};

const dedupeTarimasByLote = (tarimas: Tarima[]): Tarima[] => {
    const seen = new Set<string>();

    return tarimas.filter((tarima) => {
        const loteValue = tarima.lote;
        if (loteValue === null || loteValue === undefined) {
            return true;
        }

        const normalizedLote = typeof loteValue === "number"
            ? String(loteValue)
            : loteValue.trim().toLowerCase();

        if (!normalizedLote) {
            return true;
        }

        if (seen.has(normalizedLote)) {
            return false;
        }

        seen.add(normalizedLote);
        return true;
    });
};


interface TarimasTableProps {
    tarimas: Tarima[];
    filteredTarimas: Tarima[];
    selectedTarimas: Tarima[];
    filterSummary: string;
    loading: boolean;
    onSelectTarima: (tarima: Tarima) => void;
    weightInfo?: {
        totalPesoBruto: number;
        pesoMaximo: number;
        porcentajeUsado: number;
        pesoRestante: number;
        cercaDelLimite: boolean;
        enLimite: boolean;
        excedeReferencia?: boolean;
        excesoReferencia?: number;
    };
    showAllTarimas: boolean;
    highlightMap?: TarimaHighlightMap;
}

export default function TarimasTable({
    tarimas,
    filteredTarimas,
    selectedTarimas,
    filterSummary,
    loading,
    onSelectTarima,
    weightInfo,
    showAllTarimas,
    highlightMap
}: TarimasTableProps) {
    const uniqueTarimas = useMemo(() => dedupeTarimasByLote(tarimas), [tarimas]);
    const uniqueFilteredTarimas = useMemo(() => dedupeTarimasByLote(filteredTarimas), [filteredTarimas]);

    const totalTarimasCount = uniqueTarimas.length;
    const totalFilteredTarimasCount = uniqueFilteredTarimas.length;

    const selectedIds = useMemo(
        () => new Set(selectedTarimas.map((tarima) => tarima.prodEtiquetaRFIDId)),
        [selectedTarimas]
    );

    const isTarimaSelected = useCallback((prodEtiquetaRFIDId: number) => {
        return selectedIds.has(prodEtiquetaRFIDId);
    }, [selectedIds]);

    const canSelectTarima = useCallback((tarima: Tarima) => {
        return !coerceBoolean(tarima.asignadoAentrega);
    }, []);

    const handleTarimaInteraction = useCallback((tarima: Tarima) => {
        const alreadySelected = isTarimaSelected(tarima.prodEtiquetaRFIDId);

        if (alreadySelected) {
            onSelectTarima(tarima);
            return;
        }

        const missingFields = getMissingTarimaFields(tarima);

        if (missingFields.length > 0) {
            toast({
                title: "Tarima incompleta",
                description: `No es posible seleccionar la tarima porque falta información en: ${missingFields.join(", ")}.`,
                variant: "destructive"
            });
            return;
        }

        if (!canSelectTarima(tarima)) {
            toast({
                title: "Tarima no disponible",
                description: "Esta tarima ya está asignada a una entrega.",
                variant: "destructive"
            });
            return;
        }

        onSelectTarima(tarima);
    }, [canSelectTarima, isTarimaSelected, onSelectTarima]);

    return (
        <Card className="shadow-xl dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
            <CardHeader className="pb-4 pt-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="text-xl">Inventario General de Tarimas</CardTitle>
                <CardDescription className="text-base">
                    {totalFilteredTarimasCount} de {totalTarimasCount} tarimas encontradas
                    {filterSummary && (
                        <span className="ml-2 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                            Filtro: {filterSummary}
                        </span>
                    )}
                    <span className="ml-2 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                        {showAllTarimas ? "Todas las tarimas" : "Solo pendientes"}
                    </span>
                    {/* Nuevo indicador informativo sobre peso */}
                    {weightInfo && weightInfo.excedeReferencia && (
                        <span className="ml-2 bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-1 rounded-full text-xs font-medium">
                            ⚠️ Peso por encima de referencia
                        </span>
                    )}
                </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
                <div className="rounded-lg border-2 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                    <div className="relative max-h-[700px] overflow-auto">
                        <table className="w-full min-w-[1400px] caption-bottom text-sm">
                            <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 shadow-sm">
                                <TableRow className="bg-slate-100 dark:bg-slate-700">
                                    <TableHead className="sticky top-0 z-20 w-12 text-center bg-slate-200 dark:bg-slate-600">
                                        <Checkbox className="mx-auto" disabled />
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 font-semibold min-w-[200px]">
                                        Producto
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 font-semibold min-w-[100px]">
                                        Lote
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 font-semibold min-w-[120px]">
                                        Item Number
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 text-right font-semibold min-w-[100px]">
                                        Cantidad
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 font-semibold min-w-[80px]">
                                        Unidad
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 text-right font-semibold min-w-[80px]">
                                        Cajas / Bobinas
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 text-right font-semibold min-w-[100px]">
                                        Peso Neto
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 text-right font-semibold min-w-[100px]">
                                        Peso Bruto
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 font-semibold min-w-[100px]">
                                        Almacén
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 font-semibold min-w-[100px]">
                                        PO
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 text-right font-semibold min-w-[100px]">
                                        RFID ID
                                    </TableHead>
                                    <TableHead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-700 font-semibold min-w-[120px]">
                                        Estado
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                    {loading && totalTarimasCount === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={13} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                                    <div>
                                                        <p className="text-lg font-medium">Cargando inventario...</p>
                                                        <p className="text-sm text-muted-foreground">Por favor espere un momento</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : totalFilteredTarimasCount === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={13} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="bg-slate-100 dark:bg-slate-700 rounded-full p-4">
                                                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-medium text-muted-foreground">
                                                            No se encontraron tarimas
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {filterSummary
                                                                ? `No hay coincidencias para "${filterSummary}"`
                                                                : showAllTarimas 
                                                                  ? "No hay tarimas disponibles en este momento"
                                                                  : "No hay tarimas pendientes. Activa 'Mostrar todas' para ver las asignadas."
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        uniqueFilteredTarimas.map((tarima, index) => {
                                            const isSelected = isTarimaSelected(tarima.prodEtiquetaRFIDId);
                                            const canSelect = canSelectTarima(tarima);
                                            const isAssigned = coerceBoolean(tarima.asignadoAentrega);
                                            const isRollUnit = tarima.uom?.toUpperCase?.() === "ROLLS";
                                            const missingFields = getMissingTarimaFields(tarima);
                                            const hasMissingData = missingFields.length > 0;
                                            const quantityLabel = isRollUnit ? "bobinas" : "cajas";
                                            const perUnitLabel = isRollUnit ? "vueltas/bobina" : "pzs/caja";
                                            const totalLabel = isRollUnit ? "vueltas totales" : "piezas totales";
                                            const quantityWrapperClasses = isRollUnit
                                                ? "bg-purple-50 dark:bg-purple-500/20"
                                                : "bg-blue-50 dark:bg-blue-900/30";
                                            const quantityValueClasses = isRollUnit
                                                ? "text-purple-700 dark:text-purple-200"
                                                : "text-blue-700 dark:text-blue-300";
                                            const totalValueClasses = isRollUnit
                                                ? "text-amber-600 dark:text-amber-300"
                                                : "text-green-600 dark:text-green-400";
                                            const quantityDisplay = formatNumber(tarima.cajas);
                                            const tarimaHighlights = highlightMap?.[tarima.prodEtiquetaRFIDId];
                                            const getHighlightedValue = (
                                                field: HighlightField,
                                                value: string | number | null | undefined
                                            ) => highlightText(value, tarimaHighlights?.[field]);

                                            return (
                                                <TableRow
                                                    key={tarima.prodEtiquetaRFIDId}
                                                    className={`transition-all duration-200 cursor-pointer hover:shadow-sm
                                                        ${isSelected
                                                            ? "bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary"
                                                            : isAssigned
                                                              ? "bg-green-50/50 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                              : hasMissingData
                                                                ? "bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-100/70 dark:hover:bg-amber-900/40"
                                                                : "hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
                                                        } ${index % 2 === 0 ? "bg-slate-25 dark:bg-slate-800/30" : ""}
                                                        ${isAssigned ? "opacity-75" : ""}`}
                                                    onClick={() => handleTarimaInteraction(tarima)}
                                                >
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center">
                                                            {isAssigned && (
                                                                <Lock className="w-3 h-3 text-slate-400 mr-1" />
                                                            )}
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => handleTarimaInteraction(tarima)}
                                                                disabled={!canSelect}
                                                                aria-label={`Seleccionar tarima ${tarima.nombreProducto}`}
                                                                className={`transition-all duration-200 ${
                                                                    !canSelect ? "opacity-50 cursor-not-allowed" : ""
                                                                }`}
                                                            />
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="font-medium">
                                                        <div className="space-y-1">
                                                            <div className="max-w-[180px] truncate font-semibold" title={tarima.nombreProducto}>
                                                                {getHighlightedValue("nombreProducto", tarima.nombreProducto)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                                {getHighlightedValue("claveProducto", tarima.claveProducto)}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded text-sm font-medium">
                                                            {getHighlightedValue("lote", tarima.lote)}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                            {getHighlightedValue("itemNumber", tarima.itemNumber)}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="font-semibold text-lg">
                                                            {formatNumber(tarima.cantidad)}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge
                                                            variant={isRollUnit ? "default" : "outline"}
                                                            className={`font-medium ${isRollUnit ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/30" : ""}`}
                                                        >
                                                            {isRollUnit ? "ROLLS / Bobinas" : formatString(tarima.unidad)}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <div className={`${quantityWrapperClasses} px-2 py-1 rounded flex items-center justify-center gap-1`}>
                                                                <span className={`font-semibold ${quantityValueClasses}`}>
                                                                    {quantityDisplay}
                                                                </span>
                                                                <span className={`text-[10px] uppercase tracking-wide ${quantityValueClasses}`}>
                                                                    {quantityLabel}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatNumberWithUnit(tarima.individualUnits, perUnitLabel)}
                                                            </div>
                                                            <div className={`text-xs font-medium ${totalValueClasses}`}>
                                                                {formatNumberWithUnit(tarima.totalUnits, totalLabel)}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="text-sm">{formatNumberWithUnit(tarima.pesoNeto, "kg")}</span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="text-sm font-medium">{formatNumberWithUnit(tarima.pesoBruto, "kg")}</span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {formatString(tarima.almacen)}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell>
                                                        <span className="font-mono text-sm bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                                                            {getHighlightedValue("po", tarima.po)}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="font-mono text-xs text-muted-foreground">
                                                            {tarima.prodEtiquetaRFIDId}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge
                                                            variant={isAssigned ? "default" : "outline"}
                                                            className={`whitespace-nowrap text-xs h-fit py-1.5 px-3 transition-all duration-200
                                                                ${isAssigned
                                                                    ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 shadow-sm"
                                                                    : hasMissingData
                                                                        ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30"
                                                                        : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"}`}
                                                        >
                                                            {isAssigned ? (
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                            )}
                                                            {isAssigned
                                                                ? "Asignado"
                                                                : hasMissingData
                                                                    ? "Datos incompletos"
                                                                    : "Pendiente"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                                 </table>
                        </div>
                    </div>
                </CardContent> 
            </Card>
    );
}
