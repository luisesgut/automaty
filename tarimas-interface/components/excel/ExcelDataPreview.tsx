// components/excel/ExcelDataPreview.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, FileText, CheckCircle2, ShieldCheck, Filter } from "lucide-react";
import { ParsedExcelItem } from "@/types";

interface ExcelDataPreviewProps {
    parsedData: ParsedExcelItem[];
    isVisible: boolean;
    onSearchInInventory: () => void;
    isSearching: boolean;
}

export default function ExcelDataPreview({
    parsedData,
    isVisible,
    onSearchInInventory,
    isSearching
}: ExcelDataPreviewProps) {
    if (!isVisible || parsedData.length === 0) {
        return null;
    }

    // Obtener estadísticas de los datos
    const uniquePOs = new Set(parsedData.map(item => item.PO)).size;
    const uniqueItems = new Set(parsedData.map(item => item.ItemNumber)).size;
    const avgItemsPerPO = (parsedData.length / uniquePOs).toFixed(1);

    return (
        <Card className="shadow-xl dark:bg-slate-800 dark:border-slate-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40">
                <CardTitle className="text-xl flex items-center text-green-800 dark:text-green-200">
                    <div className="bg-green-200 dark:bg-green-500/30 p-2 rounded-lg mr-3">
                        <FileText className="h-5 w-5 text-green-700 dark:text-green-400" />
                    </div>
                    Vista Previa de Datos Procesados
                </CardTitle>
                <CardDescription className="text-base text-green-700 dark:text-green-300">
                    Se han procesado y validado correctamente <strong>{parsedData.length}</strong> pares PO/ItemNumber únicos.
                    Los datos están listos para la búsqueda en inventario.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                {/* Estadísticas mejoradas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-100 dark:bg-green-500/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {parsedData.length}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-500">
                            Pares Válidos
                        </div>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-500/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {uniquePOs}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-500">
                            POs Únicos
                        </div>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-500/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                            {uniqueItems}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-500">
                            Items Únicos
                        </div>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-500/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                            {avgItemsPerPO}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-500">
                            Items/PO Promedio
                        </div>
                    </div>
                </div>

                {/* Badges de estado */}
                <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 px-3 py-1.5">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Datos Validados
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 px-3 py-1.5">
                        <Filter className="h-4 w-4 mr-2" />
                        Sin Duplicados
                    </Badge>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30 px-3 py-1.5">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Listo para Búsqueda
                    </Badge>
                </div>

                {/* Tabla de vista previa mejorada */}
                <div className="border-2 border-green-200 dark:border-green-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                    <div className="bg-green-50 dark:bg-green-900/30 px-4 py-2 border-b border-green-200 dark:border-green-700">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm">
                            📋 Datos Procesados ({parsedData.length} elementos)
                        </h4>
                    </div>
                    <div className="relative">
                        <ScrollArea className="h-[400px] w-full">
                            <Table>
                                <TableHeader className="sticky top-0 bg-green-100 dark:bg-green-900/50 shadow-sm z-10">
                                    <TableRow>
                                        <TableHead className="font-semibold text-green-800 dark:text-green-200 w-[60px]">
                                            #
                                        </TableHead>
                                        <TableHead className="font-semibold text-green-800 dark:text-green-200 min-w-[120px]">
                                            PO Number
                                        </TableHead>
                                        <TableHead className="font-semibold text-green-800 dark:text-green-200 min-w-[200px]">
                                            Customer Item
                                        </TableHead>
                                        <TableHead className="font-semibold text-green-800 dark:text-green-200 w-[100px]">
                                            Estado
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((item, index) => {
                                        // Contar cuántas veces aparece este PO
                                        const poCount = parsedData.filter(p => p.PO === item.PO).length;
                                        const isMultiItem = poCount > 1;
                                        
                                        return (
                                            <TableRow
                                                key={`${item.PO}-${item.ItemNumber}-${index}`}
                                                className={`transition-colors hover:bg-green-50 dark:hover:bg-green-900/30 
                                           ${index % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/50" : ""}`}
                                            >
                                                <TableCell className="font-medium text-center text-slate-600 dark:text-slate-400">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-mono font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400">
                                                            {item.PO}
                                                        </div>
                                                        {isMultiItem && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{poCount - 1}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    <div className="bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400 break-all">
                                                        {item.ItemNumber}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                                        ✓ Válido
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        {/* Indicador de scroll si hay muchos elementos */}
                        {parsedData.length > 10 && (
                            <div className="absolute bottom-2 right-2 bg-green-100 dark:bg-green-800 border border-green-300 dark:border-green-600 rounded px-2 py-1 text-xs text-green-700 dark:text-green-300 shadow-sm">
                                ↕️ Scroll para ver más
                            </div>
                        )}
                    </div>
                </div>

                {/* Resumen de POs */}
                {uniquePOs > 1 && (
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 text-sm">
                            📊 Resumen por PO:
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                            {Array.from(new Set(parsedData.map(item => item.PO)))
                                .sort()
                                .map(po => {
                                    const itemsForPO = parsedData.filter(item => item.PO === po).length;
                                    return (
                                        <div key={po} className="bg-white dark:bg-slate-700 rounded px-2 py-1 border">
                                            <span className="font-mono text-blue-600 dark:text-blue-400">{po}</span>
                                            <span className="text-slate-500 ml-1">({itemsForPO})</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Botón de búsqueda */}
                <div className="flex justify-center">
                    <Button
                        onClick={onSearchInInventory}
                        disabled={isSearching || parsedData.length === 0}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-200 hover:scale-105"
                        size="lg"
                    >
                        {isSearching ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Buscando en inventario...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 h-5 w-5" />
                                Buscar {parsedData.length} Productos en Inventario
                            </>
                        )}
                    </Button>
                </div>

                {/* Información adicional */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        ⚡ Siguiente paso:
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Haz clic en "Buscar Productos en Inventario" para encontrar las tarimas que coincidan
                        con estos <strong>{parsedData.length} criterios PO/ItemNumber únicos</strong> en tu inventario actual.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-800/40 rounded text-xs text-blue-600 dark:text-blue-400">
                            <strong>✨ Nuevo - Procesamiento Inteligente:</strong><br/>
                            • Validación automática de formatos<br/>
                            • Eliminación de duplicados<br/>
                            • Detección de líneas inválidas
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-800/40 rounded text-xs text-green-600 dark:text-green-400">
                            <strong>💡 Ejemplo de resultados esperados:</strong><br/>
                            • PO 12850 + Item 0930N → X tarimas<br/>
                            • PO 12842 + Item 9801905 → Y tarimas<br/>
                            • PO 12793 + Item 002-00-55115-04 → Z tarimas
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}