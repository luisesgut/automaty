"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Download, X, FileSpreadsheet, Loader2, Image } from "lucide-react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import html2canvas from "html2canvas";

interface PreviewItem {
  id: number;
  company: string;
  nextTruckAvailable: string;
  poNumber: string;
  customerItemNumber: string;
  itemDescription: string;
  quantityAlreadyShipped: string;
  quantityOnFloor: number;
  itemType: string;
  salesCSRNames: string;
  shipDate: string;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseId: number;
  releaseName: string;
}

const normalizeLot = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const isNonEmptyString = (value: string | null): value is string => Boolean(value && value.length > 0);

const parseTraceabilityList = (value: unknown): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map(normalizeLot)
      .filter(isNonEmptyString);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeLot)
          .filter(isNonEmptyString);
      }
    } catch {
      return value
        .split(/[\s,]+/)
        .map(normalizeLot)
        .filter(isNonEmptyString);
    }
  }

  return [];
};

const toNumericValue = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) {
      return 0;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const deriveQuantityOnFloor = (item: any, quantityIndex: Map<string, number>): number => {
  const lotNumbers = parseTraceabilityList(item?.trazabilidades);
  if (lotNumbers.length > 0) {
    let matched = false;
    const totalFromLots = lotNumbers.reduce((acc, lote) => {
      const quantity = quantityIndex.get(lote);
      if (typeof quantity === "number" && !Number.isNaN(quantity)) {
        matched = true;
        return acc + quantity;
      }
      return acc;
    }, 0);

    if (matched) {
      return totalFromLots;
    }
  }

  const shipped = toNumericValue(item?.quantityAlreadyShipped);
  if (shipped > 0) {
    return shipped;
  }

  return toNumericValue(item?.quantityOnFloor);
};

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

      const quantityIndex = new Map<string, number>();

      try {
        const stockResponse = await fetch("http://172.16.10.31/api/vwStockDestiny");
        if (stockResponse.ok) {
          const stockData: Array<Record<string, unknown>> = await stockResponse.json();
          stockData.forEach((stockItem) => {
            const loteKey = normalizeLot((stockItem as any).lote);
            if (!loteKey) {
              return;
            }

            const rawQuantity = (stockItem as any).cantidad ?? (stockItem as any).totalUnits;
            if (rawQuantity === null || rawQuantity === undefined || rawQuantity === "") {
              return;
            }

            const numericQuantity = toNumericValue(rawQuantity);
            if (!Number.isNaN(numericQuantity)) {
              quantityIndex.set(loteKey, numericQuantity);
            }
          });
        } else {
          console.warn(`No se pudo obtener el inventario para la vista previa: ${stockResponse.status}`);
        }
      } catch (stockError) {
        console.warn("Error al obtener inventario para vista previa:", stockError);
      }

      const previewItems: PreviewItem[] = data.shippingItems.map((item: any) => ({
        id: item.id,
        company: item.company || "BioFlex",
        nextTruckAvailable: new Date(item.shipDate || shipDate).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
        poNumber: item.poNumber || "",
        customerItemNumber: item.customerItemNumber || "",
        itemDescription: item.itemDescription || "",
        quantityAlreadyShipped: item.quantityAlreadyShipped || "0",
        quantityOnFloor: deriveQuantityOnFloor(item, quantityIndex),
        itemType: item.itemType || "Finished Good",
        salesCSRNames: item.salesCSRNames || "",
        shipDate: item.shipDate ? item.shipDate.split("T")[0] : shipDate,
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
      // Crear un contenedor temporal completo
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-99999px';
      tempContainer.style.left = '0';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '40px';
      tempContainer.style.width = 'max-content';
      
      // Agregar el logo de Bioflex (SVG inline)
      const logoSvg = `
        <div style="margin-bottom: 30px; text-align: center;">
          <svg width="300" height="80" viewBox="0 0 1440 600" xmlns="http://www.w3.org/2000/svg">
            <text x="120" y="380" font-family="Arial, sans-serif" font-size="280" font-weight="700" fill="#2C4F54">bioflex</text>
            <text x="120" y="480" font-family="Arial, sans-serif" font-size="60" font-weight="500" fill="#2C4F54">Beyond packaging.</text>
          </svg>
        </div>
      `;
      
      tempContainer.innerHTML = logoSvg;
      
      // Clonar el contenido de la tabla
      const clonedContent = tableRef.current.cloneNode(true) as HTMLElement;
      
      // Eliminar restricciones de overflow
      const clonedTable = clonedContent.querySelector('.overflow-x-auto') as HTMLElement;
      if (clonedTable) {
        clonedTable.style.overflow = 'visible';
        clonedTable.style.maxWidth = 'none';
        clonedTable.style.width = 'max-content';
      }
      
      // Asegurar que la tabla tenga el ancho completo
      const table = clonedContent.querySelector('table') as HTMLElement;
      if (table) {
        table.style.width = 'max-content';
        table.style.minWidth = 'auto';
      }
      
      // Reemplazar inputs con divs para evitar cortes
      const inputs = clonedContent.querySelectorAll('input');
      inputs.forEach((input) => {
        const div = document.createElement('div');
        div.textContent = input.value;
        div.style.padding = '4px';
        div.style.textAlign = input.style.textAlign || 'left';
        div.style.whiteSpace = 'nowrap';
        div.style.width = 'auto';
        div.style.minWidth = '100px';
        div.className = input.className.replace('bg-transparent', '');
        
        if (input.parentElement) {
          input.parentElement.appendChild(div);
          input.style.display = 'none';
        }
      });
      
      tempContainer.appendChild(clonedContent);
      document.body.appendChild(tempContainer);
      
      // Esperar un momento para que se renderice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capturar con html2canvas
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tempContainer.scrollWidth,
        windowHeight: tempContainer.scrollHeight,
      });

      // Limpiar
      document.body.removeChild(tempContainer);

      // Descargar la imagen
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${releaseName}_preview.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          
          toast({ 
            title: "¡Imagen descargada!", 
            description: "La imagen completa se ha descargado exitosamente con el logo de Bioflex." 
          });
        }
      }, 'image/png', 1.0);

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
                  <Image className="w-4 h-4 mr-1" />
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
                        <td className="border border-gray-400 p-1 whitespace-nowrap">{item.company}</td>
                        
                        <td className="border border-gray-400 p-0 bg-yellow-100">
                          <input 
                            type="text" 
                            value={item.nextTruckAvailable} 
                            onChange={(e) => handleCellChange(item.id, 'nextTruckAvailable', e.target.value)} 
                            className="w-full h-full p-1 bg-transparent focus:outline-none focus:bg-yellow-200 text-center min-w-[100px]"
                          />
                        </td>

                        <td className="border border-gray-400 p-1 text-center bg-green-100 font-bold whitespace-nowrap">
                          {item.poNumber}
                        </td>
                        
                        <td className="border border-gray-400 p-1 font-mono text-center whitespace-nowrap">
                          {item.customerItemNumber}
                        </td>
                        <td className="border border-gray-400 p-1 min-w-[200px]">{item.itemDescription}</td>
                        <td className="border border-gray-400 p-1 text-center whitespace-nowrap">
                          {parseInt(item.quantityAlreadyShipped).toLocaleString()}
                        </td>
                        
                        <td className="border border-gray-400 p-1 text-center bg-blue-100 whitespace-nowrap">
                          {item.quantityOnFloor.toLocaleString()}
                        </td>
                        
                        <td className="border border-gray-400 p-1 whitespace-nowrap">{item.itemType}</td>

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