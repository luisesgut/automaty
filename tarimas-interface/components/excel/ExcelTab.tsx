// components/excel/ExcelTab.tsx
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Truck, ChevronDown, ChevronUp, X } from "lucide-react";
import { Tarima } from "@/types";
import { useExcelData } from "@/hooks/useExcelData";
import ExcelDataInput from "./ExcelDataInput";
import ExcelDataPreview from "./ExcelDataPreview";
import ExcelResults from "./ExcelResults";
import SelectedTarimasPreview from "../tarimas/SelectedTarimasPreview";
import { TarimasStats } from "@/types";

interface ExcelTabProps {
  selectedTarimas: Tarima[];
  onSelectTarima: (tarima: Tarima) => void;
  onClearSelection: () => void;
  onClearProcessedTarimas: () => void; // NUEVA PROP
  removeTarima: (tarima: Tarima) => void; // NUEVA PROP
  onProcessTarimas: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  getStats: () => TarimasStats;
  getWeightInfo: () => any;
}

export default function ExcelTab({
                                     selectedTarimas,
                                     onSelectTarima,
                                     onClearSelection,
                                     onClearProcessedTarimas, // NUEVA
                                     removeTarima, // NUEVA
                                     onProcessTarimas,
                                     showPreview,
                                     onTogglePreview,
                                     getStats,
                                     getWeightInfo
                                 }: ExcelTabProps) {
    const {
        pastedText,
        parsedData,
        showPreview: showExcelPreview,
        apiResults,
        isFetching,
        error,
        searchAttempted,
        handleVerifyPastedData,
        fetchFilteredStockFromApi,
        resetExcelData,
        updatePastedText,
    } = useExcelData();

    const stats = getStats();
    const weightInfo = getWeightInfo();

    return (
        <div className="space-y-8">
            {/* Card para Entrada de Datos desde Excel */}
            <ExcelDataInput
                pastedText={pastedText}
                onTextChange={updatePastedText}
                onVerifyData={handleVerifyPastedData}
                isDisabled={isFetching}
            />

            {/* Vista Previa de Datos Parseados */}
            <ExcelDataPreview
                parsedData={parsedData}
                isVisible={showExcelPreview}
                onSearchInInventory={fetchFilteredStockFromApi}
                isSearching={isFetching}
            />

            {/* ================================================================ */}
            {/* ====== RESUMEN DE TARIMAS SELECCIONADAS (MOVIDO ARRIBA) ====== */}
            {/* ================================================================ */}
            {selectedTarimas.length > 0 && (
                <div className="relative">
                    {/* Separador visual elegante */}
                    <div className="flex items-center mb-6">
                        <div className="flex-1 border-t-2 border-dashed border-primary/30 dark:border-primary/20"></div>
                        <div className="px-4">
                            <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full px-4 py-2">
                                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Selección Global Activa
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 border-t-2 border-dashed border-primary/30 dark:border-primary/20"></div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Resumen de Selección Global
                        </h2>
                        <p className="text-center text-muted-foreground">
                            Tienes <strong>{selectedTarimas.length}</strong> tarimas seleccionadas desde todas las pestañas del sistema
                        </p>
                    </div>

                    {/* Botones de control compactos */}
                    <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
                        <Button
                            variant="default"
                            size="default"
                            onClick={onProcessTarimas}
                            disabled={selectedTarimas.length === 0}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-200 hover:scale-105"
                        >
                            <Truck className="h-4 w-4 mr-2" />
                            Procesar ({selectedTarimas.length})
                        </Button>

                        <Button
                            variant="outline"
                            size="default"
                            onClick={onTogglePreview}
                            disabled={selectedTarimas.length === 0}
                            className="border-2 hover:border-primary transition-all duration-200"
                        >
                            {showPreview ? (
                                <>
                                    <ChevronUp className="h-4 w-4 mr-2" />
                                    Ocultar Detalles
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Ver Detalles
                                </>
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="default"
                            onClick={onClearSelection}
                            className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                            disabled={selectedTarimas.length === 0}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                        </Button>
                    </div>

                    {/* Vista previa detallada (expandible) - ACTUALIZADA CON NUEVAS PROPS */}
                    {showPreview && (
                        <div className="mb-8">
                            <SelectedTarimasPreview
                                selectedTarimas={selectedTarimas}
                                stats={stats}
                                onRemoveTarima={removeTarima} // USAR removeTarima EN LUGAR DE onSelectTarima
                                onClearProcessedTarimas={onClearProcessedTarimas} // NUEVA PROP
                                weightInfo={weightInfo}
                            />
                        </div>
                    )}

                    {/* Separador inferior */}
                    <div className="border-t border-dashed border-slate-300 dark:border-slate-600 pt-6 mb-2">
                        <p className="text-center text-xs text-muted-foreground">
                            ↓ Continúa buscando productos o procesa tu selección actual ↓
                        </p>
                    </div>
                </div>
            )}

            {/* Resultados de la Búsqueda en API */}
            <ExcelResults
                apiResults={apiResults}
                isFetching={isFetching}
                error={error}
                searchAttempted={searchAttempted}
                selectedTarimas={selectedTarimas}
                onSelectTarima={onSelectTarima}
            />
        </div>
    );
}