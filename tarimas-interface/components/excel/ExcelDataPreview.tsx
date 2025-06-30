// components/excel/ExcelDataPreview.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, FileText, CheckCircle2 } from "lucide-react";
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

    return (
        <Card className="shadow-xl dark:bg-slate-800 dark:border-slate-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40">
                <CardTitle className="text-xl flex items-center text-green-800 dark:text-green-200">
                    <div className="bg-green-200 dark:bg-green-500/30 p-2 rounded-lg mr-3">
                        <FileText className="h-5 w-5 text-green-700 dark:text-green-400" />
                    </div>
                    Vista Previa de Datos Parseados
                </CardTitle>
                <CardDescription className="text-base text-green-700 dark:text-green-300">
                    Se han interpretado correctamente <strong>{parsedData.length}</strong> pares PO/ItemNumber.
                    Verifica que los datos sean correctos antes de buscar en el inventario.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                {/* Estadísticas */}
                <div className="flex flex-wrap gap-4">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 px-3 py-1.5">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {parsedData.length} elementos parseados
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 px-3 py-1.5">
                        <FileText className="h-4 w-4 mr-2" />
                        Listo para búsqueda
                    </Badge>
                </div>

                {/* Tabla de vista previa */}
                <div className="border-2 border-green-200 dark:border-green-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                    <ScrollArea className="max-h-[350px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-green-100 dark:bg-green-900/50 shadow-sm">
                                <TableRow>
                                    <TableHead className="font-semibold text-green-800 dark:text-green-200 w-[60px]">
                                        #
                                    </TableHead>
                                    <TableHead className="font-semibold text-green-800 dark:text-green-200 min-w-[150px]">
                                        PO Number
                                    </TableHead>
                                    <TableHead className="font-semibold text-green-800 dark:text-green-200 min-w-[200px]">
                                        Customer Item / ItemNumber
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedData.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        className={`transition-colors hover:bg-green-50 dark:hover:bg-green-900/30 
                               ${index % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/50" : ""}`}
                                    >
                                        <TableCell className="font-medium text-center text-slate-600 dark:text-slate-400">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="font-mono font-semibold text-blue-700 dark:text-blue-400">
                                            <div className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700">
                                                {item.PO}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            <div className="bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400">
                                                {item.ItemNumber}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

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
                                Buscar Productos en Inventario
                            </>
                        )}
                    </Button>
                </div>

                {/* Información adicional */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        ⚡ Siguiente paso:
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Haz clic en "Buscar Productos en Inventario" para encontrar las tarimas que coincidan
                        con estos criterios PO/ItemNumber en tu inventario actual.
                    </p>
                    <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-800/40 rounded text-xs text-blue-600 dark:text-blue-400">
                        <strong>💡 Ejemplo de lo que encontrarás:</strong><br/>
                        • PO 12850 + Item 0930N → 14 tarimas encontradas<br/>
                        • PO 12842 + Item 9801905 → 8 tarimas encontradas<br/>
                        • PO 12793 + Item 002-00-55115-04 → 0 tarimas (sin stock)
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}