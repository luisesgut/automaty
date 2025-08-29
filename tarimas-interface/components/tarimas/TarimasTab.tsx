// components/tarimas/TarimasTab.tsx
import { useState } from "react";
import { Tarima } from "@/types";
import TarimasSearch from "./TarimasSearch";
import SelectedTarimasPreview from "./SelectedTarimasPreview";
import TarimasTable from "./TarimasTable";
import { TarimasStats } from "@/types";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  // Aplicar filtro de búsqueda sobre las tarimas ya filtradas por estado
  const filteredTarimas = tarimas.filter((tarima) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      tarima.nombreProducto.toLowerCase().includes(searchLower) ||
      tarima.lote.toLowerCase().includes(searchLower) ||
      tarima.itemNumber.toLowerCase().includes(searchLower) ||
      tarima.claveProducto.toLowerCase().includes(searchLower)
    );
  });

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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
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
        searchTerm={searchTerm}
        loading={loading}
        onSelectTarima={onSelectTarima}
        weightInfo={weightInfo}
        // NUEVA PROP para mostrar el estado en la tabla
        showAllTarimas={showAllTarimas}
      />
    </div>
  );
}