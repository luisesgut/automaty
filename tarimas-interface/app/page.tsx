// page.tsx - Actualizado para usar descripción y notas editables
"use client"

import { useState, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { useGlobalErrorHandler } from "@/hooks/useGlobalErrorHandler";

// Hooks personalizados
import { useTarimas } from "@/hooks/useTarimas";
import { useSelection } from "@/hooks/useSelection";

// Componentes de layout
import Header from "@/components/layout/Header";
import TabNavigation from "@/components/layout/TabNavigation";
import Footer from "@/components/layout/Footer";

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
type ProcessingStep = "idle" | "updating-status" | "creating-release" | "completed" | "error";
const INT32_MAX = 2147483647;
const SHOW_EXCEL_PREVIEW_TAB = false;

export default function Home() {
  useGlobalErrorHandler();
  // Estados principales
  const [activeTab, setActiveTab] = useState<ActiveTab>("tarimas");
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // Estados para el proceso mejorado
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [processingMessage, setProcessingMessage] = useState<string>("");
  
  // Estado para controlar el filtro de tarimas
  const [showAllTarimas, setShowAllTarimas] = useState(false);

  // Hooks personalizados
  const {
    tarimas,
    loading,
    error,
    fetchTarimas,
    updateTarimasStatus,
    dataSource,
    excelImportReport,
    isImportingExcel,
    importTarimasFromExcel
  } = useTarimas();
  const {
    selectedTarimas,
    handleSelectTarima,
    clearSelection,
    clearProcessedTarimas,
    updateSelectedTarimasStatus,
    removeTarima,
    getStats,
    getWeightInfo
  } = useSelection();

  // Filtrar tarimas según el estado del switch
  const tarimasFiltradas = useMemo(() => {
    if (showAllTarimas) {
      return tarimas;
    } else {
      return tarimas.filter(tarima => !tarima.asignadoAentrega);
    }
  }, [tarimas, showAllTarimas]);

  // Función para alternar el filtro
  const handleToggleShowAll = (checked: boolean) => {
    setShowAllTarimas(checked);
    clearSelection();
    
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
    setShowAllTarimas(false);
    setProcessingStep("idle");
    setProcessingMessage("");

    toast({
      title: "Proceso Reiniciado",
      description: "Se han limpiado los campos y filtros. Actualizando lista de tarimas...",
    });

    fetchTarimas();
  };

  // Función para procesar las tarimas seleccionadas (ACTUALIZADA con descripción y notas editables)
  const processTarimas = async (createdBy: string, description: string, notes: string) => {
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
    setProcessingStep("updating-status");
    setProcessingMessage(`Actualizando estado de ${tarimasAProcesar.length} tarimas...`);
    
    let statusActualizadoExitosamente = false;

    // Parte 1: Actualizar el estado de las tarimas
    try {
      const resolveRfidId = async (trazabilidad: string) => {
        const response = await fetch(
          `http://172.16.10.31/api/Socket/id-por-trazabilidad/${encodeURIComponent(trazabilidad)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`No se pudo resolver RFID para trazabilidad ${trazabilidad}: ${response.status}. ${errorMsg}`);
        }

        const data = await response.json();
        const id = Number(data?.id);

        if (!Number.isInteger(id) || id <= 0 || id > INT32_MAX) {
          throw new Error(`RFID inválido para trazabilidad ${trazabilidad}.`);
        }

        return id;
      };

      const rfidIds = await Promise.all(
        tarimasAProcesar.map(async (tarima) => {
          const currentId = tarima.prodEtiquetaRFIDId;
          const shouldResolveByTrazabilidad = dataSource === "excel";

          if (!shouldResolveByTrazabilidad && Number.isInteger(currentId) && currentId > 0 && currentId <= INT32_MAX) {
            return currentId;
          }

          const trazabilidad = (tarima.trazabilidad ?? tarima.lote ?? "").trim();
          if (!trazabilidad) {
            throw new Error("La tarima no tiene trazabilidad para consultar el RFID.");
          }

          return resolveRfidId(trazabilidad);
        })
      );

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
      setProcessingStep("error");
      setProcessingMessage("Error al actualizar estado de tarimas");
      
      toast({
        title: "Error en Actualización de Estado",
        description: err instanceof Error ? err.message : "Error desconocido al actualizar estado.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setProcessingLoading(false);
        setShowProcessModal(false);
        setProcessingStep("idle");
        setProcessingMessage("");
      }, 3000);
      
      return;
    }

    // Parte 2: Crear Release usando el nuevo endpoint
    if (statusActualizadoExitosamente) {
      try {
        setProcessingStep("creating-release");
        setProcessingMessage("Creando release consolidado...");
        
        // Obtener el consecutivo del endpoint
        const urlMaxId = "http://172.16.10.31/api/ReleaseDestiny/destiny-release-maxId";
        
        let consecutivo = 1;
        
        try {
          const responseMaxId = await fetch(urlMaxId, {
            method: "GET",
            headers: {
              "Accept": "application/json",
            },
          });

          if (responseMaxId.ok) {
            const maxIdResponse = await responseMaxId.json();
            consecutivo = maxIdResponse.maxId || 1;
            console.log(`📊 Consecutivo obtenido del servidor: ${consecutivo}`);
          } else {
            console.warn("No se pudo obtener el maxId, usando consecutivo por defecto");
          }
        } catch (maxIdError) {
          console.error("Error al obtener maxId:", maxIdError);
          console.warn("Usando consecutivo por defecto: 1");
        }
        
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

          // Recopilar todos los lotes y unirlos en una cadena JSON
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
            trazabilidades: trazabilidades,
            precioPorUnidad: precioPorUnidad
          };
        });

        // Preparar el payload con descripción y notas editables
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreRelease = `LOAD_${fechaActual}_${consecutivo}`;
        
        const payloadRelease = {
          fileName: `${nombreRelease}`,
          description: description, // USAR LA DESCRIPCIÓN EDITADA POR EL USUARIO
          notes: notes, // USAR LAS NOTAS EDITADAS POR EL USUARIO
          createdBy: createdBy,
          shippingItems: itemsDeEnvioConsolidados,
        };

        // IMPRIMIR JSON EN CONSOLA PARA DEBUG
        console.log("🚀 JSON que se envía al endpoint /create:");
        console.log(JSON.stringify(payloadRelease, null, 2));

        // Llamar al endpoint
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

        // Marcar como completado
        setProcessingStep("completed");
        setProcessingMessage(`Release "${nombreRelease}" creado exitosamente`);

        toast({
          title: "Release Creado Exitosamente",
          description: `Se ha creado el release "${nombreRelease}" con ${tarimasAProcesar.length} tarimas procesadas.`,
          variant: "default",
        });

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          setProcessingLoading(false);
          setShowProcessModal(false);
          setProcessingStep("idle");
          setProcessingMessage("");
          
          // Refrescar datos
          fetchTarimas();
        }, 2000);

      } catch (err) {
        console.error("Error en la creación del release:", err);
        setProcessingStep("error");
        setProcessingMessage("Error al crear el release");
        
        toast({
          title: "Error al Crear Release",
          description: err instanceof Error ? err.message : "Error desconocido al crear el release.",
          variant: "destructive",
        });

        // Resetear después de 3 segundos
        setTimeout(() => {
          setProcessingLoading(false);
          setShowProcessModal(false);
          setProcessingStep("idle");
          setProcessingMessage("");
        }, 3000);
      }
    }
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
            onClick={() => {
              void fetchTarimas();
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50">
      <Toaster />

      {/* Header */}
      <Header
        totalTarimas={tarimas.length}
        onRefresh={handleResetAndRefresh}
        isLoading={loading}
      />

      {/* Navigation Tabs */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedCount={selectedTarimas.length}
        showExcelTab={SHOW_EXCEL_PREVIEW_TAB}
      />

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        {activeTab === "tarimas" && (
          <TarimasTab
            tarimas={tarimasFiltradas}
            selectedTarimas={selectedTarimas}
            onSelectTarima={handleSelectTarima}
            onClearSelection={clearSelection}
            onClearProcessedTarimas={clearProcessedTarimas}
            removeTarima={removeTarima}
            onProcessTarimas={() => setShowProcessModal(true)}
            loading={loading}
            getStats={getStats}
            getWeightInfo={getWeightInfo}
            showAllTarimas={showAllTarimas}
            onToggleShowAll={handleToggleShowAll}
            totalTarimasCount={tarimas.length}
            filteredTarimasCount={tarimasFiltradas.length}
            dataSource={dataSource}
            excelImportReport={excelImportReport}
            isImportingExcel={isImportingExcel}
            onImportExcel={importTarimasFromExcel}
            onRestoreEndpoint={async () => {
              await fetchTarimas();
            }}
          />
        )}

        {SHOW_EXCEL_PREVIEW_TAB && activeTab === "excel" && (
          <ExcelTab
            selectedTarimas={selectedTarimas}
            onSelectTarima={handleSelectTarima}
            onClearSelection={clearSelection}
            onClearProcessedTarimas={clearProcessedTarimas}
            removeTarima={removeTarima}
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

      <Footer />

      {/* Process Modal - ACTUALIZADO para recibir descripción y notas */}
      <ProcessModal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        selectedTarimas={selectedTarimas}
        onConfirmProcess={processTarimas} // Ahora recibe createdBy, description y notes
        isProcessing={processingLoading}
        processingStep={processingStep}
        processingMessage={processingMessage}
      />
      </div>
    </ErrorBoundary>
  );
}
