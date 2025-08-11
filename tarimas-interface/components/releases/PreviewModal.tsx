//components/releases/PreviewModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Calendar, Download, Image as ImageIcon, X, FileSpreadsheet } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import html2canvas from "html2canvas";

// Interfaz para los datos de preview (campos simplificados)
interface PreviewItem {
  id: number;
  company: string;
  shipDate: string;
  customerItemNumber: string;
  itemDescription: string;
  quantityAlreadyShipped: string;
  quantityOnFloor: number;
  itemType: string;
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
  const tableRef = useRef<HTMLDivElement>(null);

  // Fetch datos del release
  const fetchPreviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/releases/${releaseId}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar datos: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convertir los datos a formato de preview
      const previewItems: PreviewItem[] = data.shippingItems.map((item: any) => ({
        id: item.id,
        company: item.company || 'BioFlex',
        shipDate: item.shipDate ? item.shipDate.split('T')[0] : shipDate,
        customerItemNumber: item.customerItemNumber || '',
        itemDescription: item.itemDescription || '',
        quantityAlreadyShipped: item.quantityAlreadyShipped || '0',
        quantityOnFloor: item.quantityOnFloor || 0,
        itemType: item.itemType || 'Finished Good'
      }));
      
      setItems(previewItems);
      
    } catch (err) {
      console.error("Error fetching preview data:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast({
        title: "Error al cargar vista previa",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreviewData();
    }
  }, [isOpen, releaseId]);

  // Función para actualizar la fecha de envío en todos los items
  const handleShipDateChange = (newDate: string) => {
    setShipDate(newDate);
    setItems(prev => 
      prev.map(item => ({
        ...item,
        shipDate: newDate
      }))
    );
  };

  // Función para descargar Excel desde la API
  const downloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      
      const response = await fetch(`http://172.16.10.31/api/ReleaseDestiny/releases/${releaseId}/export-excel`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al descargar Excel: ${response.status}`);
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Intentar obtener el nombre del archivo desde el header Content-Disposition
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

      toast({
        title: "¡Excel descargado!",
        description: `El archivo ${fileName} se ha descargado exitosamente.`,
        variant: "default",
      });
      
    } catch (err) {
      console.error("Error downloading Excel:", err);
      toast({
        title: "Error al descargar Excel",
        description: err instanceof Error ? err.message : "Error desconocido al descargar el archivo Excel",
        variant: "destructive",
      });
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Función para descargar como imagen
  const downloadAsImage = async () => {
    if (!tableRef.current) return;

    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Crear enlace de descarga
      const link = document.createElement('a');
      link.download = `${releaseName}_preview.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "¡Descargado!",
        description: "La imagen se ha descargado exitosamente.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error al descargar",
        description: "No se pudo generar la imagen.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl">Vista Previa - {releaseName}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Datos formateados para exportación
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Control de fecha */}
              <div className="flex items-center space-x-2 mr-4">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={shipDate}
                  onChange={(e) => handleShipDateChange(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                />
              </div>
              
              {/* Botones de acción */}
              <Button
                variant="outline"
                size="sm"
                onClick={downloadExcel}
                disabled={loading || items.length === 0 || downloadingExcel}
              >
                {downloadingExcel ? (
                  <>
                    <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    Descargando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    Descargar Excel
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAsImage}
                disabled={loading || items.length === 0}
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                Descargar Imagen
              </Button>
              
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <LoadingSpinner
              title="Cargando vista previa..."
              description="Obteniendo datos del release"
              size="md"
              className="h-64"
            />
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-red-800 dark:text-red-200 font-medium">Error al cargar datos</p>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay datos para mostrar</p>
            </div>
          ) : (
            <div ref={tableRef} className="bg-white p-6">
              {/* Header de la tabla */}
              <div className="mb-4 text-center">
                <h2 className="text-2xl font-bold text-gray-800">SHIPPING MANIFEST</h2>
                <p className="text-gray-600">{releaseName}</p>
                <p className="text-sm text-gray-500">
                  Fecha de envío: {new Date(shipDate).toLocaleDateString('es-MX', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">COMPAÑÍA</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">SHIP DATE</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">ITEM NUMBER</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">DESCRIPCIÓN</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">CANTIDAD ENVIADA</th>
                      <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-800">CANTIDAD EN PISO</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">TIPO ITEM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-3 py-2 text-gray-800">{item.company}</td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-800">
                          {new Date(item.shipDate).toLocaleDateString('es-MX')}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-800 font-mono text-sm">
                          {item.customerItemNumber}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-800">
                          {item.itemDescription}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-gray-800">
                          {item.quantityAlreadyShipped}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-gray-800">
                          {item.quantityOnFloor.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-800">
                          {item.itemType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Total de items: {items.length} | Generado el {new Date().toLocaleString('es-MX')}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}