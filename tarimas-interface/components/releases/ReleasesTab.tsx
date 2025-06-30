// components/releases/ReleasesTab.tsx
"use client"

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ReleaseCard from "./ReleaseCard";
import ReleaseDetail from "./ReleaseDetail";

// Tipos para Release
interface Release {
  id: number;
  fileName: string;
  description: string;
  createdDate: string;
  createdBy: string;
  status: string;
  releaseDate: string | null;
  tablesCount: number;
  totalItems: number;
}

interface ReleasesTabProps {
  // Props si necesitas pasar algo desde el componente padre
}

export default function ReleasesTab({}: ReleasesTabProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch releases del endpoint
  const fetchReleases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("http://172.16.10.31/api/ReleaseDestiny/releases");
      
      if (!response.ok) {
        throw new Error(`Error al cargar releases: ${response.status}`);
      }
      
      const data = await response.json();
      setReleases(data);
      
    } catch (err) {
      console.error("Error fetching releases:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast({
        title: "Error al cargar releases",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  // Función para volver a la lista
  const handleBackToList = () => {
    setSelectedReleaseId(null);
    fetchReleases(); // Refrescar la lista
  };

  // Vista de carga
  if (loading && releases.length === 0) {
    return (
      <LoadingSpinner
        title="Cargando releases..."
        description="Obteniendo lista de releases del servidor"
        size="lg"
        className="h-96"
      />
    );
  }

  // Vista de error
  if (error && releases.length === 0) {
    return (
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Error al cargar releases
          </h2>
          <p className="text-red-600 dark:text-red-300 text-sm">
            {error}
          </p>
        </div>
        <button
          onClick={fetchReleases}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Si hay un release seleccionado, mostrar detalle
  if (selectedReleaseId) {
    return (
      <ReleaseDetail
        releaseId={selectedReleaseId}
        onBack={handleBackToList}
      />
    );
  }

  // Vista principal: Lista de releases
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Releases
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestiona y visualiza los releases generados
          </p>
        </div>
        <button
          onClick={fetchReleases}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Lista de releases */}
      {releases.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border">
          <p className="text-slate-500 dark:text-slate-400">
            No hay releases disponibles
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releases.map((release) => (
            <ReleaseCard
              key={release.id}
              release={release}
              onClick={() => setSelectedReleaseId(release.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}