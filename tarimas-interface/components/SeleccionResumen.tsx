// src/components/SeleccionResumen.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, Truck, BarChart3, X, CheckCircle, AlertCircle } from "lucide-react";
import type { Tarima } from "@/app/page"; // Asegúrate que la ruta a tu interfaz Tarima sea correcta

interface SeleccionResumenProps {
  selectedTarimas: Tarima[];
  onQuitarTarima: (tarima: Tarima) => void; // Esta es tu función handleSelectTarima
  totalCajas: number;
  cantidadTotalFormateada: string;
  totalPesoBruto: number;
  totalPesoNeto: number;
}

export default function SeleccionResumen({
  selectedTarimas,
  onQuitarTarima,
  totalCajas,
  cantidadTotalFormateada,
  totalPesoBruto,
  totalPesoNeto,
}: SeleccionResumenProps) {
  
  if (selectedTarimas.length === 0) { // No mostrar nada si no hay selección
    return null;
  }

  return (
    // ESTE ES EL CÓDIGO QUE TÚ PEGASTE
    <Card className="border-primary/30 bg-primary/5 dark:bg-primary/10 dark:border-primary/40 shadow-md">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-lg flex items-center">
          <Package className="h-5 w-5 mr-2 text-primary" />
          Tarimas Seleccionadas ({selectedTarimas.length})
        </CardTitle>
        <CardDescription>Resumen de las tarimas seleccionadas para procesamiento.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Card Total Cajas */}
          <Card className="dark:bg-slate-700/50 dark:border-slate-600">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cajas</p>
                  <p className="text-2xl font-bold">{totalCajas}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-full">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Card Cantidad Total */}
          <Card className="dark:bg-slate-700/50 dark:border-slate-600">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad Total</p>
                  <p className="text-2xl font-bold" style={{ wordBreak: "break-word" }}>
                    {cantidadTotalFormateada}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-500/20 p-2.5 rounded-full">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Card Peso Bruto */}
          <Card className="dark:bg-slate-700/50 dark:border-slate-600">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Peso Bruto</p>
                  <p className="text-2xl font-bold">{totalPesoBruto.toLocaleString()} kg</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-500/20 p-2.5 rounded-full">
                  <Truck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Card Peso Neto */}
          <Card className="dark:bg-slate-700/50 dark:border-slate-600">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Peso Neto</p>
                  <p className="text-2xl font-bold">{totalPesoNeto.toLocaleString()} kg</p>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2.5 rounded-full">
                  <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <ScrollArea className="h-[200px] rounded-md border dark:border-slate-600 p-1">
          <div className="p-3">
            <h3 className="font-medium mb-2 text-md">Detalle de la Selección:</h3>
            {selectedTarimas.map((tarima, index) => (
              <div key={tarima.prodEtiquetaRFIDId}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate" title={tarima.nombreProducto}>{tarima.nombreProducto}</p>
                      <Badge
                        variant={tarima.asignadoAentrega ? "default" : "destructive"}
                        className={`whitespace-nowrap text-xs h-fit py-0.5 px-1.5
                                    ${tarima.asignadoAentrega ? "bg-green-500 border-green-500 text-white" : ""}`}
                      >
                        {tarima.asignadoAentrega ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {tarima.asignadoAentrega ? "Asignado" : "No asignado"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      <span>Lote: <span className="font-semibold">{tarima.lote}</span></span>
                      <span>Item: <span className="font-semibold">{tarima.itemNumber}</span></span>
                      <span>Cajas: <span className="font-semibold">{tarima.cajas}</span></span>
                      <span>RFID: <span className="font-semibold">{tarima.prodEtiquetaRFIDId}</span></span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 sm:mt-0 text-red-500 hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-500/10 px-2 py-1 self-start sm:self-center"
                    onClick={() => onQuitarTarima(tarima)} // Usamos la prop
                  >
                    <X className="h-4 w-4 mr-1" />
                    Quitar
                  </Button>
                </div>
                {index < selectedTarimas.length - 1 && <Separator className="dark:bg-slate-700" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}