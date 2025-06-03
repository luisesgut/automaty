// src/components/FilteredResultItemDisplay.tsx (NUEVO ARCHIVO)
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, AlertCircle, CheckCircle } from "lucide-react"; // Importar iconos
import type { Tarima } from "@/app/page"; // Asegúrate que la ruta a tu interfaz Tarima sea correcta

interface FilteredResultItemDisplayProps {
  filterResult: { // Corresponde a un ApiFilterResponseItem
    filtroSolicitado: {
      po: string;
      itemNumber: string;
    };
    totalEncontrados: number;
    datos: Tarima[];
  };
  selectedTarimas: Tarima[];
  onSelectTarima: (tarima: Tarima) => void;
}

export default function FilteredResultItemDisplay({
  filterResult,
  selectedTarimas,
  onSelectTarima,
}: FilteredResultItemDisplayProps) {
  
  const isSelected = (id: number) =>
    selectedTarimas.some((t) => t.prodEtiquetaRFIDId === id);

  return (
    <Card className="mb-6 shadow-md dark:bg-slate-800/70 dark:border-slate-700">
      <CardHeader className="pb-3 pt-4 bg-slate-50 dark:bg-slate-700/50 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-md font-semibold">
              Búsqueda: PO <span className="text-primary">{filterResult.filtroSolicitado.po}</span> / Item <span className="text-primary">{filterResult.filtroSolicitado.itemNumber}</span>
            </CardTitle>
            <CardDescription className="text-sm">
              {filterResult.totalEncontrados > 0 
                ? `${filterResult.totalEncontrados} tarima(s) encontrada(s).`
                : "No se encontraron tarimas para este criterio."}
            </CardDescription>
          </div>
          {filterResult.totalEncontrados > 0 && (
             <Badge variant="secondary" className="h-fit">
                {filterResult.totalEncontrados} Encontrada(s)
             </Badge>
          )}
        </div>
      </CardHeader>

      {filterResult.totalEncontrados > 0 && filterResult.datos.length > 0 && (
        <CardContent className="px-5 py-4 space-y-3">
          {filterResult.datos.map((tarima) => (
            <div
              key={tarima.prodEtiquetaRFIDId}
              className={`flex items-center justify-between p-3 border rounded-md transition-all duration-150 ease-in-out
                          ${isSelected(tarima.prodEtiquetaRFIDId)
                            ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 dark:border-slate-600'}`}
            >
              <div className="flex items-start space-x-3 flex-grow">
                <Checkbox
                  id={`excel-item-${filterResult.filtroSolicitado.po}-${tarima.prodEtiquetaRFIDId}`}
                  checked={isSelected(tarima.prodEtiquetaRFIDId)}
                  onCheckedChange={() => onSelectTarima(tarima)}
                  className="mt-1 flex-shrink-0"
                  aria-label={`Seleccionar tarima ${tarima.nombreProducto}`}
                />
                <div className="flex-grow min-w-0">
                  <label
                    htmlFor={`excel-item-${filterResult.filtroSolicitado.po}-${tarima.prodEtiquetaRFIDId}`}
                    className="font-medium text-sm text-slate-800 dark:text-slate-100 cursor-pointer block hover:text-primary"
                    title={tarima.nombreProducto}
                  >
                    {tarima.nombreProducto}
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5 space-x-2 flex flex-wrap">
                    <span>Lote: <span className="font-semibold text-slate-600 dark:text-slate-300">{tarima.lote}</span></span>
                    <span className="hidden sm:inline">|</span>
                    <span className="block sm:inline mt-1 sm:mt-0">RFID: <span className="font-semibold text-slate-600 dark:text-slate-300">{tarima.prodEtiquetaRFIDId}</span></span>
                    <span className="hidden md:inline">|</span>
                    <span className="block md:inline mt-1 md:mt-0">Cajas: <span className="font-semibold text-slate-600 dark:text-slate-300">{tarima.cajas}</span></span>
                     <span className="hidden lg:inline">|</span>
                    <span className="block lg:inline mt-1 lg:mt-0">Cant: <span className="font-semibold text-slate-600 dark:text-slate-300">{tarima.cantidad.toLocaleString()} {tarima.unidad}</span></span>
                  </p>
                </div>
              </div>
              <Badge
                variant={tarima.asignadoAentrega ? "default" : "outline"}
                className={`ml-3 text-xs flex-shrink-0 h-fit py-0.5 px-1.5
                            ${tarima.asignadoAentrega
                              ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                              : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"}`}
              >
                {tarima.asignadoAentrega ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {tarima.asignadoAentrega ? "Asignada" : "Pendiente"}
              </Badge>
            </div>
          ))}
        </CardContent>
      )}
      {filterResult.totalEncontrados > 0 && filterResult.datos.length === 0 && (
         <CardContent className="px-5 py-4 text-center text-muted-foreground">
            <p>Se encontraron {filterResult.totalEncontrados} en el sistema, pero no se pudieron cargar los detalles en esta vista (o no hay más detalles que mostrar aquí).</p>
         </CardContent>
      )}
    </Card>
  );
}