// src/components/releases/AddItemToReleaseModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, Filter, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";

// Interfaz para el stock disponible
interface StockItem {
  claveProducto: string;
  lote: string;
  nombreProducto: string;
  unidad: string;
  almacen: string;
  cantidad: number;
  po: string;
  pesoBruto: number;
  pesoNeto: number;
  cajas: number;
  ordenSAP: string;
  prodEtiquetaRFIDId?: number; // Este es el campo correcto
  itemNumber: string;
  individualUnits: number;
  totalUnits: number;
  uom: string;
  asignadoAentrega: boolean;
}

// Interfaz para el item a agregar al release
interface NewReleaseItem {
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
  trazabilidades: string;
}

interface AddItemToReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: number;
  onItemAdded: () => void; // Callback para refrescar la lista después de agregar
}

export default function AddItemToReleaseModal({
  isOpen,
  onClose,
  releaseId,
  onItemAdded
}: AddItemToReleaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [addingItems, setAddingItems] = useState(false);
  const [filterAsignados, setFilterAsignados] = useState(true); // Mostrar solo asignados por defecto

  // Cargar stock disponible
  const fetchStock = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://172.16.10.31/api/vwStockDestiny');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Stock cargado:', data.length, 'items');
        setStockItems(data);
      } else {
        throw new Error('Error al cargar el stock');
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast({
        title: "Error al cargar stock",
        description: "No se pudo cargar la información del stock disponible",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedItems(new Set());
      setSearchTerm("");
      fetchStock();
    }
  }, [isOpen]);

  // Filtrar y agrupar items
  const filteredAndGroupedItems = useMemo(() => {
    let filtered = stockItems;

    // Filtrar por asignados a entrega
    if (filterAsignados) {
      filtered = filtered.filter(item => item.asignadoAentrega === true);
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.nombreProducto.toLowerCase().includes(term) ||
        item.itemNumber.toLowerCase().includes(term) ||
        item.claveProducto.toLowerCase().includes(term) ||
        item.lote.toLowerCase().includes(term) ||
        item.po.toLowerCase().includes(term)
      );
    }

    // Agrupar por producto (itemNumber + claveProducto)
    const grouped = new Map<string, {
      product: StockItem;
      lotes: StockItem[];
      totalQuantity: number;
      totalCases: number;
    }>();

    filtered.forEach(item => {
      const key = `${item.itemNumber}-${item.claveProducto}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          product: item,
          lotes: [item],
          totalQuantity: item.cantidad,
          totalCases: item.cajas
        });
      } else {
        const existing = grouped.get(key)!;
        existing.lotes.push(item);
        existing.totalQuantity += item.cantidad;
        existing.totalCases += item.cajas;
      }
    });

    return Array.from(grouped.values());
  }, [stockItems, searchTerm, filterAsignados]);

  // Manejar selección de items
  const handleItemSelect = (productKey: string, product: any) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productKey)) {
      newSelected.delete(productKey);
    } else {
      newSelected.add(productKey);
    }
    setSelectedItems(newSelected);
  };

  // Agregar items seleccionados al release
  const handleAddSelectedItems = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos un item para agregar",
        variant: "destructive",
      });
      return;
    }

    setAddingItems(true);

    try {
      for (const productKey of selectedItems) {
        const groupedItem = filteredAndGroupedItems.find(item => 
          `${item.product.itemNumber}-${item.product.claveProducto}` === productKey
        );
        
        if (!groupedItem) continue;

        const product = groupedItem.product;
        const lotesArray = groupedItem.lotes.map(l => l.lote);

        // Preparar el item para el release
        const newItem: NewReleaseItem = {
          company: "BioFlex", // Valor por defecto
          shipDate: new Date().toISOString(),
          poNumber: product.po,
          sap: product.ordenSAP,
          claveProducto: product.claveProducto,
          customerItemNumber: product.itemNumber,
          itemDescription: product.nombreProducto,
          quantityAlreadyShipped: "0",
          pallets: Math.ceil(groupedItem.totalCases / 40), // Estimación: 40 cajas por pallet
          casesPerPallet: Math.min(40, groupedItem.totalCases),
          unitsPerCase: product.individualUnits || 1000,
          grossWeight: groupedItem.lotes.reduce((sum, l) => sum + l.pesoBruto, 0),
          netWeight: groupedItem.lotes.reduce((sum, l) => sum + l.pesoNeto, 0),
          itemType: "Finished Good",
          salesCSRNames: "Equipo Ventas",
          trazabilidades: JSON.stringify(lotesArray)
        };

        // Llamar al endpoint
        const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/releases/${releaseId}/add-item`, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newItem)
        });

        if (!response.ok) {
          throw new Error(`Error al agregar ${product.itemNumber}: ${response.status}`);
        }

        console.log(`✅ Item agregado: ${product.itemNumber}`);
      }

      toast({
        title: "Items agregados exitosamente",
        description: `Se agregaron ${selectedItems.size} items al release`,
        variant: "default",
      });

      // Limpiar selección y cerrar modal
      setSelectedItems(new Set());
      onItemAdded(); // Refrescar la lista del release
      onClose();

    } catch (error) {
      console.error('Error adding items:', error);
      toast({
        title: "Error al agregar items",
        description: "Hubo un problema al agregar algunos items al release",
        variant: "destructive",
      });
    } finally {
      setAddingItems(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Agregar Items al Release</span>
            <Badge variant="outline">Release ID: {releaseId}</Badge>
          </DialogTitle>
          <DialogDescription>
            Selecciona items del stock disponible para agregar al release
          </DialogDescription>
        </DialogHeader>

        {/* Controles de búsqueda y filtros */}
        <div className="flex items-center space-x-4 py-4 border-b">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar por producto, item number, lote, PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={filterAsignados ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterAsignados(!filterAsignados)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>{filterAsignados ? "Solo Asignados" : "Todos"}</span>
          </Button>
          <Badge variant="secondary">
            {filteredAndGroupedItems.length} productos
          </Badge>
        </div>

        {/* Lista de stock */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSpinner title="Cargando stock disponible..." size="sm" />
          ) : filteredAndGroupedItems.length > 0 ? (
            <div className="space-y-3">
              {filteredAndGroupedItems.map((group) => {
                const productKey = `${group.product.itemNumber}-${group.product.claveProducto}`;
                const isSelected = selectedItems.has(productKey);
                
                return (
                  <div
                    key={productKey}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => handleItemSelect(productKey, group)}
                  >
                    <div className="flex items-start justify-between">
                      {/* Información del producto */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-slate-300'
                          }`}>
                            {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                              {group.product.itemNumber} - {group.product.nombreProducto}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                              <span>Clave: {group.product.claveProducto}</span>
                              <span>PO: {group.product.po}</span>
                              <span>SAP: {group.product.ordenSAP}</span>
                              <span>Almacén: {group.product.almacen}</span>
                            </div>
                          </div>
                        </div>

                        {/* Estadísticas consolidadas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-green-400">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Total Cantidad</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {group.totalQuantity.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-blue-400">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Total Cajas</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {group.totalCases.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-purple-400">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">Lotes</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {group.lotes.length}
                            </span>
                          </div>
                          <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-orange-400">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">UOM</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {group.product.uom}
                            </span>
                          </div>
                        </div>

                        {/* Lista de lotes (máximo 3 visibles) */}
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Lotes incluidos:</span>
                          <div className="flex flex-wrap gap-1">
                            {group.lotes.slice(0, 3).map((lote, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {lote.lote} ({lote.cantidad})
                              </Badge>
                            ))}
                            {group.lotes.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{group.lotes.length - 3} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Estado */}
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Disponible
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Pallets est: {Math.ceil(group.totalCases / 40)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <AlertCircle className="mx-auto h-16 w-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">No hay stock disponible</p>
              <p className="text-sm mt-2">
                {searchTerm ? 'No se encontraron productos que coincidan con tu búsqueda' : 'No hay productos disponibles'}
              </p>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {selectedItems.size} items seleccionados
            </span>
            {selectedItems.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems(new Set())}
              >
                Limpiar selección
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSelectedItems}
              disabled={selectedItems.size === 0 || addingItems}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
            >
              {addingItems ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar {selectedItems.size} Items
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}