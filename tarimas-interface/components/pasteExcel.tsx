"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
// import { PackageX } from 'lucide-react'; // Ejemplo de ícono para estado vacío

interface Tarima {
  claveProducto: string
  lote: string
  nombreProducto: string
  unidad: string
  almacen: string
  cantidad: number
  po: string
  pesoBruto: number
  pesoNeto: number
  cajas: number
  orden: string
  prodEtiquetaRFIDId: number
  itemNumber: string
  individualUnits: number
  totalUnits: number
  uom: string
  asignadoAentrega: boolean
}

interface Props {
  tarimas: Tarima[]
  selectedTarimas: Tarima[]
  onSelectTarima: (tarima: Tarima) => void
}

export default function PasteExcel({ tarimas, selectedTarimas, onSelectTarima }: Props) {
  const groupedByPO = useMemo(() => {
    const groups: Record<string, Tarima[]> = {}
    for (const tarima of tarimas) {
      if (!groups[tarima.po]) groups[tarima.po] = []
      groups[tarima.po].push(tarima)
    }
    return groups
  }, [tarimas])

  const isSelected = (id: number) =>
    selectedTarimas.some((t) => t.prodEtiquetaRFIDId === id)

  if (Object.keys(groupedByPO).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6 border rounded-lg bg-slate-50 dark:bg-slate-800/30">
        {/* Icono opcional: <PackageX className="h-16 w-16 text-muted-foreground mb-4" /> */}
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No hay tarimas disponibles</h3>
        <p className="text-sm text-muted-foreground">
          Actualmente no hay tarimas para mostrar en esta vista.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[500px] border rounded-lg bg-white dark:bg-slate-900">
      <div className="p-4"> {/* Padding general dentro del ScrollArea */}
        {Object.entries(groupedByPO).map(([po, items]) => (
          <Card key={po} className="mb-6 shadow-md dark:border-slate-700"> {/* Sombra y margen mejorados */}
            <CardHeader className="py-4 px-5 border-b dark:border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">PO: {po}</CardTitle>
                  <CardDescription className="text-sm">
                    {items.length} tarima{items.length === 1 ? "" : "s"} en esta orden.
                  </CardDescription>
                </div>
                {/* Opcional: Botón para seleccionar/deseleccionar todas las tarimas de esta PO */}
                {/* <Button variant="outline" size="sm">Seleccionar todas</Button> */}
              </div>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-3"> {/* Espaciado entre ítems de tarima */}
              {items.map((tarima) => (
                <div
                  key={tarima.prodEtiquetaRFIDId}
                  className={`flex items-center justify-between p-3.5 border rounded-md transition-all duration-150 ease-in-out
                              ${isSelected(tarima.prodEtiquetaRFIDId) 
                                ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/50' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:border-slate-700'}`}
                >
                  <div className="flex items-start space-x-3 flex-grow">
                    <Checkbox
                      id={`excel-tarima-${po}-${tarima.prodEtiquetaRFIDId}`} // ID único para el checkbox
                      checked={isSelected(tarima.prodEtiquetaRFIDId)}
                      onCheckedChange={() => onSelectTarima(tarima)}
                      className="mt-1 flex-shrink-0" // Alineación y evitar que se encoja
                    />
                    <div className="flex-grow min-w-0"> {/* min-w-0 para que el texto se ajuste */}
                      <label 
                        htmlFor={`excel-tarima-${po}-${tarima.prodEtiquetaRFIDId}`} 
                        className="font-medium text-sm text-slate-800 dark:text-slate-100 cursor-pointer block hover:text-primary"
                        title={tarima.nombreProducto} // Tooltip para nombres largos
                      >
                        {tarima.nombreProducto}
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5 space-x-2 flex flex-wrap">
                        <span>Lote: <span className="font-semibold text-slate-600 dark:text-slate-300">{tarima.lote}</span></span>
                        <span className="hidden sm:inline">|</span>
                        <span className="block sm:inline mt-1 sm:mt-0">Item: <span className="font-semibold text-slate-600 dark:text-slate-300">{tarima.itemNumber}</span></span>
                        <span className="hidden md:inline">|</span>
                        <span className="block md:inline mt-1 md:mt-0">RFID: <span className="font-semibold text-slate-600 dark:text-slate-300">{tarima.prodEtiquetaRFIDId}</span></span>
                        <span className="hidden lg:inline">|</span>
                        <span className="block lg:inline mt-1 lg:mt-0">Cajas: <span className="font-semibold text-slate-600 dark:text-slate-300">{tarima.cajas}</span></span>
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={tarima.asignadoAentrega ? "default" : "outline"} 
                    className={`ml-3 text-xs flex-shrink-0 h-fit
                               ${tarima.asignadoAentrega 
                                 ? "bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600" 
                                 : "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50"}`}
                  >
                    {tarima.asignadoAentrega ? "Asignada" : "No Asignada"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}