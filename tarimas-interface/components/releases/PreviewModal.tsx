"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Calendar, Download, Image as ImageIcon, X, FileSpreadsheet, Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import html2canvas from "html2canvas";

// --- Interfaz actualizada SIN palletsAvailable ---
interface PreviewItem {
  id: number;
  company: string;
  nextTruckAvailable: string; // Editable
  poNumber: string;
  customerItemNumber: string;
  itemDescription: string;
  quantityAlreadyShipped: string;
  quantityOnFloor: number;
  itemType: string;
  salesCSRNames: string; // Editable
  shipDate: string;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: number;
  releaseName: string;
}

export default function PreviewModal({ isOpen, onClose, releaseId, releaseName }: PreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [shipDate, setShipDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchPreviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/releases/${releaseId}`);
      if (!response.ok) throw new Error(`Error al cargar datos: ${response.status}`);
      
      const data = await response.json();
      
      // Mapeo actualizado SIN palletsAvailable
      const previewItems: PreviewItem[] = data.shippingItems.map((item: any) => ({
        id: item.id,
        company: item.company || 'BioFlex',
        // Se autocompleta con la fecha, pero es editable
        nextTruckAvailable: new Date(item.shipDate || shipDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        poNumber: item.poNumber || '',
        customerItemNumber: item.customerItemNumber || '',
        itemDescription: item.itemDescription || '',
        quantityAlreadyShipped: item.quantityAlreadyShipped || '0',
        quantityOnFloor: item.quantityOnFloor || 0,
        itemType: item.itemType || 'Finished Good',
        salesCSRNames: item.salesCSRNames || '',
        shipDate: item.shipDate ? item.shipDate.split('T')[0] : shipDate,
      }));
      
      setItems(previewItems);
      
    } catch (err) {
      console.error("Error fetching preview data:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast({ title: "Error al cargar vista previa", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreviewData();
    }
  }, [isOpen, releaseId]);

  // Función para manejar la edición en la tabla
  const handleCellChange = (itemId: number, field: keyof PreviewItem, value: string) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const downloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/releases/${releaseId}/export-excel`);
      if (!response.ok) throw new Error(`Error al descargar Excel: ${response.status}`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = `${releaseName}_export.xlsx`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "¡Excel descargado!", description: `El archivo ${fileName} se ha descargado exitosamente.` });
    } catch (err) {
      console.error("Error downloading Excel:", err);
      toast({ title: "Error al descargar Excel", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    } finally {
      setDownloadingExcel(false);
    }
  };

  const downloadAsImage = async () => {
    if (!tableRef.current) return;
    
    setDownloadingImage(true);
    
    try {
      // Obtener el elemento de la tabla
      const tableElement = tableRef.current.querySelector('table') as HTMLElement;
      if (!tableElement) {
        throw new Error('No se encontró la tabla');
      }

      // Calcular el ancho total necesario
      const tableWidth = tableElement.scrollWidth;
      const tableHeight = tableElement.scrollHeight;

      // Crear un contenedor temporal para la captura
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = `${tableWidth}px`;
      tempContainer.style.height = `${tableHeight}px`;
      tempContainer.style.overflow = 'visible';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '16px';

      // Clonar el contenido completo
      const clonedContent = tableRef.current.cloneNode(true) as HTMLElement;
      
      // Remover restricciones de overflow en el clon
      const clonedTable = clonedContent.querySelector('.overflow-x-auto') as HTMLElement;
      if (clonedTable) {
        clonedTable.style.overflow = 'visible';
        clonedTable.style.width = 'auto';
      }

      tempContainer.appendChild(clonedContent);
      document.body.appendChild(tempContainer);

      // Usar html2canvas en el contenedor temporal
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 1.5, // Reducir escala para mejor rendimiento
        logging: false,
        useCORS: true,
        width: tableWidth + 32, // +32 por el padding
        height: tableHeight + 32,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tableWidth + 32,
        windowHeight: tableHeight + 32,
        onclone: (clonedDoc) => {
          // Asegurar que todos los estilos se apliquen correctamente
          const clonedElements = clonedDoc.querySelectorAll('*');
          clonedElements.forEach((el) => {
            const element = el as HTMLElement;
            element.style.overflow = 'visible';
          });
        }
      });

      // Limpiar el elemento temporal
      document.body.removeChild(tempContainer);

      // Descargar la imagen
      const link = document.createElement('a');
      link.download = `${releaseName}_preview.png`;
      link.href = canvas.toDataURL('image/png', 0.9);
      link.click();

      toast({ 
        title: "¡Descargado!", 
        description: "La imagen se ha descargado exitosamente." 
      });

    } catch (err) {
      console.error('Error al descargar imagen:', err);
      toast({ 
        title: "Error al descargar", 
        description: "No se pudo generar la imagen.", 
        variant: "destructive" 
      });
    } finally {
      setDownloadingImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl">Vista Previa - {releaseName}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Las celdas amarillas son editables para la captura de imagen.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadExcel} 
                disabled={loading || items.length === 0 || downloadingExcel}
              >
                {downloadingExcel ? 
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : 
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                }
                Descargar Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadAsImage} 
                disabled={loading || items.length === 0 || downloadingImage}
              >
                {downloadingImage ? 
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : 
                  <ImageIcon className="w-4 h-4 mr-1" />
                }
                Descargar Imagen
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-gray-50">
          {loading ? (
            <LoadingSpinner title="Cargando vista previa..." size="md" className="h-full" />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p>No hay datos</p>
            </div>
          ) : (
            <div ref={tableRef} className="bg-white p-4">
              <div className="mb-2">
                <h2 className="text-lg font-bold text-gray-800 bg-orange-200 inline-block px-4 py-1">
                  LOAD {releaseId}
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400 text-sm min-w-max">
                  <thead className="bg-gray-200">
                    <tr className="text-gray-700 text-xs">
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">COMPANY</th>
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">NEXT TRUCK AVAILABLE</th>
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">PO</th>
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">ITEM#</th>
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">ITEM DESCRIPTION</th>
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">QUANTITY ALREADY SHIPPED</th>
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">QUANTITY ON FLOOR</th>
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">ITEM TYPE</th>
                      <th className="border border-gray-400 p-2 font-semibold whitespace-nowrap">SALES/CSR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="bg-white">
                        {/* Columna Company (No editable) */}
                        <td className="border border-gray-400 p-1 whitespace-nowrap">{item.company}</td>
                        
                        {/* Columna Next Truck Available (Editable) */}
                        <td className="border border-gray-400 p-0 bg-yellow-100">
                          <input 
                            type="text" 
                            value={item.nextTruckAvailable} 
                            onChange={(e) => handleCellChange(item.id, 'nextTruckAvailable', e.target.value)} 
                            className="w-full h-full p-1 bg-transparent focus:outline-none focus:bg-yellow-200 text-center min-w-[100px]"
                          />
                        </td>

                        {/* Columna PO (Con fondo verde) */}
                        <td className="border border-gray-400 p-1 text-center bg-green-100 font-bold whitespace-nowrap">
                          {item.poNumber}
                        </td>
                        
                        {/* Columnas de solo lectura */}
                        <td className="border border-gray-400 p-1 font-mono text-center whitespace-nowrap">
                          {item.customerItemNumber}
                        </td>
                        <td className="border border-gray-400 p-1 min-w-[200px]">{item.itemDescription}</td>
                        <td className="border border-gray-400 p-1 text-center whitespace-nowrap">
                          {parseInt(item.quantityAlreadyShipped).toLocaleString()}
                        </td>
                        
                        {/* Columna Quantity on Floor (Con fondo azul) */}
                        <td className="border border-gray-400 p-1 text-center bg-blue-100 whitespace-nowrap">
                          {item.quantityOnFloor.toLocaleString()}
                        </td>
                        
                        {/* COLUMNA PALLETS AVAILABLE ELIMINADA */}
                        
                        {/* Columna Item Type (No editable) */}
                        <td className="border border-gray-400 p-1 whitespace-nowrap">{item.itemType}</td>

                        {/* Columna Sales/CSR (Editable) */}
                        <td className="border border-gray-400 p-0 bg-yellow-100">
                           <input 
                             type="text" 
                             value={item.salesCSRNames} 
                             onChange={(e) => handleCellChange(item.id, 'salesCSRNames', e.target.value)} 
                             className="w-full h-full p-1 bg-transparent focus:outline-none focus:bg-yellow-200 min-w-[120px]"
                           />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}