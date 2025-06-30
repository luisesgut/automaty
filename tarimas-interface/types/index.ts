// types/index.ts

export interface Tarima {
    claveProducto: string;
    lote: string;
    nombreProducto: string;
    unidad: string;
    almacen: string;
    cantidad: number;
    po: string;
    pesoBruto: number;
    pesoNeto: number;
    cajas: number;
    ordenSAP: string;
    prodEtiquetaRFIDId: number;
    itemNumber: string;
    individualUnits: number;
    totalUnits: number;
    uom: string;
    asignadoAentrega: boolean;
}

export interface ParsedExcelItem {
    PO: string;
    ItemNumber: string;
}

export interface ApiFilterResponseItem {
    filtroSolicitado: {
        po: string;
        itemNumber: string;
    };
    totalEncontrados: number;
    datos: Tarima[];
}

export type ActiveTab = "tarimas" | "excel" | "releases";

export interface TarimasStats {
    totalCajas: number;
    totalPesoBruto: number;
    totalPesoNeto: number;
    totalCantidad: number;
    unidadPredominante: string;
    cantidadFormateada: string;
}

export interface ExcelState {
    pastedText: string;
    parsedData: ParsedExcelItem[];
    showPreview: boolean;
    apiResults: ApiFilterResponseItem[] | null;
    isFetching: boolean;
    error: string | null;
    searchAttempted: boolean;
}