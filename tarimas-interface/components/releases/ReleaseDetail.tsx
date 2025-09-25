"use client"

import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Eye, Edit3, Plus, Save, X, Trash2, Loader2, CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EditableShippingTable from "./EditableShippingTable";
import PreviewModal from "./PreviewModal";
import ProductSelectionModal from "./ProductSelectionModal";

import { ShippingItem, ReleaseDetailData } from "@/types/release";

interface ReleaseDetailProps {
  releaseId: number;
  onBack: () => void;
}

export default function ReleaseDetail({ releaseId, onBack }: ReleaseDetailProps) {
  const [releaseData, setReleaseData] = useState<ReleaseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<ShippingItem[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Estados para modo de edición del release
  const [isEditingRelease, setIsEditingRelease] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [originalItems, setOriginalItems] = useState<ShippingItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingRelease, setSavingRelease] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  
  // NUEVO: Estado para controlar si se están agregando productos
  const [addingProducts, setAddingProducts] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); 


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
      console.log("🚀 Datos recibidos del GET:", data);
      setReleaseData(data);
      
      const allItems = data.shippingItems;
      setEditingItems([...allItems]);
      setOriginalItems([...allItems]);
      if (data.status && data.status.toLowerCase() === 'aprobado') {
        setIsCompleted(true);
      } else {
        setIsCompleted(false);
      }
      
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

  // Detectar cambios
  useEffect(() => {
    if (originalItems.length > 0) {
      const itemsChanged = JSON.stringify(editingItems) !== JSON.stringify(originalItems);
      setHasUnsavedChanges(itemsChanged);
    }
  }, [editingItems, originalItems]);

  // Función para actualizar items localmente (sin guardar automáticamente)
  const handleUpdateItem = (updatedItem: ShippingItem) => {
    setEditingItems(prev => 
      prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  // Guardar cambio individual de item automáticamente
 const handleUpdateItemWithSave = async (updatedItem: ShippingItem) => {
    console.log("🚀 handleUpdateItemWithSave llamado con:", updatedItem);
    
    setUpdatingItemId(updatedItem.id); // <-- 1. MOSTRAMOS EL MODAL

    // Guardamos el estado anterior en caso de que necesitemos revertir
    const previousItems = [...editingItems];
    
    // Actualización Optimista: Actualizamos la UI inmediatamente
    setEditingItems(prev => 
      prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );

    try {
      const payload = {
        id: updatedItem.id,
        quantityAlreadyShipped: updatedItem.quantityAlreadyShipped || "0",
        pallets: updatedItem.pallets || 0,
        casesPerPallet: updatedItem.casesPerPallet || 0,
        unitsPerCase: updatedItem.unitsPerCase || 0,
        grossWeight: updatedItem.grossWeight || 0,
        netWeight: updatedItem.netWeight || 0,
        itemType: updatedItem.itemType || "Finished Good",
        salesCSRNames: updatedItem.salesCSRNames || "Equipo Ventas",
        trazabilidades: updatedItem.trazabilidades || "",
        destino: updatedItem.destino || "",
        idReleaseCliente: updatedItem.idReleaseCliente || "",
        modifiedBy: updatedItem.modifiedBy || "Sistema Web"
      };

      console.log("📦 Payload a enviar:", payload);

      const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/shipping-item/update/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("✅ Actualización exitosa en el servidor");
        toast({
          title: "Campo actualizado",
          description: "El cambio se ha guardado exitosamente.",
        });
        setOriginalItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else {
        const errorMsg = await response.text();
        setEditingItems(previousItems); // Revertimos el cambio en la UI
        throw new Error(`Error ${response.status}: ${errorMsg}`);
      }
    } catch (err) {
      console.error("💥 Error completo:", err);
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "No se pudo guardar el cambio.",
        variant: "destructive",
      });
      setEditingItems(previousItems); // Revertimos el cambio en la UI
    } finally {
      setUpdatingItemId(null); // <-- 2. OCULTAMOS EL MODAL (siempre, en éxito o error)
    }
  };

  // Iniciar modo de edición del release
  const handleStartEditingRelease = () => {
    setIsEditingRelease(true);
    toast({
      title: "Modo de edición activado",
      description: "Ahora puedes agregar o eliminar productos del release.",
      variant: "default",
    });
  };

  const handleItemDeleted = (itemId: number) => {
  // Actualizar el estado local para remover el item eliminado
  setEditingItems(prev => prev.filter(item => item.id !== itemId));
  setOriginalItems(prev => prev.filter(item => item.id !== itemId));
  
  // Opcional: refrescar desde el servidor para asegurar sincronización
  // fetchReleaseDetail();
};

  // Cancelar edición del release
  const handleCancelEditingRelease = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "¿Estás seguro? Se perderán todos los cambios no guardados."
      );
      if (!confirmed) return;
    }
    
    setIsEditingRelease(false);
    setEditingItems([...originalItems]);
    setHasUnsavedChanges(false);
    toast({
      title: "Edición cancelada",
      description: "Se han restaurado los datos originales.",
      variant: "default",
    });
  };

  // Eliminar producto del release
  const handleRemoveProduct = async (itemId: number) => {
    const item = editingItems.find(i => i.id === itemId);
    const confirmed = window.confirm(
      `¿Eliminar "${item?.itemDescription}" del release?\n\nEsta acción eliminará permanentemente el item del servidor.`
    );
    
    if (confirmed) {
      try {
        console.log(`🗑️ Eliminando item ${itemId} del servidor...`);
        
        const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/shipping-item/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
          },
        });

        console.log(`📡 Response DELETE para item ${itemId}:`, response.status);

        if (response.ok) {
          setEditingItems(prev => prev.filter(item => item.id !== itemId));
          
          toast({
            title: "Producto eliminado",
            description: `"${item?.itemDescription}" ha sido eliminado del release exitosamente.`,
            variant: "default",
          });

          console.log(`✅ Item ${itemId} eliminado exitosamente del servidor`);
        } else {
          const errorMsg = await response.text();
          console.error(`❌ Error al eliminar item ${itemId}:`, errorMsg);
          
          toast({
            title: "Error al eliminar",
            description: `No se pudo eliminar el item. Error: ${response.status}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(`💥 Error al eliminar item ${itemId}:`, error);
        
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor para eliminar el item.",
          variant: "destructive",
        });
      }
    }
  };

  // MODIFICADO: Nueva función para agregar productos usando el endpoint POST (basada en el patrón del componente principal)
  // MODIFICADO: Nueva función para agregar productos con validación de duplicados
// REEMPLAZA tu función handleAddProducts en ReleaseDetail con esta versión mejorada
const handleAddProducts = async (newProducts: ShippingItem[]) => {
  try {
    setAddingProducts(true);
    
    console.log("🚀 Agregando productos al release:", newProducts);
    
    // VALIDACIÓN DE DUPLICADOS (mantener la validación existente)
    const duplicateValidationErrors: string[] = [];
    const existingItemNumbers = new Set(editingItems.map(item => item.customerItemNumber?.toLowerCase().trim()));
    const existingClaveProductos = new Set(editingItems.map(item => item.claveProducto?.toLowerCase().trim()));
    
    newProducts.forEach(product => {
      const itemNumber = product.customerItemNumber?.toLowerCase().trim();
      const claveProducto = product.claveProducto?.toLowerCase().trim();
      
      if (itemNumber && existingItemNumbers.has(itemNumber)) {
        duplicateValidationErrors.push(`Item Number "${product.customerItemNumber}" ya existe en el release`);
      }
      
      if (claveProducto && existingClaveProductos.has(claveProducto)) {
        duplicateValidationErrors.push(`Clave de Producto "${product.claveProducto}" ya existe en el release`);
      }
    });
    
    if (duplicateValidationErrors.length > 0) {
      const errorMessage = `No se pueden agregar productos duplicados:\n\n${duplicateValidationErrors.join('\n')}\n\nPor favor, revisa los productos seleccionados y elimina los duplicados.`;
      
      alert(errorMessage);
      
      toast({
        title: "Productos Duplicados Detectados",
        description: `${duplicateValidationErrors.length} producto(s) ya existen en el release.`,
        variant: "destructive",
      });
      
      setShowProductSelection(false);
      return;
    }
    
    let successCount = 0;
    let failCount = 0;

    // Procesar cada producto con la lógica mejorada de page.tsx
    for (const product of newProducts) {
      try {
        // APLICAR LA MISMA LÓGICA DE CONSOLIDACIÓN QUE EN PAGE.TSX
        const company = "BioFlex";
        const shipDate = new Date().toISOString();
        const quantityAlreadyShipped = "0";
        const itemType = "Finished Good";
        const salesCSRNames = "Equipo Ventas";
        const destino = "Local"; // Valor por defecto
        const idReleaseCliente = ""; // Valor por defecto
        
        // Usar los datos del producto pero con valores más completos
        const payload = {
          company: company,
          shipDate: shipDate,
          poNumber: product.poNumber || "",
          sap: product.sap || "", // IMPORTANTE: Asegurar que este campo venga del producto
          claveProducto: product.claveProducto || "",
          customerItemNumber: product.customerItemNumber || "",
          itemDescription: product.itemDescription || "",
          quantityAlreadyShipped: quantityAlreadyShipped,
          pallets: product.pallets || 0,
          casesPerPallet: product.casesPerPallet || 0,
          unitsPerCase: product.unitsPerCase || 0, // IMPORTANTE: Asegurar que este campo venga del producto
          grossWeight: product.grossWeight || 0,
          netWeight: product.netWeight || 0,
          itemType: itemType,
          salesCSRNames: salesCSRNames,
          trazabilidades: product.trazabilidades || "[]", // Mantener formato JSON
          destino: destino,
          idReleaseCliente: idReleaseCliente,
          modifiedBy: "Sistema Web"
        };

        // IMPRIMIR JSON EN CONSOLA PARA DEBUG (igual que en page.tsx)
        console.log(`📦 Enviando POST para producto: ${product.itemDescription}`);
        console.log(`🎯 URL: http://172.16.10.31/api/ReleaseDestiny/releases/${releaseId}/add-item`);
        console.log("📋 Payload que se envía:");
        console.log(JSON.stringify(payload, null, 2));

        const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/releases/${releaseId}/add-item`, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log(`📡 Response status para ${product.itemDescription}:`, response.status);

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Error al agregar producto: ${response.status}. ${errorMsg.substring(0, 200)}`);
        }

        // Intentar obtener la respuesta JSON
        try {
          const responseData = await response.json();
          console.log(`✅ Respuesta del servidor para ${product.itemDescription}:`, responseData);
        } catch {
          console.log(`✅ Producto agregado exitosamente (sin respuesta JSON): ${product.itemDescription}`);
        }

        successCount++;

        // Pequeña pausa entre requests para evitar saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`💥 Error al procesar ${product.itemDescription}:`, error);
        failCount++;
        
        console.error("Error details:", {
          producto: product.itemDescription,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    // Actualizar la UI con los resultados (igual que antes)
    if (successCount > 0) {
      await fetchReleaseDetail();
      
      toast({
        title: "Productos Agregados Exitosamente",
        description: `Se han agregado ${successCount} producto(s) al release${failCount > 0 ? `. ${failCount} fallaron.` : '.'}`,
        variant: failCount > 0 ? "destructive" : "default",
      });
      
      console.log(`✅ Proceso completado: ${successCount} éxitos, ${failCount} fallos`);
    } else {
      toast({
        title: "Error al Agregar Productos",
        description: "No se pudo agregar ningún producto al release.",
        variant: "destructive",
      });
    }

    setShowProductSelection(false);

  } catch (error) {
    console.error("💥 Error general al agregar productos:", error);
    toast({
      title: "Error de Conexión",
      description: error instanceof Error ? error.message : "Error desconocido al conectar con el servidor.",
      variant: "destructive",
    });
  } finally {
    setAddingProducts(false);
  }
};

// Guardar cambios del release (usando el nuevo endpoint PUT por item)
const handleSaveReleaseChanges = async () => {
  try {
    setSavingRelease(true);
    
    // Identificar cambios comparando con items originales
    const changedItems = editingItems.filter(currentItem => {
      const originalItem = originalItems.find(orig => orig.id === currentItem.id);
      return originalItem && JSON.stringify(currentItem) !== JSON.stringify(originalItem);
    });

    let successCount = 0;

    // Actualizar items modificados usando el endpoint PUT por item
    for (const item of changedItems) {
      try {
        const payload = {
          id: item.id,
          company: item.company || "BioFlex",
          tableName: item.tableName || "default_table",
          shipDate: item.shipDate || new Date().toISOString(),
          poNumber: item.poNumber || "",
          sap: item.sap || "",
          claveProducto: item.claveProducto || "",
          customerItemNumber: item.customerItemNumber || "",
          itemDescription: item.itemDescription || "",
          quantityAlreadyShipped: item.quantityAlreadyShipped || "0",
          pallets: item.pallets || 0,
          casesPerPallet: item.casesPerPallet || 0,
          unitsPerCase: item.unitsPerCase || 0,
          grossWeight: item.grossWeight || 0,
          netWeight: item.netWeight || 0,
          itemType: item.itemType || "Finished Good",
          salesCSRNames: item.salesCSRNames || "Equipo Ventas",
          trazabilidades: item.trazabilidades || "",
          destino: item.destino || "Local",
          idReleaseCliente: item.idReleaseCliente || "",
          modifiedBy: "Sistema Web"
        };

        const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/releases/UpdateItem/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          successCount++;
        } else {
          console.error(`Error updating item ${item.id}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error updating item ${item.id}:`, error);
      }
    }

    // Actualizar estados
    setOriginalItems([...editingItems]);
    setHasUnsavedChanges(false);
    setIsEditingRelease(false);
    
    // Refrescar datos
    await fetchReleaseDetail();
    
    toast({
      title: "Release actualizado",
      description: `${successCount} cambios guardados exitosamente.`,
      variant: "default",
    });
    
  } catch (err) {
    console.error("Error saving release changes:", err);
    toast({
      title: "Error al guardar release",
      description: err instanceof Error ? err.message : "Error desconocido",
      variant: "destructive",
    });
  } finally {
    setSavingRelease(false);
  }
};
  // La lógica de `handleSaveChanges` para cambios menores (edición de campos)
  // REEMPLAZA tu función handleMarkAsCompleted con esta:
  // Versión con debug para identificar el problema
const handleMarkAsCompleted = async () => {
  console.log("🚀 handleMarkAsCompleted iniciado");
  
  // 1. Validación de campos con reporte detallado
  const requiredFields = [
    { key: 'pallets', label: 'Pallets' },
    { key: 'grossWeight', label: 'Peso Bruto' },
    { key: 'netWeight', label: 'Peso Neto' },
    { key: 'destino', label: 'Destino' },
    { key: 'salesCSRNames', label: 'CSR Ventas' },
    { key: 'modifiedBy', label: 'Modificado Por' }
  ];
  
  const validationErrors: {
    itemId: number;
    itemDescription: string;
    customerItemNumber: string;
    missingFields: string[];
  }[] = [];
  
  editingItems.forEach((item, index) => {
    const missingFields: string[] = [];
    
    requiredFields.forEach(field => {
      const value = item[field.key as keyof ShippingItem];
      const isEmpty = value === null || value === undefined || String(value).trim() === '';
      
      if (isEmpty) {
        missingFields.push(field.label);
      }
    });
    
    if (missingFields.length > 0) {
      validationErrors.push({
        itemId: item.id,
        itemDescription: item.itemDescription || `Item ${index + 1}`,
        customerItemNumber: item.customerItemNumber || 'N/A',
        missingFields: missingFields
      });
    }
  });

  if (validationErrors.length > 0) {
    console.log("❌ Validación falló. Errores encontrados:", validationErrors);
    
    // Crear mensaje detallado
    let errorMessage = `Se encontraron ${validationErrors.length} item(s) con campos incompletos:\n\n`;
    
    validationErrors.forEach((error, index) => {
      errorMessage += `${index + 1}. ${error.itemDescription} (ID: ${error.itemId})\n`;
      errorMessage += `   Item Number: ${error.customerItemNumber}\n`;
      errorMessage += `   Campos faltantes: ${error.missingFields.join(', ')}\n\n`;
    });
    
    errorMessage += "Por favor, completa todos los campos requeridos antes de marcar como completado.";
    
    // Mostrar modal detallado
    alert(errorMessage);
    
    // También mostrar toast para consistencia
    toast({
      title: "Campos Incompletos",
      description: `${validationErrors.length} item(s) tienen campos requeridos vacíos. Revisa la lista detallada.`,
      variant: "destructive",
    });
    
    return; // Detener ejecución
  }

  console.log("✅ Validación exitosa, procediendo con confirmación...");

  // 2. Confirmación del usuario
  const confirmed = window.confirm(
    "¿Estás seguro de que quieres marcar este release como 'Aprobado'?\n\nUna vez marcado como aprobado:\n• No podrás editar los items\n• No podrás agregar o eliminar productos\n• El release quedará bloqueado permanentemente"
  );
  
  if (!confirmed) {
    console.log("❌ Usuario canceló la confirmación");
    return;
  }

  console.log("✅ Usuario confirmó, procediendo con API call...");
  setSavingRelease(true);

  try {
    console.log("📡 Enviando request al servidor...");
    
    const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/Release/${releaseId}/Aprobado`, {
      method: 'PUT',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: "Aprobado" })
    });

    console.log("📡 Response status:", response.status);

    if (response.ok) {
      console.log("✅ API call exitoso");
      toast({
        title: "¡Release Completado!",
        description: "El estado se ha actualizado y el release ha sido bloqueado para edición.",
        variant: "default",
      });
      
      // Actualizar estado en la UI
      setIsCompleted(true);
      if (releaseData) {
        setReleaseData({ ...releaseData, status: "Aprobado" });
      }
      console.log("✅ Estados actualizados en la UI");
    } else {
      const errorText = await response.text();
      console.error("❌ API error:", errorText);
      throw new Error(`Error ${response.status}: ${errorText || 'El servidor rechazó la solicitud.'}`);
    }
  } catch (err) {
    console.error("💥 Error completo:", err);
    toast({
      title: "Error al completar",
      description: err instanceof Error ? err.message : "No se pudo actualizar el estado.",
      variant: "destructive",
    });
  } finally {
    console.log("🏁 Finalizando, setSavingRelease(false)");
    setSavingRelease(false);
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
      {/* Header con botones */}
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
        
        {/* Botones condicionales según el modo */}
        <div className="flex items-center space-x-3">
         {!isEditingRelease ? (
  <>
    {/* Botón Vista Previa (siempre visible) */}
    <button
      onClick={() => setShowPreviewModal(true)}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
    >
      <Eye className="w-4 h-4" />
      <span>Vista Previa</span>
    </button>
    
    {/* --- INICIO DE LA LÓGICA --- */}
    {/* Estos dos botones solo aparecen si el release NO está completado */}
    {!isCompleted && (
      <>
        <button
          onClick={handleStartEditingRelease}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Editar Release</span>
        </button>
        
        <button
          onClick={handleMarkAsCompleted}
          disabled={savingRelease} // Se deshabilita mientras guarda
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Muestra un ícono u otro dependiendo del estado de carga */}
          {savingRelease ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>
            {savingRelease ? "Completando..." : "MARCAR COMO COMPLETADO"}
          </span>
        </button>
      </>
    )}
     {/* --- FIN DE LA LÓGICA --- */}
  </>
          ) : (
            <>
              {/* Modo de edición del release */}
              <button
                onClick={() => setShowProductSelection(true)}
                disabled={addingProducts}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>{addingProducts ? "Agregando..." : "Agregar Productos"}</span>
              </button>
              
              <button
                onClick={handleSaveReleaseChanges}
                disabled={savingRelease || !hasUnsavedChanges}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{savingRelease ? "Guardando..." : "Guardar Release"}</span>
              </button>
              
              <button
                onClick={handleCancelEditingRelease}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Banner de modo de edición */}
      {isEditingRelease && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Modo de Edición del Release
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Puedes agregar o eliminar productos. {hasUnsavedChanges && "Tienes cambios sin guardar."}
                </p>
              </div>
            </div>
            {hasUnsavedChanges && (
              <div className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-sm font-medium">
                Cambios pendientes
              </div>
            )}
          </div>
        </div>
      )}

      {/* NUEVO: Banner de estado de agregando productos */}
      {addingProducts && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Agregando productos al release...
            </span>
          </div>
        </div>
      )}

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
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(releaseData.status)}`}>
              {releaseData.status}
            </span>
            <button
              onClick={() => setShowPreviewModal(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title="Vista previa del release"
            >
              <Eye className="w-5 h-5 text-slate-500 hover:text-primary" />
            </button>
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Estadísticas</h3>
            <div className="space-y-1 text-sm">
              <div>Items totales: <span className="font-medium">{editingItems.length}</span></div>
              {isEditingRelease && hasUnsavedChanges && (
                <div className="text-orange-600 dark:text-orange-400">
                  Items originales: <span className="font-medium">{originalItems.length}</span>
                </div>
              )}
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Items de Envío
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                {isEditingRelease 
                  ? "En modo de edición: puedes eliminar productos y agregar nuevos"
                  : "Edita los detalles de los items en este release"
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isEditingRelease && (
                <button
                  onClick={() => setShowProductSelection(true)}
                  disabled={addingProducts}
                  className="flex items-center space-x-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingProducts ? "Agregando..." : "Agregar"}</span>
                </button>
              )}
              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-md transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Resumen</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabla con funcionalidad de eliminar */}
        <div className="overflow-x-auto">
          {isEditingRelease ? (
            // Vista de edición con botones de eliminar
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">
                    Acciones
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Item Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pallets
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Peso Bruto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Trazabilidades
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {editingItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemoveProduct(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{item.customerItemNumber}</td>
                    <td className="px-4 py-3 text-sm">{item.itemDescription}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.pallets}</td>
                    <td className="px-4 py-3 text-center text-sm">{item.grossWeight} kg</td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {item.trazabilidades || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
                {editingItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No hay items en este release. Usa "Agregar Productos" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            // Vista normal con tabla completa editable
           <EditableShippingTable
  items={editingItems}
  onUpdateItem={handleUpdateItemWithSave}
  isReadOnly={isCompleted}
  onItemDeleted={handleItemDeleted} // <-- Nueva prop
/>
          )}
        </div>
      </div>

      {/* Modal de Vista Previa */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        releaseId={releaseId}
        releaseName={releaseData.fileName}
      />

      {/* Modal de Selección de Productos */}
      <ProductSelectionModal
        isOpen={showProductSelection}
        onClose={() => setShowProductSelection(false)}
        onAddProducts={handleAddProducts}
        currentItems={editingItems}
        isLoading={addingProducts}
      />
      {updatingItemId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-lg font-medium text-slate-700 dark:text-slate-200">
              Actualizando...
            </span>
          </div>
        </div>
      )}
        </div>
    
  );
}