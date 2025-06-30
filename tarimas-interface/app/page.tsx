
"use client";

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import FilteredResultItemDisplay from "@/components/FilteredResultItemDisplay"
import PasteExcel from "@/components/pasteExcel"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Package, Truck, BarChart3, Loader2, X, ChevronDown, ChevronUp, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import SeleccionResumen from "@/components/SeleccionResumen"
import ModeToggle from "@/components/mode-toggle"

// Hooks personalizados
import { useTarimas } from "@/hooks/useTarimas";
import { useSelection } from "@/hooks/useSelection";

// Componentes de layout
import Header from "@/components/layout/Header";
import TabNavigation from "@/components/layout/TabNavigation";

// Componentes de tarimas
import TarimasTab from "@/components/tarimas/TarimasTab";

// Componentes de Excel - AGREGADO
import ExcelTab from "@/components/excel/ExcelTab";
import ReleasesTab from "@/components/releases/ReleasesTab";

// Componentes compartidos
import ProcessModal from "@/components/shared/ProcessModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// Tipos
import { ActiveTab, Tarima } from "@/types";

export default function Home() {
  // Estados principales
  const [activeTab, setActiveTab] = useState<ActiveTab>("tarimas");
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Hooks personalizados
  const { tarimas, loading, error, fetchTarimas, updateTarimasStatus } = useTarimas();
  const {
    selectedTarimas,
    handleSelectTarima,
    clearSelection,
    updateSelectedTarimasStatus,
    getStats,
    getWeightInfo,
    PESO_MAXIMO_TONELADAS
  } = useSelection();

  // Función para reiniciar y actualizar
  const handleResetAndRefresh = () => {
    clearSelection();
    setActiveTab("tarimas");

    toast({
      title: "Proceso Reiniciado",
      description: "Se han limpiado los campos y filtros. Actualizando lista de tarimas...",
    });

    fetchTarimas();
  };

  // Función para procesar las tarimas seleccionadas
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

    // Parte 2: Preparar JSON y descargar Excel - VERSIÓN CONSOLIDADA
    if (statusActualizadoExitosamente) {
      try {
        // Agrupar directamente por producto (PO + ItemNumber)
        const productosConsolidados: Record<string, Tarima[]> = {};
        
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

          // Campos actualizados según el nuevo formato
          const company = "BioFlex";
          const shipDate = new Date().toISOString();
          const unitPrice = 0.0;
          const quantityAlreadyShipped = "0";
          const itemType = "Finished Good";
          const salesCSRNames = "Equipo Ventas";
          const unitsPerCase = primeraTarima.individualUnits || 0;
          const sapValue = primeraTarima.ordenSAP || "";
          const claveProducto = primeraTarima.claveProducto || "";

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
          };
        });

        // CREAR UNA SOLA TABLA CONSOLIDADA
        const fechaActual = new Date().toISOString().split('T')[0];
        const tablasParaExcel = [{
          tableName: `BioFlex - Release ${fechaActual}`,
          shippingItems: itemsDeEnvioConsolidados,
        }];

        const payloadExcel = { tables: tablasParaExcel };
        
        // IMPRIMIR JSON EN CONSOLA PARA DEBUG
        console.log("🚀 JSON que se envía al backend:");
        console.log(JSON.stringify(payloadExcel, null, 2));
        
        const nombreArchivoSugerido = `Release_Consolidado_${fechaActual}.xlsx`;
        const urlExcel = `http://172.16.10.31/api/vwStockDestiny/downloadRelease?fileName=${encodeURIComponent(nombreArchivoSugerido)}`;

        const responseExcel = await fetch(urlExcel, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadExcel),
        });

        if (!responseExcel.ok) {
          const errorMsg = await responseExcel.text();
          throw new Error(`Error al generar Excel: ${responseExcel.status}. ${errorMsg.substring(0, 200)}`);
        }

        // Proceso de descarga del archivo
        const blob = await responseExcel.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        const disposition = responseExcel.headers.get('content-disposition');
        let finalFileName = nombreArchivoSugerido;
        if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            finalFileName = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        link.download = finalFileName;

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        toast({
          title: "Excel Consolidado Generado",
          description: `El archivo ${finalFileName} con todas las tarimas en una sola tabla se ha descargado exitosamente.`,
          variant: "default",
        });

      } catch (err) {
        console.error("Error en la generación/descarga de Excel:", err);
        toast({
          title: "Error al Generar Excel",
          description: err instanceof Error ? err.message : "Error desconocido al generar el archivo Excel.",
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
            totalTarimas={tarimas.length}
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
                  tarimas={tarimas}
                  selectedTarimas={selectedTarimas}
                  onSelectTarima={handleSelectTarima}
                  onClearSelection={clearSelection}
                  onProcessTarimas={() => setShowProcessModal(true)}
                  loading={loading}
                  getStats={getStats}
                  getWeightInfo={getWeightInfo}
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