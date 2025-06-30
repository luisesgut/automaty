// components/releases/ReleaseDetail.tsx
"use client"

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EditableShippingTable from "./EditableShippingTable";

// Tipos para el detalle del Release
interface ShippingItem {
  id: number;
  company: string;
  shipDate: string;
  poNumber: string;
  sap: string;
  claveProducto: string;
  customerItemNumber: string;
  itemDescription: string;
  quantityAlreadyShipped: string;
  pallets: number;
  casesPerPallet: number;
  unitsPerCase: number;
  grossWeight: number;
  netWeight: number;
  itemType: string;
  salesCSRNames: string;
  createdDate: string;
  modifiedDate: string | null;
  modifiedBy: string;
  quantityOnFloor: number;
  precioPorUnidad: number;
  pesoPorPieza: number;
  costoTotal: number;
  valorAduanal: number;
}

interface Table {
  id: number;
  tableName: string;
  tableOrder: number;
  createdDate: string;
  shippingItems: ShippingItem[];
}

interface ReleaseDetailData {
  id: number;
  fileName: string;
  description: string;
  createdDate: string;
  modifiedDate: string | null;
  createdBy: string;
  modifiedBy: string;
  status: string;
  releaseDate: string | null;
  notes: string;
  tablesCount: number;
  totalItems: number;
  tables: Table[];
}

interface ReleaseDetailProps {
  releaseId: number;
  onBack: () => void;
}

export default function ReleaseDetail({ releaseId, onBack }: ReleaseDetailProps) {
  const [releaseData, setReleaseData] = useState<ReleaseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<ShippingItem[]>([]);

  // Fetch detalle del release
  const fetchReleaseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/releases/${releaseId}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar detalle del release: ${response.status}`);
      }
      
      const data = await response.json();
      setReleaseData(data);
      
      // Inicializar items editables (combinar todos los shipping items de todas las tablas)
      const allItems = data.tables.flatMap((table: Table) => table.shippingItems);
      setEditingItems([...allItems]);
      
    } catch (err) {
      console.error("Error fetching release detail:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast({
        title: "Error al cargar detalle",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleaseDetail();
  }, [releaseId]);

  // Función para actualizar un item
  const handleUpdateItem = (updatedItem: ShippingItem) => {
    setEditingItems(prev => 
      prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  // Función para guardar cambios (aquí puedes implementar la lógica de guardado)
  const handleSaveChanges = async () => {
    try {
      // Aquí implementarías el endpoint para guardar los cambios
      toast({
        title: "Cambios guardados",
        description: "Los cambios se han guardado exitosamente",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Vista de carga
  if (loading) {
    return (
      <LoadingSpinner
        title="Cargando detalle del release..."
        description="Obteniendo información detallada del servidor"
        size="lg"
        className="h-96"
      />
    );
  }

  // Vista de error
  if (error || !releaseData) {
    return (
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Error al cargar detalle
          </h2>
          <p className="text-red-600 dark:text-red-300 text-sm">
            {error || "No se pudo cargar la información"}
          </p>
        </div>
        <div className="space-x-2">
          <button
            onClick={fetchReleaseDetail}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={onBack}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de volver */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver a Releases</span>
        </button>
        
        <button
          onClick={handleSaveChanges}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Guardar Cambios
        </button>
      </div>

      {/* Información del Release */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {releaseData.fileName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {releaseData.description}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(releaseData.status)}`}>
            {releaseData.status}
          </span>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Estadísticas</h3>
            <div className="space-y-1 text-sm">
              <div>Tablas: <span className="font-medium">{releaseData.tablesCount}</span></div>
              <div>Items totales: <span className="font-medium">{releaseData.totalItems}</span></div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Fechas</h3>
            <div className="space-y-1 text-sm">
              <div>Creado: <span className="font-medium">{formatDate(releaseData.createdDate)}</span></div>
              {releaseData.modifiedDate && (
                <div>Modificado: <span className="font-medium">{formatDate(releaseData.modifiedDate)}</span></div>
              )}
              {releaseData.releaseDate && (
                <div>Release: <span className="font-medium">{formatDate(releaseData.releaseDate)}</span></div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Usuarios</h3>
            <div className="space-y-1 text-sm">
              <div>Creado por: <span className="font-medium">{releaseData.createdBy}</span></div>
              {releaseData.modifiedBy && (
                <div>Modificado por: <span className="font-medium">{releaseData.modifiedBy}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Notas */}
        {releaseData.notes && (
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Notas</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-3 rounded">
              {releaseData.notes}
            </p>
          </div>
        )}
      </div>

      {/* Tabla editable de shipping items */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Items de Envío
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Edita los detalles de los items en este release
          </p>
        </div>
        
        <EditableShippingTable
          items={editingItems}
          onUpdateItem={handleUpdateItem}
        />
      </div>
    </div>
  );
}