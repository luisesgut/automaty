// components/excel/ExcelDataInput.tsx
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    FileSpreadsheet,
    AlertCircle,
    Copy,
    Trash2,
    AlertTriangle,
    RefreshCw,
    Filter
} from "lucide-react";
import { useState, useEffect } from "react";

interface ExcelDataInputProps {
    pastedText: string;
    onTextChange: (text: string) => void;
    onVerifyData: () => void;
    isDisabled?: boolean;
}

interface ValidationResult {
    totalLines: number;
    validPairs: number;
    duplicates: number;
    emptyLines: number;
    invalidLines: number;
    duplicateItems: Array<{ po: string; item: string; count: number }>;
    invalidItems: Array<{ line: string; reason: string }>;
}

export default function ExcelDataInput({
    pastedText,
    onTextChange,
    onVerifyData,
    isDisabled = false
}: ExcelDataInputProps) {
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [showValidation, setShowValidation] = useState(false);

    // Función para validar y analizar los datos en tiempo real
    const validateData = (text: string): ValidationResult => {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const validPairs: Array<{ po: string; item: string }> = [];
        const invalidItems: Array<{ line: string; reason: string }> = [];
        const pairCounts = new Map<string, number>();

        lines.forEach(line => {
            // Detectar diferentes formatos
            const parts = line.split(/\s+/).filter(part => part.trim().length > 0);
            
            if (parts.length < 2) {
                invalidItems.push({ 
                    line, 
                    reason: "Línea incompleta - necesita PO y Customer Item" 
                });
                return;
            }

            // Tomar el primer elemento como PO y el resto como Customer Item
            const po = parts[0];
            const item = parts.slice(1).join(' ');

            // Validar formato de PO (solo números generalmente)
            if (!/^\d+$/.test(po)) {
                invalidItems.push({ 
                    line, 
                    reason: "PO debe ser numérico" 
                });
                return;
            }

            // Validar que Customer Item no esté vacío
            if (!item || item.trim().length === 0) {
                invalidItems.push({ 
                    line, 
                    reason: "Customer Item no puede estar vacío" 
                });
                return;
            }

            validPairs.push({ po, item });

            // Contar duplicados
            const pairKey = `${po}|${item}`;
            pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
        });

        // Identificar duplicados
        const duplicateItems: Array<{ po: string; item: string; count: number }> = [];
        pairCounts.forEach((count, key) => {
            if (count > 1) {
                const [po, item] = key.split('|');
                duplicateItems.push({ po, item, count });
            }
        });

        return {
            totalLines: lines.length,
            validPairs: validPairs.length,
            duplicates: duplicateItems.length,
            emptyLines: text.split('\n').length - lines.length,
            invalidLines: invalidItems.length,
            duplicateItems,
            invalidItems
        };
    };

    // Validar automáticamente cuando cambie el texto
    useEffect(() => {
        if (pastedText.trim()) {
            const result = validateData(pastedText);
            setValidation(result);
            setShowValidation(result.duplicates > 0 || result.invalidLines > 0);
        } else {
            setValidation(null);
            setShowValidation(false);
        }
    }, [pastedText]);

    const handleClearText = () => {
        onTextChange("");
        setValidation(null);
        setShowValidation(false);
    };

    const handleExamplePaste = () => {
        const exampleText =
            "12793 002-00-55115-04\n12813 1318\n12833 CF-004\n12850 0930N\n12842 9801905\n12880 002-40-55010-06\n12249 0930M";
        onTextChange(exampleText);
    };

    // Función para limpiar duplicados automáticamente
    const handleCleanDuplicates = () => {
        const lines = pastedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const seen = new Set<string>();
        const cleanedLines: string[] = [];

        lines.forEach(line => {
            const parts = line.split(/\s+/).filter(part => part.trim().length > 0);
            if (parts.length >= 2) {
                const po = parts[0];
                const item = parts.slice(1).join(' ');
                const key = `${po}|${item}`;
                
                if (!seen.has(key)) {
                    seen.add(key);
                    cleanedLines.push(line);
                }
            }
        });

        onTextChange(cleanedLines.join('\n'));
    };

    // Función para limpiar líneas inválidas
    const handleCleanInvalid = () => {
        const lines = pastedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const validLines: string[] = [];

        lines.forEach(line => {
            const parts = line.split(/\s+/).filter(part => part.trim().length > 0);
            if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
                validLines.push(line);
            }
        });

        onTextChange(validLines.join('\n'));
    };

    return (
        <Card className="shadow-xl dark:bg-slate-800 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
                <CardTitle className="text-xl flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg mr-3">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Entrada de Datos desde Excel (Inteligente)
                </CardTitle>
                <CardDescription className="text-base">
                    Copia y pega los datos del Excel del cliente. El sistema detectará automáticamente duplicados, 
                    validará formatos y parseará las columnas <strong>PO</strong> y <strong>Customer Item</strong>.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                {/* Validación en tiempo real */}
                {validation && (
                    <div className={`border-2 rounded-lg p-4 ${
                        validation.duplicates > 0 || validation.invalidLines > 0 
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' 
                            : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-semibold flex items-center ${
                                validation.duplicates > 0 || validation.invalidLines > 0
                                    ? 'text-amber-800 dark:text-amber-200'
                                    : 'text-green-800 dark:text-green-200'
                            }`}>
                                {validation.duplicates > 0 || validation.invalidLines > 0 ? (
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Análisis de Datos
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowValidation(!showValidation)}
                                className="text-xs"
                            >
                                {showValidation ? 'Ocultar' : 'Ver detalles'}
                            </Button>
                        </div>

                        {/* Estadísticas rápidas */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400">
                                {validation.validPairs} válidos
                            </Badge>
                            {validation.duplicates > 0 && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400">
                                    {validation.duplicates} duplicados
                                </Badge>
                            )}
                            {validation.invalidLines > 0 && (
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-400">
                                    {validation.invalidLines} inválidos
                                </Badge>
                            )}
                        </div>

                        {/* Botones de limpieza automática */}
                        {(validation.duplicates > 0 || validation.invalidLines > 0) && (
                            <div className="flex gap-2 flex-wrap">
                                {validation.duplicates > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCleanDuplicates}
                                        className="text-xs"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Eliminar Duplicados ({validation.duplicates})
                                    </Button>
                                )}
                                {validation.invalidLines > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCleanInvalid}
                                        className="text-xs"
                                    >
                                        <Filter className="h-3 w-3 mr-1" />
                                        Limpiar Inválidos ({validation.invalidLines})
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Detalles expandibles */}
                        {showValidation && (
                            <div className="mt-4 space-y-3 text-sm">
                                {validation.duplicateItems.length > 0 && (
                                    <div>
                                        <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                                            Duplicados encontrados:
                                        </p>
                                        <div className="bg-amber-100 dark:bg-amber-800/40 rounded p-2 max-h-32 overflow-y-auto">
                                            {validation.duplicateItems.map((dup, idx) => (
                                                <div key={idx} className="text-xs text-amber-700 dark:text-amber-300">
                                                    PO {dup.po} + Item {dup.item} (aparece {dup.count} veces)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {validation.invalidItems.length > 0 && (
                                    <div>
                                        <p className="font-medium text-red-800 dark:text-red-200 mb-2">
                                            Líneas inválidas:
                                        </p>
                                        <div className="bg-red-100 dark:bg-red-800/40 rounded p-2 max-h-32 overflow-y-auto">
                                            {validation.invalidItems.map((invalid, idx) => (
                                                <div key={idx} className="text-xs text-red-700 dark:text-red-300">
                                                    "{invalid.line}" - {invalid.reason}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Formatos soportados y limpieza automática:
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
                        <div>
                            <p className="font-medium mb-1">📋 Formato básico:</p>
                            <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded block text-xs">
                                12793 002-00-55115-04<br />
                                12813 1318<br />
                                12833 CF-004
                            </code>
                        </div>
                        <div>
                            <p className="font-medium mb-1">🧹 Limpieza automática:</p>
                            <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded block text-xs">
                                ❌ 13236 9801865 - 783092<br />
                                ✅ 13236 9801865<br />
                                ✅ 13365 14010912-00 (sin cambios)
                            </code>
                        </div>
                    </div>
                    <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800/40 rounded text-xs text-blue-600 dark:text-blue-400">
                        <strong>💡 Reglas de limpieza:</strong><br/>
                        • Customer Items con " - " (espacios): se toma solo la primera parte<br/>
                        • Customer Items con "-" pegado: se mantienen completos<br/>
                        • Duplicados: eliminados automáticamente
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="excelPasteArea" className="block text-sm font-semibold">
                            Datos del Excel del Cliente:
                        </label>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExamplePaste}
                                className="text-xs"
                                disabled={isDisabled}
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                Usar Ejemplo
                            </Button>
                            {pastedText && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearText}
                                    className="text-xs text-red-600 hover:text-red-700"
                                    disabled={isDisabled}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Limpiar
                                </Button>
                            )}
                        </div>
                    </div>

                    <Textarea
                        id="excelPasteArea"
                        placeholder={`Pega aquí los datos del Excel...\n\nEjemplo:\n12793 002-00-55115-04\n12813 1318\n12833 CF-004\n\n⚡ Ahora con detección automática de duplicados e inválidos`}
                        value={pastedText}
                        onChange={(e) => onTextChange(e.target.value)}
                        rows={10}
                        disabled={isDisabled}
                        className="shadow-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-700 dark:border-slate-600 dark:focus:border-primary border-2 transition-all duration-200 font-mono text-sm"
                    />

                    {pastedText && validation && (
                        <div className="flex justify-between text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 p-2 rounded">
                            <span>📊 {validation.totalLines} líneas detectadas</span>
                            <span>✅ {validation.validPairs} pares válidos</span>
                            <span>📝 {pastedText.length} caracteres</span>
                            {validation.duplicates > 0 && (
                                <span className="text-amber-600 dark:text-amber-400">⚠️ {validation.duplicates} duplicados</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={onVerifyData}
                        disabled={!pastedText.trim() || isDisabled || (validation?.validPairs === 0)}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-200 hover:scale-105"
                        size="lg"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verificar y Parsear Datos
                        {validation && validation.validPairs > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-white/20">
                                {validation.validPairs}
                            </Badge>
                        )}
                    </Button>

                    {pastedText && (
                        <div className="text-sm text-muted-foreground flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validation && validation.validPairs > 0 
                                ? `${validation.validPairs} pares válidos listos para procesar`
                                : "Corrige los errores antes de continuar"
                            }
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Proceso del flujo (mejorado):
                    </h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                        <div className="flex items-center">
                            <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">1</span>
                            El cliente envía Excel con columnas PO y Customer Item
                        </div>
                        <div className="flex items-center">
                            <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">2</span>
                            Copias y pegas las dos columnas aquí
                        </div>
                        <div className="flex items-center">
                            <span className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">3</span>
                            ⚡ Sistema detecta duplicados e inválidos automáticamente
                        </div>
                        <div className="flex items-center">
                            <span className="bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">4</span>
                            Opcionalmente limpias duplicados con un clic
                        </div>
                        <div className="flex items-center">
                            <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">5</span>
                            Buscas en el inventario y seleccionas las tarimas necesarias
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}