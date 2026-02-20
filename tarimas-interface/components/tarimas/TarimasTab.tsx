// components/tarimas/TarimasTab.tsx
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Tarima, TarimasDataSource, TarimasExcelImportReport } from "@/types";
import TarimasSearch, { TarimaFilterMode } from "./TarimasSearch";
import SelectedTarimasPreview from "./SelectedTarimasPreview";
import TarimasTable from "./TarimasTable";
import { TarimasStats } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { FileSpreadsheet, Database, Upload, RotateCcw } from "lucide-react";

type HighlightField = "nombreProducto" | "lote" | "itemNumber" | "claveProducto" | "po";
type TarimaHighlightMap = Record<number, Partial<Record<HighlightField, string[]>>>;

const filterModeToField: Record<Exclude<TarimaFilterMode, "general">, HighlightField> = {
  po: "po"
};

const normalizeTarimaValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).toLowerCase().trim();
};

interface TarimasTabProps {
  tarimas: Tarima[];
  selectedTarimas: Tarima[];
  onSelectTarima: (tarima: Tarima) => void;
  onClearSelection: () => void;
  onClearProcessedTarimas: () => void; // NUEVA PROP
  removeTarima: (tarima: Tarima) => void; // NUEVA PROP
  onProcessTarimas: () => void;
  loading: boolean;
  getStats: () => TarimasStats;
  getWeightInfo: () => any;
  showAllTarimas: boolean;
  onToggleShowAll: (checked: boolean) => void;
  totalTarimasCount: number;
  filteredTarimasCount: number;
  dataSource: TarimasDataSource;
  excelImportReport: TarimasExcelImportReport | null;
  isImportingExcel: boolean;
  onImportExcel: (file: File) => Promise<TarimasExcelImportReport>;
  onRestoreEndpoint: () => Promise<void>;
}

