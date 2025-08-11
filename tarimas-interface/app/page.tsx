// page.tsx - Actualizado con filtrado de tarimas
"use client"

import { useState, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";

// Hooks personalizados
import { useTarimas } from "@/hooks/useTarimas";
import { useSelection } from "@/hooks/useSelection";

// Componentes de layout
import Header from "@/components/layout/Header";
import TabNavigation from "@/components/layout/TabNavigation";

// Componentes de tarimas
import TarimasTab from "@/components/tarimas/TarimasTab";

// Componentes de Excel
import ExcelTab from "@/components/excel/ExcelTab";

// Componentes de Releases
import ReleasesTab from "@/components/releases/ReleasesTab";

// Componentes compartidos
import ProcessModal from "@/components/shared/ProcessModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// Tipos
type ActiveTab = "tarimas" | "excel" | "releases";

export default function Home() {
  // Estados principales
  const [activeTab, setActiveTab] = useState<ActiveTab>("tarimas");
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // NUEVO: Estado para controlar el filtro de tarimas
  const [showAllTarimas, setShowAllTarimas] = useState(false);

  // Hooks personalizados
  const { tarimas, loading, error, fetchTarimas, updateTarimasStatus } = useTarimas();
  const {
    selectedTarimas,
    handleSelectTarima,
    clearSelection,
    updateSelectedTarimasStatus,
    getStats,
    getWeightInfo
    } = useSelection();

  // NUEVO: Filtrar tarimas según el estado del switch
  const tarimasFiltradas = useMemo(() => {
    if (showAllTarimas) {
      // Mostrar todas las tarimas
      return tarimas;
    } else {
      // Mostrar solo las tarimas pendientes (no asignadas a entrega)
      return tarimas.filter(tarima => !tarima.asignadoAentrega);
    }
  }, [tarimas, showAllTarimas]);

  // NUEVO: Función para alternar el filtro
  const handleToggleShowAll = (checked: boolean) => {
    setShowAllTarimas(checked);
    
    // Limpiar selección cuando cambie el filtro
    clearSelection();
    
    // Mostrar toast informativo
    if (checked) {
      toast({
        title: "Mostrando todas las tarimas",
        description: "Ahora se muestran tanto las pendientes como las ya asignadas a entrega.",
        variant: "default",
      });
    } else {
      toast({
        title: "Mostrando solo pendientes",
        description: "Ahora se muestran únicamente las tarimas pendientes de asignar.",
        variant: "default",
      });
    }
  };

  // Función para reiniciar y actualizar
  const handleResetAndRefresh = () => {
    clearSelection();
    setActiveTab("tarimas");
    setShowAllTarimas(false); // NUEVO: Resetear también el filtro

    toast({
      title: "Proceso Reiniciado",
      description: "Se han limpiado los campos y filtros. Actualizando lista de tarimas...",
    });

    fetchTarimas();
  };

  // Función para procesar las tarimas seleccionadas (ACTUALIZADA con nuevo endpoint)
 // Función para procesar las tarimas seleccionadas (ACTUALIZADA con el nuevo formato JSON)
const processTarimas = async () => {
    const tarimasAProcesar = selectedTarimas.filter(t => !t.asignadoAentrega);

    if (tarimasAProcesar.length === 0) {
      toast({
        title: "Nada que procesar",
        description: "Todas las tarimas seleccionadas ya están asignadas o no hay tarimas seleccionadas válidas.",
        variant: "default",
      });
      return;
    }

    setProcessingLoading(true);
    let statusActualizadoExitosamente = false;

    // Parte 1: Actualizar el estado de las tarimas
    try {
      const rfidIds = tarimasAProcesar.map(tarima => tarima.prodEtiquetaRFIDId);
      const urlActualizacionEstado = "http://172.16.10.31/api/LabelDestiny/UpdateProdExtrasDestinyStatus?marcado=true";

      const responseEstado = await fetch(urlActualizacionEstado, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(rfidIds),
      });

      if (!responseEstado.ok) {
        const errorMsg = await responseEstado.text();
        throw new Error(`Error al actualizar estado: ${responseEstado.status}. ${errorMsg}`);
      }

      // Actualizar estado local
      updateTarimasStatus(tarimasAProcesar);
      updateSelectedTarimasStatus(tarimasAProcesar);

      toast({
        title: "Estado Actualizado",
        description: `${tarimasAProcesar.length} tarima(s) marcada(s) como asignada(s) a entrega.`,
        variant: "default",
      });
      statusActualizadoExitosamente = true;

    } catch (err) {
      console.error("Error al actualizar estado de tarimas:", err);
      toast({
        title: "Error en Actualización de Estado",
        description: err instanceof Error ? err.message : "Error desconocido al actualizar estado.",
        variant: "destructive",
      });
      setProcessingLoading(false);
      setShowProcessModal(false);
      return;
    }

    // Parte 2: Crear Release usando el nuevo endpoint
    if (statusActualizadoExitosamente) {
      try {
        // Agrupar directamente por producto (PO + ItemNumber)
        const productosConsolidados: Record<string, any[]> = {};

        for (const tarima of tarimasAProcesar) {
          const claveProducto = `${tarima.po}-${tarima.itemNumber}`;
          if (!productosConsolidados[claveProducto]) {
            productosConsolidados[claveProducto] = [];
          }
          productosConsolidados[claveProducto].push(tarima);
        }

        // Crear los items de envío consolidados
        const itemsDeEnvioConsolidados = Object.values(productosConsolidados).map(tarimasDelProducto => {
          const primeraTarima = tarimasDelProducto[0];
          const totalPesoBruto = tarimasDelProducto.reduce((sum, t) => sum + t.pesoBruto, 0);
          const totalPesoNeto = tarimasDelProducto.reduce((sum, t) => sum + t.pesoNeto, 0);
          const totalPallets = tarimasDelProducto.length;
          const cajasPorPallet = primeraTarima.cajas;

          // NUEVO: Recopilar todos los RFIDId y unirlos en una cadena
          const trazabilidades = JSON.stringify(tarimasDelProducto.map(t => t.lote));
          // Campos para el nuevo formato
          const company = "BioFlex";
          const shipDate = new Date().toISOString();
          const quantityAlreadyShipped = "0";
          const itemType = "Finished Good";
          const salesCSRNames = "Equipo Ventas";
          const unitsPerCase = primeraTarima.individualUnits || 0;
          const sapValue = primeraTarima.ordenSAP || "";
          const claveProducto = primeraTarima.claveProducto || "";
          const precioPorUnidad = 0;

          if (!sapValue || sapValue.trim() === "") {
            console.warn(`ADVERTENCIA: El campo SAP (ordenSAP) está vacío para PO: ${primeraTarima.po}, Item: ${primeraTarima.itemNumber}`);
          }

          return {
            company: company,
            shipDate: shipDate,
            poNumber: primeraTarima.po,
            sap: sapValue,
            claveProducto: claveProducto,
            customerItemNumber: primeraTarima.itemNumber,
            itemDescription: primeraTarima.nombreProducto,
            quantityAlreadyShipped: quantityAlreadyShipped,
            pallets: totalPallets,
            casesPerPallet: cajasPorPallet,
            unitsPerCase: unitsPerCase,
            grossWeight: totalPesoBruto,
            netWeight: totalPesoNeto,
            itemType: itemType,
            salesCSRNames: salesCSRNames,
            trazabilidades: trazabilidades, // NUEVO: Se agrega el campo trazabilidades
            precioPorUnidad: precioPorUnidad
          };
        });

        // Preparar el payload para el nuevo endpoint
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreRelease = `Release_Consolidado_${fechaActual}`;
        
        // --- INICIO DEL CAMBIO IMPORTANTE ---
        // El array `shippingItems` ahora va directamente en el payload, sin anidarlo en `excelData`.
        const payloadRelease = {
          fileName: `${nombreRelease}.xlsx`,
          description: `Release consolidado generado automáticamente el ${fechaActual}`,
          notes: `Release creado con ${tarimasAProcesar.length} tarimas procesadas (${Object.keys(productosConsolidados).length} productos únicos)`,
          createdBy: "Sistema Web",
          shippingItems: itemsDeEnvioConsolidados, // El array consolidado se asigna directamente aquí.
        };
        // --- FIN DEL CAMBIO IMPORTANTE ---

        // IMPRIMIR JSON EN CONSOLA PARA DEBUG
        console.log("🚀 JSON que se envía al nuevo endpoint /create:");
        console.log(JSON.stringify(payloadRelease, null, 2));

        // Llamar al NUEVO endpoint
        const urlCreateRelease = "http://172.16.10.31/api/ReleaseDestiny/create";
        
        const responseCreate = await fetch(urlCreateRelease, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadRelease),
        });

        if (!responseCreate.ok) {
          const errorMsg = await responseCreate.text();
          throw new Error(`Error al crear release: ${responseCreate.status}. ${errorMsg.substring(0, 200)}`);
        }

        // Obtener la respuesta del servidor
        const releaseResponse = await responseCreate.json();
        console.log("✅ Respuesta del servidor:", releaseResponse);

        toast({
          title: "Release Creado Exitosamente",
          description: `Se ha creado el release "${nombreRelease}" con ${tarimasAProcesar.length} tarimas procesadas.`,
          variant: "default",
        });

      } catch (err) {
        console.error("Error en la creación del release:", err);
        toast({
          title: "Error al Crear Release",
          description: err instanceof Error ? err.message : "Error desconocido al crear el release.",
          variant: "destructive",
        });
      }
    }

    setProcessingLoading(false);
    setShowProcessModal(false);
  };
  // Mostrar pantalla de carga inicial
  if (loading && tarimas.length === 0) {
    return (
        <div className="min-h-screen">
          <LoadingSpinner
              title="Cargando inventario de tarimas..."
              description="Conectando con el servidor y obteniendo datos actualizados"
              size="lg"
              className="h-screen"
          />
        </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Error al cargar datos
              </h2>
              <p className="text-red-600 dark:text-red-300 text-sm">
                {error}
              </p>
            </div>
            <button
                onClick={fetchTarimas}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50">
        <Toaster />

        {/* Header */}
        <Header
            totalTarimas={tarimas.length} // Mostrar total real de tarimas
            onRefresh={handleResetAndRefresh}
            isLoading={loading}
        />

        {/* Navigation Tabs */}
        <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedCount={selectedTarimas.length}
        />

        {/* Main Content */}
        <main className="container mx-auto py-6 px-4">
          {activeTab === "tarimas" && (
              <TarimasTab
                  tarimas={tarimasFiltradas} // USAR TARIMAS FILTRADAS
                  selectedTarimas={selectedTarimas}
                  onSelectTarima={handleSelectTarima}
                  onClearSelection={clearSelection}
                  onProcessTarimas={() => setShowProcessModal(true)}
                  loading={loading}
                  getStats={getStats}
                  getWeightInfo={getWeightInfo}
                  // NUEVAS PROPS para el filtro
                  showAllTarimas={showAllTarimas}
                  onToggleShowAll={handleToggleShowAll}
                  totalTarimasCount={tarimas.length}
                  filteredTarimasCount={tarimasFiltradas.length}
              />
          )}

          {activeTab === "excel" && (
              <ExcelTab
                  selectedTarimas={selectedTarimas}
                  onSelectTarima={handleSelectTarima}
                  onClearSelection={clearSelection}
                  onProcessTarimas={() => setShowProcessModal(true)}
                  showPreview={showPreview}
                  onTogglePreview={() => setShowPreview(!showPreview)}
                  getStats={getStats}
                  getWeightInfo={getWeightInfo}
              />
          )}

          {activeTab === "releases" && (
              <ReleasesTab />
          )}
        </main>

        {/* Process Modal */}
        <ProcessModal
            isOpen={showProcessModal}
            onClose={() => setShowProcessModal(false)}
            selectedTarimas={selectedTarimas}
            onConfirmProcess={processTarimas}
            isProcessing={processingLoading}
        />
      </div>
  );
}