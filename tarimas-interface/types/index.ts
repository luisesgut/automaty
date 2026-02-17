// types/index.ts

export interface Tarima {
    claveProducto: string | null;
    lote: string | null;
    nombreProducto: string | null;
    unidad: string | null;
    almacen: string | null;
    cantidad: number | null;
    po: string | null;
    pesoBruto: number | null;
    pesoNeto: number | null;
    cajas: number | null;
    ordenSAP: string | null;
    prodEtiquetaRFIDId: number;
    itemNumber: string | null;
    individualUnits: number | null;
    totalUnits: number | null;
    uom: string | null;
    asignadoAentrega: boolean | null;
    trazabilidad?: string | null;
    loteCliente?: string | null;
}

export type TarimasDataSource = "endpoint" | "excel";

export interface TarimasExcelImportReport {
    fileName: string;
    totalRows: number;
    importedRows: number;
    invalidRows: number;
    errors: string[];
    importedAt: string;
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
  // Campos existentes
  totalCajas: number;
  totalPesoBruto: number;
  totalPesoNeto: number;
  totalCantidad: number;
  unidadPredominante: string;
  cantidadFormateada: string;
  
  // NUEVOS campos para compatibilidad con SelectedTarimasPreview
  totalTarimas: number;
  productosUnicos: number;
  totalUnidades: number;
  tarimasPendientes: number;
  tarimasAsignadas: number;
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