export default function TarimasTab({
  tarimas,
  selectedTarimas,
  onSelectTarima,
  onClearSelection,
  onClearProcessedTarimas, // AGREGADA
  removeTarima, // AGREGADA
  onProcessTarimas,
  loading,
  getStats,
  getWeightInfo,
  // Nuevas props
  showAllTarimas,
  onToggleShowAll,
  totalTarimasCount,
  filteredTarimasCount,
  dataSource,
  excelImportReport,
  isImportingExcel,
  onImportExcel,
  onRestoreEndpoint
}: TarimasTabProps) {
  const [filterMode, setFilterMode] = useState<TarimaFilterMode>("general");
  const [generalQuery, setGeneralQuery] = useState("");
  const [bulkQuery, setBulkQuery] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExcelUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const report = await onImportExcel(file);
      toast({
        title: "Excel importado",
        description: `${report.importedRows} de ${report.totalRows} filas cargadas desde ${report.fileName}.`,
      });
    } catch (err) {
      toast({
        title: "Error al importar Excel",
        description: err instanceof Error ? err.message : "No se pudo procesar el archivo.",
        variant: "destructive",
      });
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRestoreEndpoint = async () => {
    await onRestoreEndpoint();
    toast({
      title: "Fuente restaurada",
      description: "Se volvió a cargar el inventario desde SAP.",
    });
  };

  const { bulkValues, bulkValuesLower } = useMemo(() => {
    const values = bulkQuery
      .split(/[\n,;\t]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    return {
      bulkValues: values,
      bulkValuesLower: values.map((value) => value.toLowerCase())
    };
  }, [bulkQuery]);

  const { filteredTarimas, highlightMap } = useMemo<{
    filteredTarimas: Tarima[];
    highlightMap: TarimaHighlightMap;
  }>(() => {
    const highlightAccumulator: TarimaHighlightMap = {};

    if (filterMode === "general") {
      const trimmedQuery = generalQuery.trim();

      if (!trimmedQuery) {
        return {
          filteredTarimas: tarimas,
          highlightMap: {}
        };
      }

      const searchLower = trimmedQuery.toLowerCase();

      const result = tarimas.filter((tarima) => {
        const fieldMatches: Partial<Record<HighlightField, string[]>> = {};

        ([
          ["nombreProducto", tarima.nombreProducto],
          ["lote", tarima.lote],
          ["itemNumber", tarima.itemNumber],
          ["claveProducto", tarima.claveProducto],
          ["po", tarima.po]
        ] as Array<[HighlightField, unknown]>).forEach(([fieldKey, rawValue]) => {
          if (normalizeTarimaValue(rawValue).includes(searchLower)) {
            fieldMatches[fieldKey] = [trimmedQuery];
          }
        });

        if (Object.keys(fieldMatches).length > 0) {
          highlightAccumulator[tarima.prodEtiquetaRFIDId] = fieldMatches;
          return true;
        }

        return false;
      });

      return {
        filteredTarimas: result,
        highlightMap: highlightAccumulator
      };
    }

    if (bulkValuesLower.length === 0) {
      return {
        filteredTarimas: tarimas,
        highlightMap: {}
      };
    }

    const modeField = filterModeToField[filterMode as Exclude<TarimaFilterMode, "general">];

    const result = tarimas.filter((tarima) => {
      const rawValue = tarima[modeField as keyof Tarima];
      const targetValue = normalizeTarimaValue(rawValue);

      if (!targetValue) {
        return false;
      }

      const matchedTerms: string[] = [];

      bulkValuesLower.forEach((valueLower, index) => {
        const isMatch = filterMode === "po"
          ? targetValue === valueLower
          : targetValue.includes(valueLower);

        if (isMatch) {
          matchedTerms.push(bulkValues[index]);
        }
      });

      const uniqueMatches = Array.from(new Set(matchedTerms.filter(Boolean)));

      if (uniqueMatches.length > 0) {
        highlightAccumulator[tarima.prodEtiquetaRFIDId] = {
          [modeField]: uniqueMatches
        };
        return true;
      }

      return false;
    });

    return {
      filteredTarimas: result,
      highlightMap: highlightAccumulator
    };
  }, [filterMode, generalQuery, tarimas, bulkValuesLower, bulkValues]);

  const filterSummary = useMemo(() => {
    if (filterMode === "general") {
      return generalQuery.trim();
    }

    if (bulkValues.length === 0) {
      return "";
    }

    const visibleValues = bulkValues.slice(0, 3).join(", ");
    const remainingCount = bulkValues.length - 3;

    const modeLabel: Record<TarimaFilterMode, string> = {
      general: "",
      po: "PO"
    };

    return remainingCount > 0
      ? `${modeLabel[filterMode]}: ${visibleValues} (+${remainingCount} más)`
      : `${modeLabel[filterMode]}: ${visibleValues}`;
  }, [bulkValues, filterMode, generalQuery]);

  const stats = getStats();
  const weightInfo = getWeightInfo();

  // TRANSFORMAR stats para TarimasSearch (formato que espera)
  const searchStats = {
    pendientes: stats.tarimasPendientes,
    asignadas: stats.tarimasAsignadas
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-base font-semibold">Fuente de inventario</p>
              <div className="flex items-center gap-2">
                <Badge variant={dataSource === "excel" ? "default" : "outline"}>
                  {dataSource === "excel" ? (
                    <>
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                      Excel
                    </>
                  ) : (
                    <>
                      <Database className="h-3.5 w-3.5 mr-1" />
                      SAP
                    </>
                  )}
                </Badge>
                {excelImportReport && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {excelImportReport.importedRows}/{excelImportReport.totalRows} filas válidas
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelUpload}
              />

              <Button
                type="button"
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingExcel}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImportingExcel ? "Importando..." : "Subir Excel"}
              </Button>

              {dataSource === "excel" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRestoreEndpoint}
                  disabled={isImportingExcel || loading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Usar SAP
                </Button>
              )}
            </div>
          </div>

          {excelImportReport && excelImportReport.invalidRows > 0 && (
            <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-500/10">
              <AlertTitle>Filas omitidas durante la importación</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  {excelImportReport.invalidRows} fila(s) no se cargaron por validación.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {excelImportReport.errors.slice(0, 3).join(" ")}
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sección de búsqueda y filtros - ACTUALIZADA */}
      <TarimasSearch
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        generalQuery={generalQuery}
        onGeneralQueryChange={setGeneralQuery}
        bulkQuery={bulkQuery}
        onBulkQueryChange={setBulkQuery}
        selectedCount={selectedTarimas.length}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onProcess={onProcessTarimas}
        onClearSelection={onClearSelection}
        weightInfo={weightInfo}
        // NUEVAS PROPS para el filtro de estado
        showAllTarimas={showAllTarimas}
        onToggleShowAll={onToggleShowAll}
        totalTarimasCount={totalTarimasCount}
        filteredTarimasCount={filteredTarimasCount}
        stats={searchStats} // USAR EL FORMATO TRANSFORMADO
      />

      {/* Vista previa de selección - CORREGIDA */}
      {selectedTarimas.length > 0 && showPreview && (
        <SelectedTarimasPreview
          selectedTarimas={selectedTarimas}
          stats={stats} // USAR EL STATS COMPLETO
          onRemoveTarima={removeTarima} // CORREGIDO: usar removeTarima en lugar de onSelectTarima
          onClearProcessedTarimas={onClearProcessedTarimas} // AGREGADA LA NUEVA PROP
          weightInfo={weightInfo}
        />
      )}

      {/* Tabla principal */}
      <TarimasTable
        tarimas={tarimas}
        filteredTarimas={filteredTarimas}
        selectedTarimas={selectedTarimas}
        filterSummary={filterSummary}
        loading={loading}
        onSelectTarima={onSelectTarima}
        weightInfo={weightInfo}
        // NUEVA PROP para mostrar el estado en la tabla
        showAllTarimas={showAllTarimas}
        highlightMap={highlightMap}
      />
    </div>
  );
}
