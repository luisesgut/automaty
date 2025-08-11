// components/releases/ProductSelectionModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Search, Plus, Package, Filter, Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { ShippingItem } from "@/types/release";

// Interfaz para las tarimas disponibles (simplificada para selección)
interface AvailableTarima {
  prodEtiquetaRFIDId: number;
  nombreProducto: string;
  claveProducto: string;
  itemNumber: string;
  po: string;
  lote: string;
  cantidad: number;
  unidad: string;
  cajas: number;
  pesoBruto: number;
  pesoNeto: number;
  almacen: string;
  individualUnits?: number;
  totalUnits?: number;
}

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (products: ShippingItem[]) => void;
  currentItems: ShippingItem[];
  isLoading?: boolean; // NUEVO: prop para manejar estado de carga desde el padre
}

export default function ProductSelectionModal({ 
  isOpen, 
  onClose, 
  onAddProducts,
  currentItems,
  isLoading = false // NUEVO: prop con valor por defecto
}: ProductSelectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [availableTarimas, setAvailableTarimas] = useState<AvailableTarima[]>([]);
  const [filteredTarimas, setFilteredTarimas] = useState<AvailableTarima[]>([]);
  const [selectedTarimas, setSelectedTarimas] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "po" | "product">("all");

  // Fetch tarimas disponibles (que no estén ya asignadas a entrega)
  const fetchAvailableTarimas = async () => {
    try {
      setLoading(true);
      
      console.log("🔍 Fetching tarimas disponibles...");
      const response = await fetch("http://172.16.10.31/api/vwStockDestiny");
      
      if (!response.ok) {
        throw new Error(`Error al cargar tarimas: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📦 Tarimas recibidas del servidor: ${data.length}`);
      
      // Filtrar solo las que no están asignadas a entrega
      const available = data.filter((tarima: any) => !tarima.asignadoAentrega);
      console.log(`✅ Tarimas disponibles (no asignadas): ${available.length}`);
      
      // Obtener los RFIDs que ya están en el release actual
      const currentRFIDs = new Set(
        currentItems.map(item => 
          item.trazabilidades?.split(',').map(id => parseInt(id.trim()))
        ).flat().filter(Boolean)
      );
      console.log(`🎯 RFIDs ya en el release: ${Array.from(currentRFIDs).join(', ')}`);
      
      // Filtrar las que no están ya en el release
      const notInRelease = available.filter((tarima: any) => 
        !currentRFIDs.has(tarima.prodEtiquetaRFIDId)
      );
      console.log(`🆕 Tarimas no en release: ${notInRelease.length}`);
      
      setAvailableTarimas(notInRelease);
      setFilteredTarimas(notInRelease);
      
    } catch (err) {
      console.error("❌ Error fetching available tarimas:", err);
      toast({
        title: "Error al cargar productos",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTarimas();
      setSelectedTarimas(new Set());
      setSearchTerm("");
      setFilterBy("all");
    }
  }, [isOpen, currentItems]); // MODIFICADO: agregar currentItems como dependencia

  // Filtrar tarimas según búsqueda y filtro
  useEffect(() => {
    let filtered = availableTarimas;

    // Aplicar búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tarima => 
        tarima.nombreProducto.toLowerCase().includes(term) ||
        tarima.claveProducto.toLowerCase().includes(term) ||
        tarima.itemNumber.toLowerCase().includes(term) ||
        tarima.po.toLowerCase().includes(term) ||
        tarima.lote.toLowerCase().includes(term)
      );
    }

    // Aplicar filtro por categoría
    if (filterBy === "po") {
      // Agrupar por PO para mostrar solo unique POs
      const uniquePOs = Array.from(new Set(filtered.map(t => t.po)));
      filtered = filtered.filter(tarima => uniquePOs.includes(tarima.po));
    } else if (filterBy === "product") {
      // Agrupar por producto
      const uniqueProducts = Array.from(new Set(filtered.map(t => t.nombreProducto)));
      filtered = filtered.filter(tarima => uniqueProducts.includes(tarima.nombreProducto));
    }

    setFilteredTarimas(filtered);
  }, [availableTarimas, searchTerm, filterBy]);

  // Manejar selección de tarimas
  const handleToggleSelection = (tarimaId: number) => {
    if (isLoading) return; // NUEVO: prevenir cambios durante carga
    
    setSelectedTarimas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tarimaId)) {
        newSet.delete(tarimaId);
      } else {
        newSet.add(tarimaId);
      }
      return newSet;
    });
  };

  // Seleccionar/deseleccionar todas las tarimas visibles
  const handleToggleAll = () => {
    if (isLoading) return; // NUEVO: prevenir cambios durante carga
    
    const allVisible = new Set(filteredTarimas.map(t => t.prodEtiquetaRFIDId));
    const allSelected = filteredTarimas.every(t => selectedTarimas.has(t.prodEtiquetaRFIDId));
    
    if (allSelected) {
      // Deseleccionar todas las visibles
      setSelectedTarimas(prev => {
        const newSet = new Set(prev);
        allVisible.forEach(id => newSet.delete(id));
        return newSet;
      });
    } else {
      // Seleccionar todas las visibles
      setSelectedTarimas(prev => new Set([...prev, ...allVisible]));
    }
  };

  // Convertir tarimas seleccionadas a ShippingItems
  const convertToShippingItems = (tarimas: AvailableTarima[]): ShippingItem[] => {
    // Agrupar por producto (PO + ItemNumber)
    const grouped = tarimas.reduce((acc, tarima) => {
      const key = `${tarima.po}-${tarima.itemNumber}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(tarima);
      return acc;
    }, {} as Record<string, AvailableTarima[]>);

    // Crear ShippingItems consolidados
    return Object.values(grouped).map((tarimasDelProducto, index) => {
      const firstTarima = tarimasDelProducto[0];
      const totalPesoBruto = tarimasDelProducto.reduce((sum, t) => sum + t.pesoBruto, 0);
      const totalPesoNeto = tarimasDelProducto.reduce((sum, t) => sum + t.pesoNeto, 0);
      const totalPallets = tarimasDelProducto.length;
      const cajasPorPallet = firstTarima.cajas;
      const trazabilidades = tarimasDelProducto.map(t => t.prodEtiquetaRFIDId).join(', ');

      console.log(`🏗️ Creando ShippingItem para ${firstTarima.nombreProducto}:`, {
        po: firstTarima.po,
        itemNumber: firstTarima.itemNumber,
        pallets: totalPallets,
        trazabilidades,
        pesoBruto: totalPesoBruto,
        pesoNeto: totalPesoNeto
      });

      return {
        id: Date.now() + index, // ID temporal para items nuevos
        company: "BioFlex",
        tableName: "default_table",
        shipDate: new Date().toISOString(),
        poNumber: firstTarima.po,
        sap: "", // Se necesitaría obtener del sistema
        claveProducto: firstTarima.claveProducto,
        customerItemNumber: firstTarima.itemNumber,
        itemDescription: firstTarima.nombreProducto,
        quantityAlreadyShipped: "0",
        pallets: totalPallets,
        casesPerPallet: cajasPorPallet,
        unitsPerCase: firstTarima.individualUnits || 0,
        grossWeight: totalPesoBruto,
        netWeight: totalPesoNeto,
        itemType: "Finished Good",
        salesCSRNames: "Equipo Ventas",
        trazabilidades: trazabilidades,
        destino: "Local",
        quantityOnFloor: 0,
        precioPorUnidad: 0,
        pesoPorPieza: 0,
        costoTotal: 0,
        valorAduanal: 0,
        idReleaseCliente: "",
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        modifiedBy: "Sistema Web"
      };
    });
  };

  // Manejar confirmación de selección
  const handleConfirmSelection = () => {
    if (isLoading) return; // NUEVO: prevenir durante carga
    
    const selectedTarimasData = availableTarimas.filter(t => 
      selectedTarimas.has(t.prodEtiquetaRFIDId)
    );

    if (selectedTarimasData.length === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos una tarima para agregar.",
        variant: "default",
      });
      return;
    }

    console.log("🚀 Confirmando selección de tarimas:", selectedTarimasData.length);
    const newShippingItems = convertToShippingItems(selectedTarimasData);
    console.log("📦 ShippingItems generados:", newShippingItems.length);
    
    onAddProducts(newShippingItems);
  };

  // NUEVO: Función para cerrar el modal (con validación de carga)
  const handleClose = () => {
    if (isLoading) {
      toast({
        title: "Procesando",
        description: "Espera a que termine de procesar los productos.",
        variant: "default",
      });
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl w-full h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl flex items-center space-x-2">
            <span>Agregar Productos al Release</span>
            {/* NUEVO: Indicador de carga en el título */}
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
          </DialogTitle>
          <DialogDescription>
            {isLoading 
              ? "Procesando productos seleccionados..." 
              : "Selecciona las tarimas que deseas agregar al release. Se consolidarán automáticamente por producto."
            }
          </DialogDescription>
        </DialogHeader>

        {/* MODIFICADO: Controles de búsqueda y filtro con estado disabled durante carga */}
        <div className="flex items-center space-x-4 py-4 border-b">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por producto, item number, PO, lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isLoading} // NUEVO: disabled durante carga
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as "all" | "po" | "product")}
              className="px-3 py-2 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading} // NUEVO: disabled durante carga
            >
              <option value="all">Todas</option>
              <option value="po">Por PO</option>
              <option value="product">Por Producto</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {selectedTarimas.size} seleccionadas
          </div>
        </div>

        {/* MODIFICADO: Overlay de carga si está procesando */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <div>
                  <h3 className="font-semibold">Agregando productos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enviando {selectedTarimas.size} productos al servidor...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <LoadingSpinner
              title="Cargando productos disponibles..."
              description="Obteniendo tarimas del inventario"
              size="md"
              className="h-64"
            />
          ) : filteredTarimas.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? "No se encontraron tarimas que coincidan con la búsqueda" : "No hay tarimas disponibles"}
              </p>
              {availableTarimas.length === 0 && (
                <button
                  onClick={fetchAvailableTarimas}
                  disabled={loading}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Recargar Tarimas
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header con checkbox para seleccionar todas */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b py-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={filteredTarimas.length > 0 && filteredTarimas.every(t => selectedTarimas.has(t.prodEtiquetaRFIDId))}
                    onCheckedChange={handleToggleAll}
                    disabled={isLoading} // NUEVO: disabled durante carga
                  />
                  <span className="font-medium text-sm">
                    Seleccionar todas las visibles ({filteredTarimas.length})
                  </span>
                </div>
              </div>

              {/* Lista de tarimas */}
              {filteredTarimas.map((tarima) => (
                <div
                  key={tarima.prodEtiquetaRFIDId}
                  className={`p-4 border rounded-lg transition-all hover:shadow-sm ${
                    isLoading 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'cursor-pointer'
                  } ${
                    selectedTarimas.has(tarima.prodEtiquetaRFIDId)
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                      : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                  onClick={() => handleToggleSelection(tarima.prodEtiquetaRFIDId)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedTarimas.has(tarima.prodEtiquetaRFIDId)}
                      onChange={() => handleToggleSelection(tarima.prodEtiquetaRFIDId)}
                      disabled={isLoading} // NUEVO: disabled durante carga
                    />
                    
                    <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                      <div>
                        <div className="font-medium">{tarima.nombreProducto}</div>
                        <div className="text-gray-500 text-xs">{tarima.claveProducto}</div>
                      </div>
                      
                      <div>
                        <div className="font-mono">{tarima.itemNumber}</div>
                        <div className="text-gray-500 text-xs">Item Number</div>
                      </div>
                      
                      <div>
                        <div className="font-medium">{tarima.po}</div>
                        <div className="text-gray-500 text-xs">PO</div>
                      </div>
                      
                      <div>
                        <div>{tarima.lote}</div>
                        <div className="text-gray-500 text-xs">Lote</div>
                      </div>
                      
                      <div>
                        <div>{tarima.cajas} cajas</div>
                        <div className="text-gray-500 text-xs">{tarima.cantidad.toLocaleString()} und</div>
                      </div>
                      
                      <div>
                        <div>{(tarima.pesoBruto / 1000).toFixed(1)}T</div>
                        <div className="text-gray-500 text-xs">Peso Bruto</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t pt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedTarimas.size > 0 && !isLoading && (
              <span>{selectedTarimas.size} tarimas seleccionadas para agregar al release</span>
            )}
            {isLoading && (
              <span className="text-blue-600 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando productos...</span>
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading} // NUEVO: disabled durante carga
            >
              {isLoading ? "Procesando..." : "Cancelar"}
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={selectedTarimas.size === 0 || isLoading} // MODIFICADO: también disabled durante carga
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Agregar Seleccionadas</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}