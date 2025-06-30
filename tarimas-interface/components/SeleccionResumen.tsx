"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, X, CheckCircle, AlertCircle } from "lucide-react";
import { Tarima } from "@/types"; // Importar desde types en lugar de page

interface SeleccionResumenProps {
  selectedTarimas: Tarima[];
  onQuitarTarima: (tarima: Tarima) => void;
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
                                           totalPesoNeto
                                         }: SeleccionResumenProps) {
  if (selectedTarimas.length === 0) return null;

  return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-purple/5 dark:from-primary/10 dark:to-purple/10 dark:border-primary/40 shadow-xl">
        <CardHeader className="pb-4 pt-6">
          <CardTitle className="text-xl flex items-center">
            <div className="bg-primary/20 p-2 rounded-lg mr-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
            Resumen de Selección ({selectedTarimas.length})
          </CardTitle>
          <CardDescription className="mt-1">
            Tarimas seleccionadas para procesamiento
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCajas}</p>
              <p className="text-xs text-muted-foreground">Total Cajas</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{cantidadTotalFormateada}</p>
              <p className="text-xs text-muted-foreground">Cantidad</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{totalPesoBruto.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Peso Bruto (kg)</p>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{totalPesoNeto.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Peso Neto (kg)</p>
            </div>
          </div>

          {/* Lista de tarimas */}
          <ScrollArea className="h-[200px] rounded-lg border-2 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50">
            <div className="p-4">
              {selectedTarimas.map((tarima, index) => (
                  <div key={tarima.prodEtiquetaRFIDId}>
                    <div className="flex items-center justify-between py-2 group hover:bg-slate-50/80 dark:hover:bg-slate-700/40 rounded-lg px-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm truncate" title={tarima.nombreProducto}>
                          {tarima.nombreProducto}
                        </h4>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                          <span>Lote: {tarima.lote}</span>
                          <span>•</span>
                          <span>RFID: {tarima.prodEtiquetaRFIDId}</span>
                        </div>
                      </div>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onQuitarTarima(tarima)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {index < selectedTarimas.length - 1 && <Separator className="my-1" />}
                  </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
  );
}