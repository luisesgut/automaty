// ProcessModal.tsx - Actualizado con campos editables para descripción y notas
"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2, AlertCircle, Edit3 } from "lucide-react";

type ProcessingStep = "idle" | "updating-status" | "creating-release" | "completed" | "error";

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTarimas: any[];
  onConfirmProcess: (createdBy: string, description: string, notes: string) => void;
  isProcessing: boolean;
  processingStep: ProcessingStep;
  processingMessage: string;
}

const ProcessModal = ({
  isOpen,
  onClose,
  selectedTarimas,
  onConfirmProcess,
  isProcessing,
  processingStep,
  processingMessage,
}: ProcessModalProps) => {
  const [createdBy, setCreatedBy] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  // Opciones para el createdBy
  const createdByOptions = [
    "Sistema",
    "Rebeca Franco",
    "Moises Jimenez"
  ];

  // Calcular estadísticas para generar descripción y notas por defecto
  const tarimasAProcesar = selectedTarimas.filter(t => !t.asignadoAentrega);
  
  // Agrupar por producto para contar productos únicos
  const productosConsolidados: Record<string, any[]> = {};
  for (const tarima of tarimasAProcesar) {
    const claveProducto = `${tarima.po}-${tarima.itemNumber}`;
    if (!productosConsolidados[claveProducto]) {
      productosConsolidados[claveProducto] = [];
    }
    productosConsolidados[claveProducto].push(tarima);
  }

  // Generar valores por defecto cuando se abre el modal
  useEffect(() => {
    if (isOpen && processingStep === "idle") {
      const fechaActual = new Date().toISOString().split('T')[0];
      const defaultDescription = `Release consolidado generado automáticamente el ${fechaActual}`;
      const defaultNotes = `Release creado con ${tarimasAProcesar.length} tarimas procesadas (${Object.keys(productosConsolidados).length} productos únicos)`;
      
      setDescription(defaultDescription);
      setNotes(defaultNotes);
      
      // Solo resetear createdBy si está vacío
      if (!createdBy) {
        setCreatedBy("");
      }
    }
  }, [isOpen, processingStep, tarimasAProcesar.length, Object.keys(productosConsolidados).length]);

  const handleConfirm = () => {
    if (!createdBy.trim()) {
      return; // No procesar si no hay createdBy
    }
    
    onConfirmProcess(createdBy.trim(), description.trim(), notes.trim());
  };

  const canConfirm = createdBy.trim() !== "" && description.trim() !== "" && notes.trim() !== "";

  const getStepIcon = () => {
    switch (processingStep) {
      case "updating-status":
      case "creating-release":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-amber-500" />;
    }
  };

  const getStepColor = () => {
    switch (processingStep) {
      case "updating-status":
      case "creating-release":
        return "text-blue-600 dark:text-blue-400";
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStepIcon()}
            {processingStep === "idle" ? "Confirmar Procesamiento" : "Procesando Tarimas"}
          </DialogTitle>
          <DialogDescription>
            {processingStep === "idle"
              ? `Se procesarán ${tarimasAProcesar.length} tarima(s) para crear un release consolidado.`
              : processingMessage
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mostrar campos editables solo cuando no está procesando */}
          {processingStep === "idle" && (
            <>
              {/* Selector de createdBy */}
              <div className="space-y-2">
                <Label htmlFor="createdBy">Creado por:</Label>
                <Select value={createdBy} onValueChange={setCreatedBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona quién crea el release" />
                  </SelectTrigger>
                  <SelectContent>
                    {createdByOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo de descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Descripción:
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del release"
                  className="w-full"
                />
              </div>

              {/* Campo de notas */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Notas:
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales del release"
                  className="w-full min-h-[80px] resize-none"
                />
              </div>

              {/* Información de resumen */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Resumen del procesamiento:
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  • {tarimasAProcesar.length} tarimas a procesar
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  • {Object.keys(productosConsolidados).length} productos únicos
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  • Peso total: {tarimasAProcesar.reduce((sum, t) => sum + t.pesoBruto, 0).toFixed(2)} kg
                </div>
              </div>
            </>
          )}

          {/* Mostrar progreso cuando está procesando */}
          {processingStep !== "idle" && (
            <div className="text-center py-6">
              <div className={`text-lg font-medium ${getStepColor()}`}>
                {processingMessage}
              </div>
              {(processingStep === "updating-status" || processingStep === "creating-release") && (
                <div className="mt-2 text-sm text-slate-500">
                  Por favor, espere...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {processingStep === "idle" ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={!canConfirm || isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar y Procesar"
                )}
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={processingStep === "updating-status" || processingStep === "creating-release"}
            >
              {(processingStep === "completed" || processingStep === "error") ? "Cerrar" : "Cancelar"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessModal;