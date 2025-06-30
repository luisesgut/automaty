// components/shared/UnitDetails.tsx
import { Badge } from "@/components/ui/badge";
import { Calculator, Package, Layers } from "lucide-react";

interface UnitDetailsProps {
    cajas: number;
    individualUnits?: number;
    totalUnits?: number;
    variant?: "table" | "card" | "inline";
}

export default function UnitDetails({
                                        cajas,
                                        individualUnits,
                                        totalUnits,
                                        variant = "table"
                                    }: UnitDetailsProps) {
    const unitsPerBox = individualUnits || 0;
    const totalCalculated = cajas * unitsPerBox;
    const totalActual = totalUnits || totalCalculated;

    if (variant === "table") {
        return (
            <div className="space-y-2">
                {/* Cajas */}
                <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-blue-500" />
                    <span className="font-semibold">{cajas}</span>
                    <span className="text-xs text-muted-foreground">cajas</span>
                </div>

                {/* Piezas por caja */}
                <div className="flex items-center gap-2">
                    <Calculator className="h-3 w-3 text-indigo-500" />
                    <span className="text-sm font-medium">{unitsPerBox.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">pzs/caja</span>
                </div>

                {/* Total */}
                <div className="flex items-center gap-2">
                    <Layers className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-semibold text-green-600">{totalActual.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">total</span>
                </div>
            </div>
        );
    }

    if (variant === "card") {
        return (
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <div className="flex items-center justify-center mb-1">
                        <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold text-blue-600">{cajas}</p>
                    <p className="text-xs text-muted-foreground">Cajas</p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded">
                    <div className="flex items-center justify-center mb-1">
                        <Calculator className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-lg font-bold text-indigo-600">{unitsPerBox.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Pzs/Caja</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <div className="flex items-center justify-center mb-1">
                        <Layers className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-600">{totalActual.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                </div>
            </div>
        );
    }

    // variant === "inline"
    return (
        <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Package className="h-3 w-3 mr-1" />
                {cajas} cajas
            </Badge>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                <Calculator className="h-3 w-3 mr-1" />
                {unitsPerBox.toLocaleString()} pzs/caja
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
                <Layers className="h-3 w-3 mr-1" />
                {totalActual.toLocaleString()} total
            </Badge>
        </div>
    );
}