// components/excel/ExcelResults.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Search, CheckCircle } from "lucide-react";
import { ApiFilterResponseItem, Tarima } from "@/types";
import FilteredResultItemDisplay from "../FilteredResultItemDisplay";

interface ExcelResultsProps {
    apiResults: ApiFilterResponseItem[] | null;
    isFetching: boolean;
    error: string | null;
    searchAttempted: boolean;
    selectedTarimas: Tarima[];
    onSelectTarima: (tarima: Tarima) => void;
}

export default function ExcelResults({
                                         apiResults,
                                         isFetching,
                                         error,
                                         searchAttempted,
                                         selectedTarimas,
                                         onSelectTarima
                                     }: ExcelResultsProps) {
    // Estado de carga para Resultados de la Búsqueda en API
    if (isFetching) {
        return (
            <Card className="shadow-xl dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center h-40 p-6 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-3" />
                        <div className="text-center">
                            <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                                Buscando tarimas en el inventario...
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                Esto puede tardar un momento mientras procesamos los filtros
                            </p>
                        </div>
                        <div className="flex space-x-1 mt-4">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                    style={{ animationDelay: `${i * 0.3}s` }}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Mensaje de Error de la Búsqueda en API
    if (error && !isFetching) {
        return (
            <Card className="shadow-xl bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 border-2">
                <CardHeader>
                    <CardTitle className="text-red-700 dark:text-red-400 text-lg flex items-center">
                        <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-lg mr-3">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        Error en la Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <p className="text-red-600 dark:text-red-300">
                            Ocurrió un problema al intentar obtener los datos:
                        </p>
                        <div className="bg-red-100 dark:bg-red-800/40 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap break-all font-mono">
                {error}
              </pre>
                        </div>
                        <div className="text-sm text-red-600 dark:text-red-400">
                            <p className="font-semibold">Posibles soluciones:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Verifica tu conexión a internet</li>
                                <li>Revisa que los datos de entrada sean correctos</li>
                                <li>Intenta nuevamente en unos momentos</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Resultados de la Búsqueda en API (cuando hay resultados y no hay error)
    if (apiResults && !isFetching && !error) {
        const totalResults = apiResults.reduce((sum, item) => sum + item.totalEncontrados, 0);

        return (
            <div className="space-y-6">
                <Separator className="dark:bg-slate-700"/>

                {/* Header de resultados */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        Resultados de la Búsqueda en Inventario
                    </h2>
                    <div className="flex justify-center items-center gap-4 flex-wrap">
                        <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg px-4 py-2">
                            <div className="flex items-center">
                                <Search className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  {apiResults.length} filtros procesados
                </span>
                            </div>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg px-4 py-2">
                            <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {totalResults} tarimas encontradas
                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mostrar mensaje si no hay resultados */}
                {apiResults.length === 0 ? (
                    <Card className="shadow-lg">
                        <CardContent className="pt-6">
                            <div className="text-center py-8 space-y-4">
                                <div className="bg-slate-100 dark:bg-slate-700 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                                    <Search className="h-8 w-8 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                        No se encontraron coincidencias
                                    </h3>
                                    <p className="text-muted-foreground">
                                        No se encontraron tarimas que coincidan con los criterios de PO e ItemNumber proporcionados.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Mostrar resultados */
                    <div className="space-y-4">
                        {apiResults.map((resultItem, index) => (
                            <FilteredResultItemDisplay
                                key={`${resultItem.filtroSolicitado.po}-${resultItem.filtroSolicitado.itemNumber}-${index}`}
                                filterResult={resultItem}
                                selectedTarimas={selectedTarimas}
                                onSelectTarima={onSelectTarima}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // No mostrar nada si no se ha intentado buscar aún
    return null;
}