// components/tarimas/TarimasTab.tsx
import { useMemo, useState } from "react";
import { Tarima } from "@/types";
import TarimasSearch, { TarimaFilterMode } from "./TarimasSearch";
import SelectedTarimasPreview from "./SelectedTarimasPreview";
import TarimasTable from "./TarimasTable";
import { TarimasStats } from "@/types";

type HighlightField = "nombreProducto" | "lote" | "itemNumber" | "claveProducto" | "po";
type TarimaHighlightMap = Record<number, Partial<Record<HighlightField, string[]>>>;

const filterModeToField: Record<Exclude<TarimaFilterMode, "general">, HighlightField> = {
  po: "po",
  lote: "lote",
  producto: "nombreProducto",
  customerItem: "itemNumber"
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
  filteredTarimasCount
}: TarimasTabProps) {
  const [filterMode, setFilterMode] = useState<TarimaFilterMode>("general");
  const [generalQuery, setGeneralQuery] = useState("");
  const [bulkQuery, setBulkQuery] = useState("");
  const [showPreview, setShowPreview] = useState(true);

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
        if (targetValue.includes(valueLower)) {
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
      po: "PO",
      lote: "Lote",
      producto: "Producto",
      customerItem: "Customer Item"
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
