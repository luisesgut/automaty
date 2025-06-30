// components/shared/ProcessModal.tsx
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle, AlertCircle, Package } from "lucide-react";
import { Tarima } from "@/types";

interface ProcessModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTarimas: Tarima[];
    onConfirmProcess: () => void;
    isProcessing: boolean;
}

export default function ProcessModal({
                                         isOpen,
                                         onClose,
                                         selectedTarimas,
                                         onConfirmProcess,
                                         isProcessing
                                     }: ProcessModalProps) {
    const tarimasAProcesar = selectedTarimas.filter(t => !t.asignadoAentrega);
    const tarimasYaAsignadas = selectedTarimas.filter(t => t.asignadoAentrega);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl dark:bg-slate-800 dark:border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl flex items-center">
                        <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg mr-3">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        Procesar Tarimas Seleccionadas
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        {tarimasAProcesar.length > 0 ? (
                            <>
                                Se procesarán <strong>{tarimasAProcesar.length}</strong> tarima(s) que serán marcadas como asignadas a entrega.
                                {tarimasYaAsignadas.length > 0 && (
                                    <span className="block mt-2 text-amber-600 dark:text-amber-400">
                    <strong>{tarimasYaAsignadas.length}</strong> tarima(s) ya están asignadas y no se procesarán.
                  </span>
                                )}
                            </>
                        ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                Todas las tarimas seleccionadas ya están asignadas. No hay nada que procesar.
              </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[400px] mt-4 mb-6 border-2 dark:border-slate-700 rounded-lg">
                        <div className="space-y-3 p-4">
                            {/* Tarimas a procesar */}
                            {tarimasAProcesar.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Tarimas a procesar ({tarimasAProcesar.length})
                                    </h4>
                                    {tarimasAProcesar.map((tarima) => (
                                        <Card
                                            key={`procesar-${tarima.prodEtiquetaRFIDId}`}
                                            className="bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-sm truncate text-green-800 dark:text-green-200" title={tarima.nombreProducto}>
                                                            {tarima.nombreProducto}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 text-xs text-green-600 dark:text-green-300 mt-1">
                              <span className="bg-green-100 dark:bg-green-500/20 px-2 py-1 rounded">
                                Lote: {tarima.lote}
                              </span>
                                                            <span className="bg-green-100 dark:bg-green-500/20 px-2 py-1 rounded">
                                RFID: {tarima.prodEtiquetaRFIDId}
                              </span>
                                                            <span className="bg-green-100 dark:bg-green-500/20 px-2 py-1 rounded">
                                Cajas: {tarima.cajas}
                              </span>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30">
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        Pendiente
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Tarimas ya asignadas */}
                            {tarimasYaAsignadas.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Tarimas ya asignadas ({tarimasYaAsignadas.length})
                                    </h4>
                                    {tarimasYaAsignadas.map((tarima) => (
                                        <Card
                                            key={`asignada-${tarima.prodEtiquetaRFIDId}`}
                                            className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30"
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-sm truncate text-amber-800 dark:text-amber-200" title={tarima.nombreProducto}>
                                                            {tarima.nombreProducto}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 text-xs text-amber-600 dark:text-amber-300 mt-1">
                              <span className="bg-amber-100 dark:bg-amber-500/20 px-2 py-1 rounded">
                                Lote: {tarima.lote}
                              </span>
                                                            <span className="bg-amber-100 dark:bg-amber-500/20 px-2 py-1 rounded">
                                RFID: {tarima.prodEtiquetaRFIDId}
                              </span>
                                                        </div>
                                                    </div>
                                                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Asignado
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t dark:border-slate-700">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirmProcess}
                        disabled={isProcessing || tarimasAProcesar.length === 0}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isProcessing ? "Procesando..." :
                            tarimasAProcesar.length === 0 ? "Nada que procesar" :
                                `Confirmar y Procesar (${tarimasAProcesar.length})`
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}