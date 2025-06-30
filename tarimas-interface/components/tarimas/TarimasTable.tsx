// components/tarimas/TarimasTable.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Tarima } from "@/types";

interface TarimasTableProps {
    tarimas: Tarima[];
    filteredTarimas: Tarima[];
    selectedTarimas: Tarima[];
    searchTerm: string;
    loading: boolean;
    onSelectTarima: (tarima: Tarima) => void;
    weightInfo?: {
        totalPesoBruto: number;
        pesoMaximo: number;
        porcentajeUsado: number;
        pesoRestante: number;
        cercaDelLimite: boolean;
        enLimite: boolean;
    };
}

export default function TarimasTable({
                                         tarimas,
                                         filteredTarimas,
                                         selectedTarimas,
                                         searchTerm,
                                         loading,
                                         onSelectTarima,
                                         weightInfo
                                     }: TarimasTableProps) {
    const isTarimaSelected = (prodEtiquetaRFIDId: number) => {
        return selectedTarimas.some((tarima) => tarima.prodEtiquetaRFIDId === prodEtiquetaRFIDId);
    };

    // Función para verificar si una tarima puede ser seleccionada
    const canSelectTarima = (tarima: Tarima) => {
        if (!weightInfo) return true;

        const isSelected = isTarimaSelected(tarima.prodEtiquetaRFIDId);
        if (isSelected) return true; // Siempre se puede deseleccionar

        const nuevoPeso = weightInfo.totalPesoBruto + tarima.pesoBruto;
        return nuevoPeso <= weightInfo.pesoMaximo;
    };

    return (
        <Card className="shadow-xl dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
            <CardHeader className="pb-4 pt-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="text-xl">Inventario General de Tarimas</CardTitle>
                <CardDescription className="text-base">
                    {filteredTarimas.length} de {tarimas.length} tarimas encontradas
                    {searchTerm && (
                        <span className="ml-2 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
              Filtro: "{searchTerm}"
            </span>
                    )}
                </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
                <div className="rounded-lg border-2 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                    <div className="max-h-[700px] overflow-auto">
                        <div className="min-w-[1400px]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-100 dark:bg-slate-700 z-[1] shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-12 text-center bg-slate-200 dark:bg-slate-600">
                                            <Checkbox className="mx-auto" disabled />
                                        </TableHead>
                                        <TableHead className="font-semibold min-w-[200px]">Producto</TableHead>
                                        <TableHead className="font-semibold min-w-[100px]">Lote</TableHead>
                                        <TableHead className="font-semibold min-w-[120px]">Item Number</TableHead>
                                        <TableHead className="text-right font-semibold min-w-[100px]">Cantidad</TableHead>
                                        <TableHead className="font-semibold min-w-[80px]">Unidad</TableHead>
                                        <TableHead className="text-right font-semibold min-w-[80px]">Cajas</TableHead>
                                        <TableHead className="text-right font-semibold min-w-[100px]">Peso Neto</TableHead>
                                        <TableHead className="text-right font-semibold min-w-[100px]">Peso Bruto</TableHead>
                                        <TableHead className="font-semibold min-w-[100px]">Almacén</TableHead>
                                        <TableHead className="font-semibold min-w-[100px]">PO</TableHead>
                                        <TableHead className="text-right font-semibold min-w-[100px]">RFID ID</TableHead>
                                        <TableHead className="font-semibold min-w-[120px]">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && tarimas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={13} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                                    <div>
                                                        <p className="text-lg font-medium">Cargando inventario...</p>
                                                        <p className="text-sm text-muted-foreground">Por favor espere un momento</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredTarimas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={13} className="h-40 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="bg-slate-100 dark:bg-slate-700 rounded-full p-4">
                                                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-medium text-muted-foreground">
                                                            No se encontraron tarimas
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {searchTerm
                                                                ? `No hay coincidencias para "${searchTerm}"`
                                                                : "No hay tarimas disponibles en este momento"
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTarimas.map((tarima, index) => {
                                            const isSelected = isTarimaSelected(tarima.prodEtiquetaRFIDId);
                                            return (
                                                <TableRow
                                                    key={tarima.prodEtiquetaRFIDId}
                                                    className={`transition-all duration-200 cursor-pointer hover:shadow-sm
                                    ${isSelected
                                                        ? "bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary"
                                                        : "hover:bg-slate-50/80 dark:hover:bg-slate-700/50"
                                                    } ${index % 2 === 0 ? "bg-slate-25 dark:bg-slate-800/30" : ""}`}
                                                    onClick={() => onSelectTarima(tarima)}
                                                >
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => onSelectTarima(tarima)}
                                                            aria-label={`Seleccionar tarima ${tarima.nombreProducto}`}
                                                            className="transition-all duration-200"
                                                        />
                                                    </TableCell>

                                                    <TableCell className="font-medium">
                                                        <div className="space-y-1">
                                                            <div className="max-w-[180px] truncate font-semibold" title={tarima.nombreProducto}>
                                                                {tarima.nombreProducto}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                                {tarima.claveProducto}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                            <span className="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1 rounded text-sm font-medium">
                              {tarima.lote}
                            </span>
                                                    </TableCell>

                                                    <TableCell>
                            <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              {tarima.itemNumber}
                            </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                            <span className="font-semibold text-lg">
                              {tarima.cantidad.toLocaleString()}
                            </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge variant="outline" className="font-medium">
                                                            {tarima.unidad}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <div className="space-y-1">
                                                            <div className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                <span className="font-semibold text-blue-700 dark:text-blue-300">
                                  {tarima.cajas}
                                </span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {tarima.individualUnits?.toLocaleString() || "N/A"} pzs/caja
                                                            </div>
                                                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                                {tarima.totalUnits?.toLocaleString() || "N/A"} total
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="text-sm">{tarima.pesoNeto.toLocaleString()} kg</span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <span className="text-sm font-medium">{tarima.pesoBruto.toLocaleString()} kg</span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {tarima.almacen}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell>
                            <span className="font-mono text-sm bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                              {tarima.po}
                            </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                            <span className="font-mono text-xs text-muted-foreground">
                              {tarima.prodEtiquetaRFIDId}
                            </span>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge
                                                            variant={tarima.asignadoAentrega ? "default" : "outline"}
                                                            className={`whitespace-nowrap text-xs h-fit py-1.5 px-3 transition-all duration-200
                                ${tarima.asignadoAentrega
                                                                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 shadow-sm"
                                                                : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"}`}
                                                        >
                                                            {tarima.asignadoAentrega ? (
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                            ) : (
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                            )}
                                                            {tarima.asignadoAentrega ? "Asignado" : "Pendiente"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}