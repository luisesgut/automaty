"use client";

import { useState, useMemo, useEffect } from "react";
import { ShippingItem } from "@/types/release";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle, Edit3, Eye, Check, X, Package, Truck, MapPin, Plus, User } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Opciones predefinidas
const destinoOptions = ["Yuma CA", "Salinas CA", "Bakersfield CA", "Coachella"];
const itemTypeOptions = ["Bag No Wicket/Zipper", "Bag Wicket", "Bag Zipper", "Film"];
const modifiedByOptions = ["Moises Jimenez", "Rebeca Franco", "Otro"];

// --- INTERFACES NECESARIAS ---
interface StockItem {
  lote: string;
  nombreProducto: string;
  itemNumber: string;
  claveProducto: string;
  pesoBruto: number;
  pesoNeto: number;
  cajas: number;
  cantidad: number;
  asignadoAentrega: boolean;
  rfidId?: string; // Agregado para compatibilidad
  prodEtiquetaRFIDId?: number; // Este es el campo correcto
}

interface TrazabilidadDetail {
  lote: string;
  pesoBruto: number;
  pesoNeto: number;
  cajas: number;
  cantidad: number;
}

// --- MODAL PARA VER DETALLES DE TRAZABILIDADES (CON INFORMACIÓN COMPLETA) ---
const TraceabilityDetailsModal = ({ 
  isOpen, 
  onClose, 
  trazabilidadesString, 
  itemDescription
}: {
  isOpen: boolean;
  onClose: () => void;
  trazabilidadesString: string | null;
  itemDescription: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [lotes, setLotes] = useState<any[]>([]);

  const fetchLoteDetails = async () => {
    if (!trazabilidadesString) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://172.16.10.31/api/vwStockDestiny");
      if (!response.ok) throw new Error("No se pudo obtener el stock");
      const allStock: any[] = await response.json();

      let lotesActuales: string[] = [];
      try {
        lotesActuales = JSON.parse(trazabilidadesString);
      } catch {
        lotesActuales = [];
      }

      const lotesConDetalles: any[] = [];
      lotesActuales.forEach(loteNum => {
        const stockInfo = allStock.find(s => s.lote === loteNum);
        if (stockInfo) {
          lotesConDetalles.push({
            lote: stockInfo.lote,
            nombreProducto: stockInfo.nombreProducto,
            cantidad: stockInfo.cantidad,
            pesoBruto: stockInfo.pesoBruto,
            pesoNeto: stockInfo.pesoNeto,
            cajas: stockInfo.cajas,
            po: stockInfo.po,
            rfidId: stockInfo.prodEtiquetaRFIDId?.toString(),
            claveProducto: stockInfo.claveProducto,
            itemNumber: stockInfo.itemNumber,
            ordenSAP: stockInfo.ordenSAP,
            unidad: stockInfo.unidad,
            almacen: stockInfo.almacen,
            individualUnits: stockInfo.individualUnits,
            totalUnits: stockInfo.totalUnits,
            uom: stockInfo.uom,
            asignadoAentrega: stockInfo.asignadoAentrega
          });
        }
      });
      setLotes(lotesConDetalles);

    } catch (err) {
      toast({ title: "Error", description: "No se pudieron cargar los detalles.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLoteDetails();
    } else {
      setLotes([]);
    }
  }, [isOpen, trazabilidadesString]);

  const uniqueLotes = useMemo(() => {
    const lotesMap = new Map<string, any>();
    lotes.forEach(l => {
      if (!lotesMap.has(l.lote)) {
        lotesMap.set(l.lote, l);
      }
    });
    return Array.from(lotesMap.values());
  }, [lotes]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] w-full max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle de Trazabilidades</span>
            <Badge variant="outline" className="ml-2">
              Búsqueda por: Número de Lote
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {itemDescription || "Detalle de los lotes asociados a este ítem."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <LoadingSpinner title="Buscando lotes..." size="sm" />
          ) : uniqueLotes.length > 0 ? (
            <div className="space-y-4">
              {uniqueLotes.map((lote, index) => (
                <div key={lote.lote || index} className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                      Lote: {lote.lote}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">{lote.po}</Badge>
                      {lote.rfidId && (
                        <Badge variant="outline" className="border-purple-300 text-purple-700">RFID: {lote.rfidId}</Badge>
                      )}
                      {lote.asignadoAentrega && (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Disponible</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-blue-400">
                      <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Producto:</span> 
                      <span className="text-slate-800 dark:text-slate-200">{lote.nombreProducto}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-green-400">
                      <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Cantidad:</span> 
                      <span className="text-slate-800 dark:text-slate-200">{lote.cantidad?.toLocaleString()}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-orange-400">
                      <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Peso Bruto:</span> 
                      <span className="text-slate-800 dark:text-slate-200">{lote.pesoBruto}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-orange-400">
                      <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Peso Neto:</span> 
                      <span className="text-slate-800 dark:text-slate-200">{lote.pesoNeto}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-purple-400">
                      <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Cajas:</span> 
                      <span className="text-slate-800 dark:text-slate-200">{lote.cajas}</span>
                    </div>
                    {lote.itemNumber && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-indigo-400">
                        <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Item Number:</span> 
                        <span className="text-slate-800 dark:text-slate-200">{lote.itemNumber}</span>
                      </div>
                    )}
                    {lote.claveProducto && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-pink-400">
                        <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Clave Producto:</span> 
                        <span className="text-slate-800 dark:text-slate-200">{lote.claveProducto}</span>
                      </div>
                    )}
                    {lote.almacen && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-yellow-400">
                        <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Almacén:</span> 
                        <span className="text-slate-800 dark:text-slate-200">{lote.almacen}</span>
                      </div>
                    )}
                    {lote.uom && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-teal-400">
                        <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">UOM:</span> 
                        <span className="text-slate-800 dark:text-slate-200">{lote.uom}</span>
                      </div>
                    )}
                    {lote.ordenSAP && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-cyan-400">
                        <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Orden SAP:</span> 
                        <span className="text-slate-800 dark:text-slate-200">{lote.ordenSAP}</span>
                      </div>
                    )}
                    {lote.individualUnits && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-emerald-400">
                        <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Unidades Individuales:</span> 
                        <span className="text-slate-800 dark:text-slate-200">{lote.individualUnits?.toLocaleString()}</span>
                      </div>
                    )}
                    {lote.totalUnits && (
                      <div className="bg-white dark:bg-slate-700 p-2 rounded border-l-4 border-violet-400">
                        <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Total Unidades:</span> 
                        <span className="text-slate-800 dark:text-slate-200">{lote.totalUnits?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 dark:text-slate-400 py-12">
              <AlertCircle className="mx-auto h-16 w-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium">No hay trazabilidades disponibles</p>
              <p className="text-sm mt-2">
                Búsqueda por número de lote únicamente
              </p>
              <p className="text-xs mt-1 text-slate-400">
                Solo se muestran trazabilidades con status "asignadoAentrega: true"
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- MODAL INTELIGENTE PARA GESTIONAR TRAZABILIDADES (del primer componente) ---
const TraceabilityModal = ({ 
  isOpen, 
  onClose, 
  item,
  onUpdate,
  onItemDeleted
}: {
  isOpen: boolean;
  onClose: () => void;
  item: ShippingItem;
  onUpdate: (recalculatedItem: ShippingItem) => void;
  onItemDeleted?: (itemId: number) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [currentLotes, setCurrentLotes] = useState<string[]>([]);
  const [loteDetails, setLoteDetails] = useState<Map<string, TrazabilidadDetail>>(new Map());
  const [availableStock, setAvailableStock] = useState<StockItem[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://172.16.10.31/api/vwStockDestiny");
      if (!response.ok) throw new Error("No se pudo obtener el stock");
      const allStock: StockItem[] = await response.json();

      let lotesActuales: string[] = [];
      try {
        lotesActuales = JSON.parse(item.trazabilidades || "[]");
      } catch {
        lotesActuales = [];
      }
      setCurrentLotes(lotesActuales);

      const detailsMap = new Map<string, TrazabilidadDetail>();
      lotesActuales.forEach(loteNum => {
        const stockInfo = allStock.find(s => s.lote === loteNum);
        if (stockInfo) {
          detailsMap.set(loteNum, {
            lote: loteNum,
            pesoBruto: stockInfo.pesoBruto,
            pesoNeto: stockInfo.pesoNeto,
            cajas: stockInfo.cajas,
            cantidad: stockInfo.cantidad,
          });
        }
      });
      setLoteDetails(detailsMap);

      const stockParaEsteProducto = allStock.filter(stockItem => 
        stockItem.itemNumber === item.customerItemNumber &&
        stockItem.claveProducto === item.claveProducto &&
        !stockItem.asignadoAentrega &&
        !lotesActuales.includes(stockItem.lote)
      );
      setAvailableStock(stockParaEsteProducto);

    } catch (err) {
      toast({ title: "Error", description: "No se pudieron cargar los datos de trazabilidad.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, item]);

  const recalculateAndUpdate = (updatedLotes: string[], allDetails: Map<string, TrazabilidadDetail>) => {
    let totalPallets = updatedLotes.length;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalCases = 0;
    let totalQuantity = 0;

    updatedLotes.forEach(loteNum => {
      const detail = allDetails.get(loteNum);
      if (detail) {
        totalGrossWeight += detail.pesoBruto;
        totalNetWeight += detail.pesoNeto;
        totalCases += detail.cajas;
        totalQuantity += detail.cantidad;
      }
    });

    const recalculatedItem: ShippingItem = {
      ...item,
      trazabilidades: JSON.stringify(updatedLotes),
      pallets: totalPallets,
      grossWeight: totalGrossWeight,
      netWeight: totalNetWeight,
      casesPerPallet: totalPallets > 0 ? Math.round(totalCases / totalPallets) : 0,
      quantityAlreadyShipped: String(totalQuantity),
    };

    onUpdate(recalculatedItem);
    onClose();
  };

  const handleRemoveLote = async (loteToRemove: string) => {
    try {
      // ALERTA: Si solo queda una trazabilidad, advertir que se eliminará el item completo
      if (currentLotes.length === 1) {
        const confirmed = window.confirm(
          `⚠️ ADVERTENCIA: Esta es la única trazabilidad del item.\n\n` +
          `Si eliminas "${loteToRemove}", el item completo "${item.itemDescription}" será eliminado permanentemente del release.\n\n` +
          `¿Estás seguro de que quieres continuar?\n\n` +
          `Esta acción NO se puede deshacer.`
        );
        
        if (!confirmed) {
          console.log("❌ Usuario canceló la eliminación de la última trazabilidad");
          return;
        }
      }

      // Primero marcar el lote como disponible en la API
      const response = await fetch(
        'http://172.16.10.31/api/LabelDestiny/UpdateProdExtrasDestinyStatusByTrazabilidad?marcado=false',
        {
          method: 'PUT',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([loteToRemove])
        }
      );

      if (!response.ok) {
        throw new Error(`Error al liberar lote del inventario: ${response.status}`);
      }

      // Actualizar el estado local
      const updatedLotes = currentLotes.filter(l => l !== loteToRemove);
      
      // Si no quedan lotes, eliminar el item completo del servidor
      if (updatedLotes.length === 0) {
        try {
          console.log(`Eliminando item ${item.id} del servidor porque no le quedan trazabilidades...`);
          
          const deleteResponse = await fetch(`http://172.16.10.31/api/ReleaseDestiny/shipping-item/${item.id}`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (deleteResponse.ok) {
            console.log(`Item ${item.id} eliminado exitosamente del servidor`);
            
            toast({
              title: "Item eliminado",
              description: `El item "${item.itemDescription}" se eliminó porque no le quedaban trazabilidades asignadas.`,
              variant: "default",
            });
            
            // Notificar al componente padre para que actualice su lista
            if (onItemDeleted) {
              onItemDeleted(item.id);
            }
            
          } else {
            const errorMsg = await deleteResponse.text();
            console.error(`Error al eliminar item ${item.id}:`, errorMsg);
            throw new Error(`Error al eliminar item del servidor: ${deleteResponse.status}`);
          }
        } catch (deleteError) {
          console.error('Error al eliminar item del servidor:', deleteError);
          toast({
            title: "Error al eliminar item",
            description: "El lote se liberó pero no se pudo eliminar el item del servidor.",
            variant: "destructive",
          });
        }
        
        onClose();
        return;
      }

      // Recalcular y actualizar normalmente si aún quedan lotes
      recalculateAndUpdate(updatedLotes, loteDetails);
      
      toast({
        title: "Lote liberado",
        description: `El lote ${loteToRemove} está ahora disponible para otros releases.`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error al liberar lote:', error);
      toast({
        title: "Error",
        description: `No se pudo liberar el lote ${loteToRemove}`,
        variant: "destructive",
      });
    }
  };

  const handleAddLote = async (loteToAdd: StockItem) => {
    try {
      console.log("🔍 Estructura completa del lote a agregar:", loteToAdd);
      console.log("🔍 Campos RFID disponibles:");
      // Marcar el lote como asignado en la API usando el RFID ID correcto
    const rfidToUse = loteToAdd.prodEtiquetaRFIDId?.toString() || "";      
      if (!rfidToUse) {
        throw new Error("No se encontró RFID ID para este lote");
      }

      const response = await fetch(
        'http://172.16.10.31/api/LabelDestiny/UpdateProdExtrasDestinyStatus?marcado=true',
        {
          method: 'PUT',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([rfidToUse])
        }
      );

      if (!response.ok) {
        throw new Error(`Error al asignar lote: ${response.status}`);
      }

      // Actualizar el estado local
      const updatedLotes = [...currentLotes, loteToAdd.lote];
      const updatedDetails = new Map(loteDetails);
      updatedDetails.set(loteToAdd.lote, {
        lote: loteToAdd.lote,
        pesoBruto: loteToAdd.pesoBruto,
        pesoNeto: loteToAdd.pesoNeto,
        cajas: loteToAdd.cajas,
        cantidad: loteToAdd.cantidad,
      });
      
      recalculateAndUpdate(updatedLotes, updatedDetails);
      
      toast({
        title: "Lote agregado",
        description: `El lote ${loteToAdd.lote} se agregó al release.`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error al agregar lote:', error);
      toast({
        title: "Error",
        description: `No se pudo agregar el lote ${loteToAdd.lote}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Trazabilidades para: {item?.itemDescription}</DialogTitle>
          <DialogDescription>
            Elimina o agrega tarimas. Los totales se recalcularán automáticamente.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
            <div className="flex flex-col overflow-hidden border rounded-lg">
              <h3 className="p-3 font-semibold border-b bg-slate-50 dark:bg-slate-700">Actuales en el Release ({currentLotes.length})</h3>
              <div className="overflow-y-auto p-3 space-y-2">
                {currentLotes.length > 0 ? currentLotes.map(lote => (
                  <div key={lote} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="font-mono text-sm">{lote}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveLote(lote)}>
                      <Trash2 className="w-4 h-4 text-red-500"/>
                    </Button>
                  </div>
                )) : <p className="text-sm text-slate-500 text-center mt-4">No hay trazabilidades asignadas.</p>}
              </div>
            </div>
            <div className="flex flex-col overflow-hidden border rounded-lg">
              <h3 className="p-3 font-semibold border-b bg-slate-50 dark:bg-slate-700">Disponibles en Stock ({availableStock.length})</h3>
              <div className="overflow-y-auto p-3 space-y-2">
                {availableStock.length > 0 ? availableStock.map(stock => (
                  <div key={stock.lote} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="font-mono text-sm">{stock.lote}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddLote(stock)}>
                      <Plus className="w-4 h-4 text-green-500"/>
                    </Button>
                  </div>
                )) : <p className="text-sm text-slate-500 text-center mt-4">No hay stock disponible para este producto.</p>}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENTE PRINCIPAL CON DISEÑO DEL SEGUNDO Y FUNCIONALIDAD DEL PRIMERO ---
interface EditableShippingTableProps {
  items: ShippingItem[];
  onUpdateItem: (item: ShippingItem) => void;
  canDeleteTraceabilities?: boolean;
  releaseId?: number;
  onItemsAdded?: () => void;
  isReadOnly?: boolean;
  onItemDeleted?: (itemId: number) => void; // Nueva prop para manejar eliminación
}

interface EditingCell {
  itemId: number;
  field: keyof ShippingItem;
}

export default function EditableShippingTable({ 
  items, 
  onUpdateItem,
  isReadOnly = false,
  canDeleteTraceabilities = false,
  releaseId,
  onItemsAdded,
  onItemDeleted
}: EditableShippingTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isTraceabilityModalOpen, setIsTraceabilityModalOpen] = useState(false);
  const [currentItemForTraceability, setCurrentItemForTraceability] = useState<ShippingItem | null>(null);
  
  // Estados para el modal de detalles de trazabilidades
  const [showTraceabilityDetailsModal, setShowTraceabilityDetailsModal] = useState(false);
  const [selectedTrazabilidadesForDetails, setSelectedTrazabilidadesForDetails] = useState<string | null>(null);
  const [selectedItemDescriptionForDetails, setSelectedItemDescriptionForDetails] = useState<string>("");

  // Lista de campos editables (del segundo componente)
  const editableFields: Array<{
    key: keyof ShippingItem;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'modal';
    width: string;
    editable: boolean;
    icon?: any;
    category: 'info' | 'shipping' | 'weight' | 'tracking' | 'financial';
  }> = [
    // Información básica
    { key: 'company', label: 'Compañía', type: 'text', width: 'w-32', editable: false, category: 'info' },
    { key: 'poNumber', label: 'PO Number', type: 'text', width: 'w-28', editable: false, category: 'info' },
    { key: 'sap', label: 'SAP', type: 'text', width: 'w-24', editable: false, category: 'info' },
    { key: 'claveProducto', label: 'Clave Producto', type: 'text', width: 'w-32', editable: false, category: 'info' },
    { key: 'customerItemNumber', label: 'Item Number', type: 'text', width: 'w-32', editable: false, category: 'info' },
    { key: 'itemDescription', label: 'Descripción', type: 'text', width: 'w-48', editable: false, category: 'info' },
    
    // Campos de envío editables
    { key: 'quantityAlreadyShipped', label: 'Cantidad Enviada', type: 'text', width: 'w-32', editable: false, icon: Truck, category: 'shipping' },
    { key: 'pallets', label: 'Pallets', type: 'number', width: 'w-24', editable: false, icon: Package, category: 'shipping' }, // No editable porque se calcula automáticamente
    { key: 'casesPerPallet', label: 'Cajas/Pallet', type: 'number', width: 'w-28', editable: false, icon: Package, category: 'shipping' }, // No editable porque se calcula automáticamente
    { key: 'unitsPerCase', label: 'Unidades/Caja', type: 'number', width: 'w-32', editable: false, icon: Package, category: 'shipping' },
    
    // Pesos editables (aunque se calculan automáticamente, pueden ser override)
    { key: 'grossWeight', label: 'Peso Bruto', type: 'text', width: 'w-40', editable: false, category: 'weight' }, // No editable porque se calcula automáticamente
    { key: 'netWeight', label: 'Peso Neto', type: 'text', width: 'w-40', editable: false, category: 'weight' }, // No editable porque se calcula automáticamente
    
    // Clasificación editable
    { key: 'idReleaseCliente', label: 'ID Release Cliente', type: 'text', width: 'w-40', editable: true, category: 'tracking' },
    { key: 'itemType', label: 'Tipo Item', type: 'select', width: 'w-32', editable: true, category: 'tracking' },
    { key: 'salesCSRNames', label: 'Sales CSR', type: 'text', width: 'w-48', editable: true, category: 'tracking' },
    { key: 'trazabilidades', label: 'Trazabilidades', type: 'modal', width: 'w-64', editable: true, category: 'tracking' }, // Tipo 'modal' para usar el modal inteligente
    { key: 'destino', label: 'Destino', type: 'select', width: 'w-40', editable: true, icon: MapPin, category: 'tracking' },
    { key: 'modifiedBy', label: 'Modificado por', type: 'select', width: 'w-40', editable: true, icon: User, category: 'info' },
    
    // Información financiera (solo lectura)
    { key: 'quantityOnFloor', label: 'Cantidad en Piso', type: 'number', width: 'w-32', editable: false, category: 'financial' },
    { key: 'precioPorUnidad', label: 'Precio/Unidad', type: 'number', width: 'w-32', editable: false, category: 'financial' },
    { key: 'pesoPorPieza', label: 'Peso/Pieza', type: 'number', width: 'w-28', editable: false, category: 'financial' },
    { key: 'costoTotal', label: 'Costo Total', type: 'number', width: 'w-28', editable: false, category: 'financial' },
    { key: 'valorAduanal', label: 'Valor Aduanal', type: 'number', width: 'w-32', editable: false, category: 'financial' },
    
    // Metadatos
    { key: 'createdDate', label: 'Fecha Creación', type: 'date', width: 'w-40', editable: false, category: 'info' },
    { key: 'modifiedDate', label: 'Última Mod.', type: 'date', width: 'w-40', editable: false, category: 'info' },
  ];

  // Función para abrir el modal inteligente de trazabilidades (del primer componente)
  const handleOpenTraceabilityModal = (item: ShippingItem) => {
    if (isReadOnly) {
      toast({ title: "Release Completado", description: "No se pueden gestionar trazabilidades."});
      return;
    }
    setCurrentItemForTraceability(item);
    setIsTraceabilityModalOpen(true);
  };

  // Función para obtener color de categoría (del segundo componente)
  const getCategoryColor = (category: string) => {
    const colors = {
      info: 'bg-gray-50 dark:bg-gray-800',
      shipping: 'bg-blue-50 dark:bg-blue-900/20',
      weight: 'bg-orange-50 dark:bg-orange-900/20', 
      tracking: 'bg-green-50 dark:bg-green-900/20',
      financial: 'bg-purple-50 dark:bg-purple-900/20'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-50';
  };

  const handleCellClick = (itemId: number, field: keyof ShippingItem) => {
    if (isReadOnly) {
      toast({
        title: "Release Completado",
        description: "No se puede editar un release que ya ha sido completado.",
      });
      return;
    }

    const item = items.find(i => i.id === itemId);
    const fieldConfig = editableFields.find(f => f.key === field);
    
    if (item && fieldConfig?.editable) {
      if (fieldConfig.type === 'modal' && field === 'trazabilidades') {
        // Usar el modal inteligente para trazabilidades
        handleOpenTraceabilityModal(item);
      } else {
        // Edición normal para otros campos
        setEditingCell({ itemId, field });
        setEditValue(String(item[field] || ''));
      }
    }
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    const item = items.find(i => i.id === editingCell.itemId);
    if (!item) {
      setEditingCell(null);
      return;
    }

    const originalValue = String(item[editingCell.field] || '');

    if (editValue !== originalValue) {
      const field = editableFields.find(f => f.key === editingCell.field);
      if (!field) return;

      let newValue: any = editValue;
      if (field.type === 'number') {
        newValue = parseFloat(editValue) || 0;
      }

      const updatedItem = { ...item, [editingCell.field]: newValue };
      onUpdateItem(updatedItem);
    }

    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '';
    
    if (type === 'number' && typeof value === 'number') {
      return value.toLocaleString('es-MX', { 
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2 
      });
    }

    if (type === 'date' && typeof value === 'string') {
      const date = new Date(value);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }) + ' ' + date.toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit'
      });
    }
    
    return String(value);
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
        <Package className="mx-auto h-16 w-16 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">No hay items para mostrar</h3>
        <p className="text-sm text-slate-500 dark:text-slate-500">Los items aparecerán aquí cuando sean agregados</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Items de Envío</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {items.length} items • Click en los campos resaltados para editar
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {releaseId && onItemsAdded && (
              <Button
                onClick={() => {} /* Lógica para agregar items */}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Items
              </Button>
            )}
            
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-600 dark:text-slate-400">Editable</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                <span className="text-slate-600 dark:text-slate-400">Solo lectura</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla scrollable */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-16 border-r border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-1">
                  <Package className="h-3 w-3" />
                  <span>ID</span>
                </div>
              </th>
              {editableFields.map((field) => (
                <th 
                  key={field.key}
                  className={`px-4 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${field.width} border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${getCategoryColor(field.category)}`}
                >
                  <div className="flex items-center space-x-2">
                    {field.editable && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Campo editable"></div>
                    )}
                    {!field.editable && (
                      <div className="w-2 h-2 bg-slate-300 rounded-full" title="Solo lectura"></div>
                    )}
                    {field.icon && <field.icon className="h-3 w-3" />}
                    <span className="truncate">{field.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {items.map((item, index) => (
              <tr 
                key={item.id} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/30'
                }`}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                      {item.id}
                    </div>
                  </div>
                </td>
                {editableFields.map((field) => {
                  const isEditing = editingCell?.itemId === item.id && editingCell?.field === field.key;
                  
                  let content;
                  if (isEditing) {
                    if (field.type === 'select') {
                      const options = field.key === 'destino' ? destinoOptions : 
                                     field.key === 'itemType' ? itemTypeOptions :
                                     field.key === 'modifiedBy' ? modifiedByOptions : [];
                      content = (
                        <div className="flex items-center space-x-2">
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            autoFocus
                            className="w-full px-3 py-2 text-sm border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 dark:border-blue-500 shadow-sm"
                          >
                            <option value="">-- Selecciona --</option> 
                            {options.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          <div className="flex space-x-1">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Guardar"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Cancelar"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      content = (
                        <div className="flex items-center space-x-2">
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onBlur={handleSaveEdit}
                            autoFocus
                            className="w-full px-3 py-2 text-sm border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 dark:border-blue-500 shadow-sm"
                            step={field.type === 'number' ? '0.01' : undefined}
                            placeholder="Ingrese valor..."
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                              title="Guardar (Enter)"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Cancelar (Esc)"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  } else if (field.key === 'trazabilidades' && field.type === 'modal') {
                    // Celda especial para trazabilidades que abre el modal inteligente
                    let count = 0;
                    try { count = JSON.parse(item.trazabilidades || "[]").length; } catch {}
                    content = (
                      <div className="flex items-center justify-center space-x-2">
                        <Button 
                          onClick={() => handleOpenTraceabilityModal(item)} 
                          variant="outline" 
                          size="sm" 
                          disabled={isReadOnly}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700 shadow-sm"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Gestionar ({count})
                        </Button>
                        {/* Botón para ver detalles sin editar */}
                        {item.trazabilidades && (
                          <Button
                            onClick={() => {
                              setSelectedTrazabilidadesForDetails(item.trazabilidades);
                              setSelectedItemDescriptionForDetails(item.itemDescription);
                              setShowTraceabilityDetailsModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 bg-gradient-to-r from-green-500 to-teal-600 text-white border-0 hover:from-green-600 hover:to-teal-700 shadow-sm"
                            title="Ver detalles de trazabilidades"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        )}
                      </div>
                    );
                  } else {
                    // Celda normal editable o de solo lectura
                    const hasValue = item[field.key] !== null && item[field.key] !== undefined && item[field.key] !== '';
                    content = (
                      <div
                        onClick={() => handleCellClick(item.id, field.key)}
                        className={`px-3 py-2 rounded-lg transition-all duration-200 min-h-[36px] flex items-center group ${
                          field.editable 
                            ? 'cursor-pointer border-2 border-transparent hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm' 
                            : 'cursor-default'
                        }`}
                        title={field.editable ? 'Click para editar' : 'Campo de solo lectura'}
                      >
                        <div className="flex items-center space-x-2 w-full">
                          {field.editable && (
                            <Edit3 className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                          <span className={`flex-1 truncate ${
                            !hasValue 
                              ? 'text-slate-400 italic' 
                              : field.editable 
                                ? 'text-slate-900 dark:text-slate-100 font-medium' 
                                : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {hasValue ? formatValue(item[field.key], field.type) : 'Sin valor'}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <td 
                      key={field.key} 
                      className={`px-4 py-4 text-sm ${field.width} border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${getCategoryColor(field.category)}`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-t border-slate-200 dark:border-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Editables</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Click para modificar</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Edición</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Hover para preview</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <kbd className="px-2 py-1 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded text-xs font-mono">Enter</kbd>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded text-xs font-mono">Esc</kbd>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Controles</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gestión Auto</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Trazabilidades inteligentes</span>
          </div>
        </div>
        
        {/* Leyenda de categorías */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
          <div className="flex items-center space-x-6 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">Categorías:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/20 rounded"></div>
              <span className="text-slate-600 dark:text-slate-400">Envío</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-100 dark:bg-orange-900/20 rounded"></div>
              <span className="text-slate-600 dark:text-slate-400">Peso</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 dark:bg-green-900/20 rounded"></div>
              <span className="text-slate-600 dark:text-slate-400">Seguimiento</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-100 dark:bg-purple-900/20 rounded"></div>
              <span className="text-slate-600 dark:text-slate-400">Financiero</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
              <span className="text-slate-600 dark:text-slate-400">Información</span>
            </div>
          </div>
        </div>
      </div>
      {currentItemForTraceability && (
        <TraceabilityModal
          isOpen={isTraceabilityModalOpen}
          onClose={() => setIsTraceabilityModalOpen(false)}
          item={currentItemForTraceability}
          onUpdate={onUpdateItem}
          onItemDeleted={onItemDeleted}
        />
      )}
        
      
      
      {/* Modal de detalles de trazabilidades (solo lectura) */}
      <TraceabilityDetailsModal
        isOpen={showTraceabilityDetailsModal}
        onClose={() => {
          setShowTraceabilityDetailsModal(false);
          setSelectedTrazabilidadesForDetails(null);
          setSelectedItemDescriptionForDetails("");
        }}
        trazabilidadesString={selectedTrazabilidadesForDetails}
        itemDescription={selectedItemDescriptionForDetails}
      />
    </div>
  );
}