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
import {
    CheckCircle,
    FileSpreadsheet,
    AlertCircle,
    Copy,
    Trash2
} from "lucide-react";

interface ExcelDataInputProps {
    pastedText: string;
    onTextChange: (text: string) => void;
    onVerifyData: () => void;
    isDisabled?: boolean;
}

export default function ExcelDataInput({
                                           pastedText,
                                           onTextChange,
                                           onVerifyData,
                                           isDisabled = false
                                       }: ExcelDataInputProps) {
    const handleClearText = () => {
        onTextChange("");
    };

    const handleExamplePaste = () => {
        const exampleText =
            "12793 002-00-55115-04\n12813 1318\n12833 CF-004\n12850 0930N\n12842 9801905\n12880 002-40-55010-06\n12249 0930M";
        onTextChange(exampleText);
    };

    return (
        <Card className="shadow-xl dark:bg-slate-800 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
                <CardTitle className="text-xl flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg mr-3">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Entrada de Datos desde Excel
                </CardTitle>
                <CardDescription className="text-base">
                    Copia y pega los datos del Excel del cliente. El sistema detectará automáticamente el formato y parseará las columnas <strong>PO</strong> y <strong>Customer Item</strong>.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Formatos soportados:
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
                        <div>
                            <p className="font-medium mb-1">📋 Formato de líneas separadas:</p>
                            <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded block text-xs">
                                12793 002-00-55115-04<br />
                                12813 1318<br />
                                12833 CF-004
                            </code>
                        </div>
                        <div>
                            <p className="font-medium mb-1">📋 Formato en una línea:</p>
                            <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded block text-xs">
                                12793 002-00-55115-04 12813 1318 12833 CF-004
                            </code>
                        </div>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        💡 <strong>Tip:</strong> Simplemente selecciona las dos columnas en Excel y pégalas aquí. El sistema las procesará automáticamente.
                    </p>
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
                        placeholder={`Pega aquí los datos del Excel...\n\nEjemplo:\n12793 002-00-55115-04\n12813 1318\n12833 CF-004`}
                        value={pastedText}
                        onChange={(e) => onTextChange(e.target.value)}
                        rows={10}
                        disabled={isDisabled}
                        className="shadow-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-700 dark:border-slate-600 dark:focus:border-primary border-2 transition-all duration-200 font-mono text-sm"
                    />

                    {pastedText && (
                        <div className="flex justify-between text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 p-2 rounded">
                            <span>📊 {pastedText.split('\n').filter(line => line.trim().length > 0).length} líneas detectadas</span>
                            <span>📝 {pastedText.length} caracteres</span>
                            <span>🔍 {pastedText.split(/\s+/).filter(part => part.trim().length > 0).length} elementos</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={onVerifyData}
                        disabled={!pastedText.trim() || isDisabled}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-200 hover:scale-105"
                        size="lg"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verificar y Parsear Datos
                    </Button>

                    {pastedText && (
                        <div className="text-sm text-muted-foreground flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Haz clic para procesar los datos y ver la vista previa
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Proceso del flujo:
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
                            El sistema parsea automáticamente y muestra vista previa
                        </div>
                        <div className="flex items-center">
                            <span className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3">4</span>
                            Buscas en el inventario y seleccionas las tarimas necesarias
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
