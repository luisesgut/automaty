// src/components/releases/EditableShippingTable.tsx
"use client";

import { useState, useMemo } from "react";
import { useEffect } from "react";
import { ShippingItem } from "@/types/release";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle, Edit3, Eye, Check, X, Package, Truck, MapPin, Plus } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/use-toast";

// Opciones predefinidas para el campo "destino"
const destinoOptions = ["Local", "Nacional", "Internacional", "Almacén"];

// Opciones predefinidas para el campo "itemType"
const itemTypeOptions = ["Finished Good", "Raw Material", "Semi-Finished", "Industrial"];

// Tipo de datos para el detalle del lote (EXTENDIDO)
interface LoteDetail {
  lote: string;
  nombreProducto: string;
  cantidad: number;
  pesoBruto: number;
  pesoNeto: number;
  cajas: number;
  po: string;
  rfidId?: string;
  claveProducto?: string;
  itemNumber?: string;
  ordenSAP?: string;
  unidad?: string;
  almacen?: string;
  individualUnits?: number;
  totalUnits?: number;
  uom?: string;
  asignadoAentrega?: boolean;
}

// Tipo para definir el modo de búsqueda
type SearchMode = 'rfid' | 'lote' | 'auto';

// COMPONENTE: Modal mejorado para mostrar las trazabilidades
const TraceabilityModal = ({ 
  isOpen, 
  onClose, 
  trazabilidadesString, 
  itemDescription,
  onDeleteTraceability,
  canDelete = false 
}: {
  isOpen: boolean;
  onClose: () => void;
  trazabilidadesString: string | null;
  itemDescription: string;
  onDeleteTraceability?: (rfidOrLote: string) => Promise<void>;
  canDelete?: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const [lotes, setLotes] = useState<LoteDetail[]>([]);
  // SIMPLIFICADO: Solo usamos modo 'lote' ya que eso es lo que guardamos en el release
  const [currentSearchMode] = useState<'lote'>('lote');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Removido: Ya no necesitamos detectar el modo automáticamente
  // useEffect(() => { ... }, [trazabilidadesString]);

  // Función para buscar por RFID (método original)
  const fetchLotesByRFID = async (rfidIds: string[]) => {
    const urlBase = "http://172.16.10.31/api/vwStockDestiny";
    const lotesEncontrados: LoteDetail[] = [];

    for (const id of rfidIds) {
      try {
        const response = await fetch(`${urlBase}?rfidId=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const lote = data[0];
            lotesEncontrados.push({
              lote: lote.lote,
              nombreProducto: lote.nombreProducto,
              cantidad: lote.cantidad,
              pesoBruto: lote.pesoBruto,
              pesoNeto: lote.pesoNeto,
              cajas: lote.cajas,
              po: lote.po,
              rfidId: id,
              claveProducto: lote.claveProducto,
              itemNumber: lote.itemNumber,
              ordenSAP: lote.ordenSAP,
              unidad: lote.unidad,
              almacen: lote.almacen,
              individualUnits: lote.individualUnits,
              totalUnits: lote.totalUnits,
              uom: lote.uom,
              asignadoAentrega: lote.asignadoAentrega
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching lote for RFID ${id}:`, error);
      }
    }
    
    return lotesEncontrados;
  };

  // Función para buscar por lote (nuevo método)
  const fetchLotesByLoteNumber = async (loteNumbers: string[]) => {
    const urlBase = "http://172.16.10.31/api/vwStockDestiny";
    const lotesEncontrados: LoteDetail[] = [];

    try {
      console.log(`🔍 Buscando por números de lote:`, loteNumbers);
      const response = await fetch(urlBase);
      if (response.ok) {
        const allData = await response.json();
        
        // Filtrar por los números de lote buscados
        for (const loteNumber of loteNumbers) {
          console.log(`🔎 Buscando lote específico: ${loteNumber}`);
          
          const registrosDelLote = allData.filter((item: any) => {
            const matches = item.lote === loteNumber || item.lote === loteNumber.trim();
            if (matches) {
              console.log(`✅ Encontrado match para ${loteNumber}:`, item.lote);
            }
            return matches;
          });
          
          console.log(`📊 Registros encontrados para ${loteNumber}:`, registrosDelLote.length);
          
          for (const registro of registrosDelLote) {
            lotesEncontrados.push({
              lote: registro.lote,
              nombreProducto: registro.nombreProducto,
              cantidad: registro.cantidad,
              pesoBruto: registro.pesoBruto,
              pesoNeto: registro.pesoNeto,
              cajas: registro.cajas,
              po: registro.po,
              rfidId: registro.prodEtiquetaRFIDId?.toString(),
              claveProducto: registro.claveProducto,
              itemNumber: registro.itemNumber,
              ordenSAP: registro.ordenSAP,
              unidad: registro.unidad,
              almacen: registro.almacen,
              individualUnits: registro.individualUnits,
              totalUnits: registro.totalUnits,
              uom: registro.uom,
              asignadoAentrega: registro.asignadoAentrega
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching lotes by lote numbers:`, error);
    }
    
    console.log(`📦 Total lotes encontrados por número:`, lotesEncontrados.length);
    return lotesEncontrados;
  };

  // Función principal para buscar los lotes - SIMPLIFICADA
  const fetchLotes = async () => {
    if (!trazabilidadesString) {
      console.log("⚠️ No hay trazabilidades para buscar");
      setLoading(false);
      return;
    }

    setLoading(true);
    let valores: string[] = [];

    try {
      valores = JSON.parse(trazabilidadesString);
    } catch (error) {
      console.error("Error al parsear trazabilidades:", error);
      setLoading(false);
      return;
    }

    console.log(`🔍 Buscando trazabilidades por NÚMERO DE LOTE:`, valores);
    console.log(`📝 String original:`, trazabilidadesString);

    // SIEMPRE buscar por número de lote
    const lotesEncontrados = await fetchLotesByLoteNumber(valores);

    // FILTRO CRÍTICO: Solo mantener lotes que están asignados a entrega (disponibles)
    const lotesDisponibles = lotesEncontrados.filter(lote => lote.asignadoAentrega === true);

    console.log(`📊 Lotes encontrados (total):`, lotesEncontrados.length);
    console.log(`✅ Lotes disponibles (asignadoAentrega: true):`, lotesDisponibles.length);
    console.log(`❌ Lotes filtrados (asignadoAentrega: false):`, lotesEncontrados.length - lotesDisponibles.length);

    setLotes(lotesDisponibles);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      // RESETEAR todos los estados cuando se abre el modal
      setLotes([]);
      setDeleteLoading(null);
      fetchLotes();
    } else {
      // LIMPIAR estados cuando se cierra el modal
      setLotes([]);
      setDeleteLoading(null);
    }
  }, [isOpen, trazabilidadesString]);

  // Manejar eliminación de trazabilidad del inventario
  const handleDeleteFromInventory = async (loteDetail: LoteDetail) => {
    // Siempre usar el número de lote para eliminar
    const identificador = loteDetail.lote;
    
    setDeleteLoading(identificador);
    
    try {
      // Llamar al endpoint para marcar como no asignado (eliminado del inventario)
      const response = await fetch(
        'http://172.16.10.31/api/LabelDestiny/UpdateProdExtrasDestinyStatusByTrazabilidad?marcado=false',
        {
          method: 'PUT',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([identificador])
        }
      );

      if (!response.ok) {
        throw new Error(`Error al eliminar del inventario: ${response.status}`);
      }

      // Actualizar la lista local removiendo el item
      setLotes(prev => prev.filter(l => l.lote !== identificador));
      
      toast({
        title: "Eliminado del inventario",
        description: `Se eliminó el lote ${identificador} del inventario disponible`,
        variant: "default",
      });

      // Si es una eliminación desde el modal de trazabilidades del item, 
      // también actualizar las trazabilidades del item
      if (onDeleteTraceability) {
        await onDeleteTraceability(identificador);
      }

    } catch (error) {
      console.error('Error al eliminar del inventario:', error);
      toast({
        title: "Error al eliminar",
        description: `No se pudo eliminar el lote ${identificador} del inventario`,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  // Deduplicar lotes basado en número de lote únicamente
  const uniqueLotes = useMemo(() => {
    const lotesMap = new Map<string, LoteDetail>();
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
                      {/* Botón para eliminar del inventario */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFromInventory(lote)}
                        disabled={deleteLoading === lote.lote}
                        className="h-7 w-7 p-0"
                        title="Eliminar del inventario disponible"
                      >
                        {deleteLoading === lote.lote ? (
                          <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                      {/* Botón para eliminar solo de este release (si está habilitado) */}
                      {canDelete && onDeleteTraceability && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteTraceability(lote.lote)}
                          className="h-7 px-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                          title="Remover solo de este release"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Release
                        </Button>
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
                        <span className="font-medium text-slate-600 dark:text-slate-400 block text-xs">Clave:</span> 
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

interface EditableShippingTableProps {
  items: ShippingItem[];
  onUpdateItem: (item: ShippingItem) => void;
  // NUEVA PROP: Para habilitar eliminación de trazabilidades
  canDeleteTraceabilities?: boolean;
  // NUEVA PROP: Para habilitar agregar items
  releaseId?: number;
  onItemsAdded?: () => void; // Callback para refrescar después de agregar items
}

interface EditingCell {
  itemId: number;
  field: keyof ShippingItem;
}

export default function EditableShippingTable({ 
  items, 
  onUpdateItem,
  canDeleteTraceabilities = false,
  releaseId,
  onItemsAdded
}: EditableShippingTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showTraceabilityModal, setShowTraceabilityModal] = useState(false);
  const [selectedTrazabilidades, setSelectedTrazabilidades] = useState<string | null>(null);
  const [selectedItemDescription, setSelectedItemDescription] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // ACTUALIZADO: Solo campos que acepta el endpoint PUT como editables
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
    { key: 'quantityAlreadyShipped', label: 'Cantidad Enviada', type: 'text', width: 'w-32', editable: true, icon: Truck, category: 'shipping' },
    { key: 'pallets', label: 'Pallets', type: 'number', width: 'w-24', editable: true, icon: Package, category: 'shipping' },
    { key: 'casesPerPallet', label: 'Cajas/Pallet', type: 'number', width: 'w-28', editable: true, icon: Package, category: 'shipping' },
    { key: 'unitsPerCase', label: 'Unidades/Caja', type: 'number', width: 'w-32', editable: true, icon: Package, category: 'shipping' },
    
    // Pesos editables
    { key: 'grossWeight', label: 'Peso Bruto', type: 'number', width: 'w-28', editable: true, category: 'weight' },
    { key: 'netWeight', label: 'Peso Neto', type: 'number', width: 'w-28', editable: true, category: 'weight' },
    
    // Clasificación editable
    { key: 'itemType', label: 'Tipo Item', type: 'select', width: 'w-32', editable: true, category: 'tracking' },
    { key: 'salesCSRNames', label: 'Vendedor', type: 'text', width: 'w-32', editable: true, category: 'tracking' },
    { key: 'trazabilidades', label: 'Trazabilidades', type: 'text', width: 'w-64', editable: true, category: 'tracking' },
    { key: 'destino', label: 'Destino', type: 'select', width: 'w-28', editable: true, icon: MapPin, category: 'tracking' },
    
    // Información financiera (solo lectura)
    { key: 'quantityOnFloor', label: 'Cantidad en Piso', type: 'number', width: 'w-32', editable: false, category: 'financial' },
    { key: 'precioPorUnidad', label: 'Precio/Unidad', type: 'number', width: 'w-32', editable: false, category: 'financial' },
    { key: 'pesoPorPieza', label: 'Peso/Pieza', type: 'number', width: 'w-28', editable: false, category: 'financial' },
    { key: 'costoTotal', label: 'Costo Total', type: 'number', width: 'w-28', editable: false, category: 'financial' },
    { key: 'valorAduanal', label: 'Valor Aduanal', type: 'number', width: 'w-32', editable: false, category: 'financial' },
    
    // Metadatos
    { key: 'createdDate', label: 'Fecha Creación', type: 'date', width: 'w-40', editable: false, category: 'info' },
    { key: 'modifiedDate', label: 'Última Mod.', type: 'date', width: 'w-40', editable: false, category: 'info' },
    { key: 'modifiedBy', label: 'Modificado por', type: 'text', width: 'w-32', editable: false, category: 'info' },
  ];

  // Función para obtener color de categoría
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

  // Función para manejar el clic en la celda de trazabilidad
  const handleTraceabilityClick = (trazabilidades: string, itemDescription: string, itemId: number) => {
    // LIMPIAR estados anteriores antes de abrir el modal
    setSelectedTrazabilidades(null);
    setSelectedItemDescription("");
    setSelectedItemId(null);
    
    // Pequeño delay para asegurar que el estado se limpie
    setTimeout(() => {
      setSelectedTrazabilidades(trazabilidades);
      setSelectedItemDescription(itemDescription);
      setSelectedItemId(itemId);
      setShowTraceabilityModal(true);
    }, 10);
  };

  // NUEVA FUNCIÓN: Para eliminar una trazabilidad específica del inventario
  const handleDeleteTraceabilityFromInventory = async (trazabilidadToDelete: string) => {
    try {
      // Llamar al endpoint para marcar como no asignado (eliminado del inventario)
      const response = await fetch(
        'http://172.16.10.31/api/LabelDestiny/UpdateProdExtrasDestinyStatusByTrazabilidad?marcado=false',
        {
          method: 'PUT',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([trazabilidadToDelete])
        }
      );

      if (!response.ok) {
        throw new Error(`Error al eliminar del inventario: ${response.status}`);
      }

      // También eliminarlo del release actual
      await handleDeleteTraceability(trazabilidadToDelete);

      toast({
        title: "Eliminado del inventario",
        description: `Se eliminó ${trazabilidadToDelete} del inventario y del release`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error al eliminar del inventario:', error);
      toast({
        title: "Error al eliminar",
        description: `No se pudo eliminar ${trazabilidadToDelete} del inventario`,
        variant: "destructive",
      });
      throw error;
    }
  };

  // NUEVA FUNCIÓN: Para eliminar una trazabilidad específica
  const handleDeleteTraceability = async (trazabilidadToDelete: string) => {
    if (!selectedItemId) return;

    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    try {
      // Dividir las trazabilidades actuales
      const currentTraceabilities = item.trazabilidades
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

      // Filtrar la trazabilidad a eliminar
      const updatedTraceabilities = currentTraceabilities.filter(t => t !== trazabilidadToDelete);

      // Crear la nueva cadena
      const newTrazabilidadesString = updatedTraceabilities.join(', ');

      // Actualizar el item
      const updatedItem = {
        ...item,
        trazabilidades: newTrazabilidadesString
      };

      // Llamar a la función de actualización
      onUpdateItem(updatedItem);

      // Actualizar el estado local del modal
      setSelectedTrazabilidades(newTrazabilidadesString);

    } catch (error) {
      console.error('Error al eliminar trazabilidad:', error);
      throw error; // El modal manejará el error
    }
  };

  const handleCellClick = (itemId: number, field: keyof ShippingItem) => {
    const item = items.find(i => i.id === itemId);
    const fieldConfig = editableFields.find(f => f.key === field);
    
    // Solo campos editables pueden ser editados
    if (item && fieldConfig?.editable) {
        setEditingCell({ itemId, field });
        setEditValue(String(item[field] || ''));
    }
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    const item = items.find(i => i.id === editingCell.itemId);
    if (!item) return;

    const field = editableFields.find(f => f.key === editingCell.field);
    if (!field) return;

    let newValue: any = editValue;
    
    if (field.type === 'number') {
      newValue = parseFloat(editValue) || 0;
    }

    const updatedItem = {
      ...item,
      [editingCell.field]: newValue
    };

    console.log("🔄 handleSaveEdit - Campo editado:", editingCell.field);
    console.log("🔄 handleSaveEdit - Valor anterior:", item[editingCell.field]);
    console.log("🔄 handleSaveEdit - Valor nuevo:", newValue);
    console.log("🔄 handleSaveEdit - Item actualizado:", updatedItem);

    onUpdateItem(updatedItem);
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
      {/* Header de la tabla */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Items de Envío</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {items.length} items • Click en los campos resaltados para editar
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Botón para agregar items (si está disponible) */}
            {releaseId && onItemsAdded && (
              <Button
                onClick={() => setShowAddItemModal(true)}
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
                  
                  // Lógica de renderizado para cada tipo de campo
                  let content;
                  if (isEditing) {
                    // Renderizado de campos editables
                    if (field.type === 'select') {
                      const options = field.key === 'destino' ? destinoOptions : 
                                     field.key === 'itemType' ? itemTypeOptions : [];
                      content = (
                        <div className="flex items-center space-x-2">
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            autoFocus
                            className="w-full px-3 py-2 text-sm border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 dark:border-blue-500 shadow-sm"
                          >
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
                  } else if (field.key === 'trazabilidades' && field.editable) {
                    // Campo de trazabilidades editable con botón para ver detalles
                    content = (
                      <div className="flex items-center space-x-2">
                        <div
                          onClick={() => handleCellClick(item.id, field.key)}
                          className="flex-1 px-3 py-2 rounded-lg transition-all duration-200 min-h-[36px] flex items-center cursor-pointer group border-2 border-transparent hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-sm"
                          title="Click para editar trazabilidades"
                        >
                          <div className="flex items-center space-x-2 w-full">
                            <Edit3 className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className={`flex-1 truncate ${!item[field.key] ? 'text-slate-400 italic' : 'text-slate-900 dark:text-slate-100 font-medium'}`}>
                              {item[field.key] ? String(item[field.key]) : 'Sin trazabilidades'}
                            </span>
                          </div>
                        </div>
                        {item.trazabilidades && (
                          <Button
                            onClick={() => handleTraceabilityClick(item.trazabilidades, item.itemDescription, item.id)}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700 shadow-sm"
                            title="Ver detalles de trazabilidades"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        )}
                      </div>
                    );
                  } else {
                    // Renderizado de campos normales
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
      
      {/* Footer con instrucciones mejoradas */}
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
          
          {canDeleteTraceabilities && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Del Inventario</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Elimina completamente</span>
            </div>
          )}
          
          {canDeleteTraceabilities && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <X className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Del Release</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Solo remueve aquí</span>
            </div>
          )}
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
      
      {/* Modal de trazabilidades mejorado */}
      <TraceabilityModal 
        isOpen={showTraceabilityModal}
        onClose={() => {
          setShowTraceabilityModal(false);
          // LIMPIAR todos los estados cuando se cierra el modal
          setTimeout(() => {
            setSelectedTrazabilidades(null);
            setSelectedItemDescription("");
            setSelectedItemId(null);
          }, 100);
        }}
        trazabilidadesString={selectedTrazabilidades}
        itemDescription={selectedItemDescription}
        onDeleteTraceability={canDeleteTraceabilities ? handleDeleteTraceability : undefined}
        canDelete={canDeleteTraceabilities}
      />
    </div>
  )}