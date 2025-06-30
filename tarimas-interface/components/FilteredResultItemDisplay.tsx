// components/FilteredResultItemDisplay.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Package, AlertCircle, CheckCircle, Search } from "lucide-react";
import { ApiFilterResponseItem, Tarima } from "@/types";

interface FilteredResultItemDisplayProps {
    filterResult: ApiFilterResponseItem;
    selectedTarimas: Tarima[];
    onSelectTarima: (tarima: Tarima) => void;
}

export default function FilteredResultItemDisplay({
                                                      filterResult,
                                                      selectedTarimas,
                                                      onSelectTarima
                                                  }: FilteredResultItemDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(filterResult.totalEncontrados > 0);

    const { filtroSolicitado, totalEncontrados, datos } = filterResult;

    const isTarimaSelected = (prodEtiquetaRFIDId: number) => {
        return selectedTarimas.some((tarima) => tarima.prodEtiquetaRFIDId === prodEtiquetaRFIDId);
    };

    const selectedCountInThisFilter = datos.filter(tarima =>
        isTarimaSelected(tarima.prodEtiquetaRFIDId)
    ).length;

    return (
        <Card className={`shadow-lg transition-all duration-200 hover:shadow-xl
                     ${totalEncontrados > 0
            ? "border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
            : "border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"}`}>

            <CardHeader
                className={`cursor-pointer transition-all duration-200 hover:bg-opacity-80
                   ${totalEncontrados > 0
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-amber-100 dark:bg-amber-900/30"}`}
                onClick={() => totalEncontrados > 0 && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg
                           ${totalEncontrados > 0
                            ? "bg-green-200 dark:bg-green-500/30"
                            : "bg-amber-200 dark:bg-amber-500/30"}`}>
                            {totalEncontrados > 0 ? (
                                <Package className="h-5 w-5 text-green-700 dark:text-green-400" />
                            ) : (
                                <Search className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                            )}
                        </div>

                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-400">
                  PO: {filtroSolicitado.po}
                </span>
                                <span className="text-slate-400">→</span>
                                <span className="font-mono bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-400">
                  Item: {filtroSolicitado.itemNumber}
                </span>
                            </CardTitle>

                            <div className="flex items-center gap-3 mt-2">
                                <Badge
                                    variant={totalEncontrados > 0 ? "default" : "outline"}
                                    className={`text-sm
                            ${totalEncontrados > 0
                                        ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                                        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"}`}
                                >
                                    {totalEncontrados > 0 ? (
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                    ) : (
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                    )}
                                    {totalEncontrados} tarimas encontradas
                                </Badge>

                                {selectedCountInThisFilter > 0 && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                                        {selectedCountInThisFilter} seleccionadas
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {totalEncontrados > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            {/* Content area - usando transición CSS en lugar de Collapsible */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <CardContent className="pt-0">
                    {totalEncontrados === 0 ? (
                        <div className="text-center py-6 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-medium">No se encontraron productos para este filtro</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Verifica que el PO y Customer Item sean correctos
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Estadísticas rápidas */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-700">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {datos.reduce((sum, t) => sum + t.cajas, 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Total Cajas</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {datos.reduce((sum, t) => sum + t.cantidad, 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Cantidad</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {datos.reduce((sum, t) => sum + t.pesoBruto, 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Peso Bruto (kg)</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {new Set(datos.map(t => t.lote)).size}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Lotes Únicos</p>
                                </div>
                            </div>

                            {/* Tabla de tarimas */}
                            <div className="border border-green-200 dark:border-green-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                <Table>
                                    <TableHeader className="bg-green-100 dark:bg-green-900/50">
                                        <TableRow>
                                            <TableHead className="w-12 text-center">Sel.</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Lote</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Cajas</TableHead>
                                            <TableHead className="text-right">Peso Neto</TableHead>
                                            <TableHead className="text-right">Peso Bruto</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {datos.map((tarima, index) => {
                                            const isSelected = isTarimaSelected(tarima.prodEtiquetaRFIDId);
                                            return (
                                                <TableRow
                                                    key={tarima.prodEtiquetaRFIDId}
                                                    className={`transition-all duration-200 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20
                                     ${isSelected ? "bg-green-100 dark:bg-green-900/40 border-l-4 border-l-green-500" : ""}
                                     ${index % 2 === 0 ? "bg-slate-25 dark:bg-slate-800/30" : ""}`}
                                                    onClick={() => onSelectTarima(tarima)}
                                                >
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => onSelectTarima(tarima)}
                                                            aria-label={`Seleccionar tarima ${tarima.nombreProducto}`}
                                                        />
                                                    </TableCell>

                                                    <TableCell className="font-medium">
                                                        <div className="space-y-1">
                                                            <div className="max-w-[200px] truncate font-semibold text-green-800 dark:text-green-200" title={tarima.nombreProducto}>
                                                                {tarima.nombreProducto}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                                {tarima.claveProducto}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                            <span className="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded text-sm font-medium">
                              {tarima.lote}
                            </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                            <span className="font-semibold text-lg">
                              {tarima.cantidad.toLocaleString()}
                            </span>
                                                        <div className="text-xs text-muted-foreground">{tarima.unidad}</div>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="font-semibold">{tarima.cajas}</span>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {tarima.individualUnits?.toLocaleString() || "N/A"}
                            </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <div className="text-right">
                              <span className="font-semibold text-green-600 dark:text-green-400 block">
                                {tarima.totalUnits?.toLocaleString() || "N/A"}
                              </span>
                                                            <span className="text-xs text-muted-foreground">
                                {tarima.cajas} × {tarima.individualUnits?.toLocaleString() || "N/A"}
                              </span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="text-sm">{tarima.pesoNeto.toLocaleString()} kg</span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="text-sm font-medium">{tarima.pesoBruto.toLocaleString()} kg</span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge
                                                            variant={tarima.asignadoAentrega ? "default" : "outline"}
                                                            className={`whitespace-nowrap text-xs h-fit py-1 px-2
                                        ${tarima.asignadoAentrega
                                                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                                                                : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"}`}
                                                        >
                                                            {tarima.asignadoAentrega ? (
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                            )}
                                                            {tarima.asignadoAentrega ? "Asignado" : "Disponible"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </div>
        </Card>
    );
}